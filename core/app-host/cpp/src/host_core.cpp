#include "host_core.h"

#include <emscripten/bind.h>

#include <array>
#include <cstdio>
#include <filesystem>
#include <fstream>
#include <future>
#include <random>
#include <sstream>

namespace crossbind::app {

namespace {

class VectorBuffer : public jsi::MutableBuffer {
public:
    explicit VectorBuffer(std::vector<uint8_t> bytes) : bytes_(std::move(bytes)) {}
    size_t size() const override { return bytes_.size(); }
    uint8_t *data() override { return bytes_.data(); }

private:
    std::vector<uint8_t> bytes_;
};

constexpr char B64[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

std::string toBase64(const uint8_t *bytes, size_t length) {
    std::string out;
    out.reserve((length + 2) / 3 * 4);
    size_t i = 0;
    for (; i + 2 < length; i += 3) {
        const uint32_t n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
        out += B64[n >> 18];
        out += B64[(n >> 12) & 63];
        out += B64[(n >> 6) & 63];
        out += B64[n & 63];
    }
    if (i < length) {
        const uint32_t n = (bytes[i] << 16) | ((i + 1 < length ? bytes[i + 1] : 0) << 8);
        out += B64[n >> 18];
        out += B64[(n >> 12) & 63];
        out += i + 1 < length ? B64[(n >> 6) & 63] : '=';
        out += '=';
    }
    return out;
}

std::vector<uint8_t> fromBase64(const std::string &text) {
    static const auto index = [] {
        std::array<uint8_t, 256> table{};
        for (uint8_t i = 0; i < 64; i += 1) table[static_cast<uint8_t>(B64[i])] = i;
        return table;
    }();
    const size_t padding = text.size() >= 2 && text[text.size() - 1] == '=' ? (text[text.size() - 2] == '=' ? 2 : 1) : 0;
    std::vector<uint8_t> bytes(text.size() / 4 * 3 - padding);
    size_t o = 0;
    for (size_t i = 0; i + 3 < text.size(); i += 4) {
        const uint32_t n = (index[static_cast<uint8_t>(text[i])] << 18) | (index[static_cast<uint8_t>(text[i + 1])] << 12)
            | (index[static_cast<uint8_t>(text[i + 2])] << 6) | index[static_cast<uint8_t>(text[i + 3])];
        if (o < bytes.size()) bytes[o++] = n >> 16;
        if (o < bytes.size()) bytes[o++] = (n >> 8) & 255;
        if (o < bytes.size()) bytes[o++] = n & 255;
    }
    return bytes;
}

std::vector<uint8_t> bytesOf(const std::string &text) { return std::vector<uint8_t>(text.begin(), text.end()); }

// 128 random bits, as hex.
std::string randomToken() {
    std::random_device random;
    char token[33];
    std::snprintf(token, sizeof token, "%08x%08x%08x%08x", random(), random(), random(), random());
    return token;
}

// A reply the page decodes as a failed call.
std::string errorReply(const std::string &message) {
    std::string escaped;
    for (const char c : message) {
        if (static_cast<unsigned char>(c) < 0x20) {
            escaped += ' ';
            continue;
        }
        if (c == '"' || c == '\\') escaped += '\\';
        escaped += c;
    }
    return "[1,{\"name\":\"Error\",\"message\":\"" + escaped + "\"}]";
}

void setFunction(jsi::Runtime &rt, const char *name, unsigned params, jsi::HostFunctionType fn) {
    rt.global().setProperty(rt, name, jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), params, std::move(fn)));
}

// The page's requests for bytes, each answered by a function of the host bundle: a message with its attachments in the
// request body, and a large result read after its reply.
const std::map<std::string, std::string> ROUTES{
    {"/b/frame", "__crossbind_frame"},
    {"/b/result", "__crossbind_result"},
};

const std::map<std::string, std::string> MIME_TYPES{
    {"html", "text/html; charset=utf-8"},
    {"js", "text/javascript; charset=utf-8"},
    {"mjs", "text/javascript; charset=utf-8"},
    {"css", "text/css; charset=utf-8"},
    {"json", "application/json"},
    {"map", "application/json"},
    {"txt", "text/plain; charset=utf-8"},
    {"svg", "image/svg+xml"},
    {"png", "image/png"},
    {"jpg", "image/jpeg"},
    {"jpeg", "image/jpeg"},
    {"gif", "image/gif"},
    {"webp", "image/webp"},
    {"ico", "image/x-icon"},
    {"wasm", "application/wasm"},
    {"woff", "font/woff"},
    {"woff2", "font/woff2"},
};

SchemeResponse binaryCall(jsi::Runtime &rt, const std::string &function, SchemeRequest &request) {
    jsi::ArrayBuffer body(rt, std::make_shared<VectorBuffer>(std::move(request.body)));
    auto reply = rt.global().getPropertyAsFunction(rt, function.c_str()).call(rt, jsi::String::createFromUtf8(rt, request.query), std::move(body));
    if (reply.isString()) return SchemeResponse{200, "application/json", bytesOf(reply.asString(rt).utf8(rt))};
    auto view = reply.asObject(rt);
    auto buffer = view.getProperty(rt, "buffer").asObject(rt).getArrayBuffer(rt);
    const auto offset = static_cast<size_t>(view.getProperty(rt, "byteOffset").asNumber());
    const auto length = static_cast<size_t>(view.getProperty(rt, "byteLength").asNumber());
    const uint8_t *data = buffer.data(rt) + offset;
    return SchemeResponse{200, "application/octet-stream", std::vector<uint8_t>(data, data + length)};
}

// A file of the page: a directory names its index.html, and no path leaves the page's directory.
SchemeResponse pageFile(const std::string &pageDir, const std::string &path) {
    if (path.find("..") != std::string::npos) return SchemeResponse{404, "text/plain", {}};
    std::filesystem::path file = pageDir + path;
    std::error_code error;
    if (std::filesystem::is_directory(file, error)) file /= "index.html";
    std::ifstream stream(file, std::ios::binary);
    if (!stream) return SchemeResponse{404, "text/plain", {}};
    std::ostringstream content;
    content << stream.rdbuf();
    const std::string extension = file.extension().string();
    const auto mime = extension.empty() ? MIME_TYPES.end() : MIME_TYPES.find(extension.substr(1));
    return SchemeResponse{200, mime == MIME_TYPES.end() ? "application/octet-stream" : mime->second, bytesOf(content.str())};
}

}  // namespace

std::string readFile(const std::string &path) {
    std::ifstream file(path, std::ios::binary);
    if (!file) throw std::runtime_error("cannot read " + path);
    std::ostringstream text;
    text << file.rdbuf();
    return text.str();
}

void JsThread::start(Task boot) {
    thread_ = std::thread([this, boot = std::move(boot)] { loop(boot); });
}

void JsThread::post(Task task) {
    {
        std::lock_guard<std::mutex> lock(mutex_);
        tasks_.push_back(std::move(task));
    }
    wake_.notify_one();
}

void JsThread::postAfter(double ms, Task task) {
    {
        std::lock_guard<std::mutex> lock(mutex_);
        timers_.emplace(Clock::now() + std::chrono::microseconds(static_cast<long long>(ms * 1000)), std::move(task));
    }
    wake_.notify_one();
}

void JsThread::stop() {
    {
        std::lock_guard<std::mutex> lock(mutex_);
        stopping_ = true;
    }
    wake_.notify_one();
    if (thread_.joinable()) thread_.join();
}

JsThread::Task JsThread::next() {
    std::unique_lock<std::mutex> lock(mutex_);
    for (;;) {
        if (!tasks_.empty()) {
            Task task = std::move(tasks_.front());
            tasks_.pop_front();
            return task;
        }
        if (!timers_.empty() && timers_.begin()->first <= Clock::now()) {
            Task task = std::move(timers_.begin()->second);
            timers_.erase(timers_.begin());
            return task;
        }
        if (stopping_) return nullptr;
        if (timers_.empty()) {
            wake_.wait(lock);
        } else {
            wake_.wait_until(lock, timers_.begin()->first);
        }
    }
}

void JsThread::loop(const Task &boot) {
    auto config = ::hermes::vm::RuntimeConfig::Builder().withMicrotaskQueue(true).withES6BlockScoping(true).build();
    runtime_ = facebook::hermes::makeHermesRuntime(config);
    run(boot);
    while (Task task = next()) run(task);
}

void JsThread::run(const Task &task) {
    try {
        task(*runtime_);
        while (!runtime_->drainMicrotasks()) {
        }
    } catch (const jsi::JSError &error) {
        std::fprintf(stderr, "crossbind: %s\n%s\n", error.getMessage().c_str(), error.getStack().c_str());
    } catch (const std::exception &error) {
        std::fprintf(stderr, "crossbind: %s\n", error.what());
    }
}

void Core::installHostFunctions(jsi::Runtime &rt) {
    rt.global().setProperty(rt, "__host_token", jsi::String::createFromAscii(rt, token_));
    setFunction(rt, "__host_log", 2, [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t) {
        const std::string level = args[0].asString(rt).utf8(rt);
        std::FILE *out = level == "warn" || level == "error" ? stderr : stdout;
        std::fprintf(out, "%s\n", args[1].asString(rt).utf8(rt).c_str());
        std::fflush(out);
        return jsi::Value::undefined();
    });
    setFunction(rt, "__host_timer", 2, [this](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t) {
        const double id = args[0].asNumber();
        js_.postAfter(args[1].asNumber(), [id](jsi::Runtime &rt) {
            rt.global().getPropertyAsFunction(rt, "__host_timer_fire").call(rt, id);
        });
        return jsi::Value::undefined();
    });
    setFunction(rt, "__host_b64encode", 3, [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t) {
        const auto buffer = args[0].asObject(rt).getArrayBuffer(rt);
        const auto offset = static_cast<size_t>(args[1].asNumber());
        const auto length = static_cast<size_t>(args[2].asNumber());
        return jsi::Value(rt, jsi::String::createFromAscii(rt, toBase64(buffer.data(rt) + offset, length)));
    });
    setFunction(rt, "__host_b64decode", 1, [](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t) {
        auto bytes = fromBase64(args[0].asString(rt).utf8(rt));
        return jsi::Value(rt, jsi::ArrayBuffer(rt, std::make_shared<VectorBuffer>(std::move(bytes))));
    });
    setFunction(rt, "__host_reply", 2, [this](jsi::Runtime &rt, const jsi::Value &, const jsi::Value *args, size_t) {
        const auto pending = replies_.find(args[0].asString(rt).utf8(rt));
        if (pending != replies_.end()) {
            const ReplyFn reply = std::move(pending->second);
            replies_.erase(pending);
            reply(args[1].asString(rt).utf8(rt));
        }
        return jsi::Value::undefined();
    });
}

std::string Core::boot(std::string bundle, const std::string &sourceUrl, const std::string &dataPath) {
    token_ = randomToken();
    std::promise<std::string> booted;
    js_.start([&](jsi::Runtime &rt) {
        try {
            installHostFunctions(rt);
            rt.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(std::move(bundle)), sourceUrl);
            emscripten::internal::_embind_initialize_bindings(rt, dataPath);
            rt.global().getPropertyAsFunction(rt, "__crossbind_start").call(rt);
            booted.set_value("");
        } catch (const jsi::JSError &error) {
            booted.set_value(error.getMessage() + "\n" + error.getStack());
        } catch (const std::exception &error) {
            booted.set_value(error.what());
        }
    });
    return booted.get_future().get();
}

void Core::receive(std::string message, ReplyFn reply) {
    js_.post([this, message = std::move(message), reply = std::move(reply)](jsi::Runtime &rt) {
        const std::string call = std::to_string(nextReply_++);
        replies_.emplace(call, reply);
        try {
            rt.global().getPropertyAsFunction(rt, "__crossbind_receive")
                .call(rt, jsi::String::createFromUtf8(rt, call), jsi::String::createFromUtf8(rt, message));
        } catch (const std::exception &error) {
            replies_.erase(call);
            reply(errorReply(error.what()));
        }
    });
}

void Core::serve(SchemeRequest request, SchemeRespond answer) {
    SchemeRespond respond = cors ? SchemeRespond([answer = std::move(answer)](SchemeResponse response) {
        response.headers.emplace_back("Access-Control-Allow-Origin", "*");
        answer(std::move(response));
    })
                                 : std::move(answer);
    const auto route = ROUTES.find(request.path);
    if (route == ROUTES.end()) {
        respond(pageFile(pageDir_, request.path));
        return;
    }
    if (("&" + request.query + "&").find("&t=" + token_ + "&") == std::string::npos) {
        respond(SchemeResponse{403, "text/plain", bytesOf("crossbind: this request does not carry the page's token")});
        return;
    }
    js_.post([function = route->second, request = std::move(request), respond = std::move(respond)](jsi::Runtime &rt) mutable {
        try {
            respond(binaryCall(rt, function, request));
        } catch (const std::exception &error) {
            respond(SchemeResponse{500, "text/plain", bytesOf(error.what())});
        }
    });
}

void Core::reset() {
    js_.post([](jsi::Runtime &rt) { rt.global().getPropertyAsFunction(rt, "__crossbind_reset").call(rt); });
}

}  // namespace crossbind::app

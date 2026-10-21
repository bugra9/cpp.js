// The app's functions as its code and its page call them: the module's code through <crossbind/app.h>, which waits for
// the main thread to do the work, and the page through crossbind/app, which the host answers once the work is done.
#include "host_core.h"
// Where app.openPath lets the page open files, which crossbind writes for every app's host.
#include "crossbind_app.h"

#include <algorithm>
#include <atomic>
#include <cctype>
#include <chrono>
#include <cstdio>
#include <filesystem>
#include <future>
#include <memory>
#include <mutex>
#include <stdexcept>
#include <thread>
#include <type_traits>

namespace crossbind::app {

std::filesystem::path pathOf(const std::string &text) { return std::filesystem::path(std::u8string(text.begin(), text.end())); }

namespace {

namespace fs = std::filesystem;

// The main thread answers waits from the module's start until the app quits; outside that span a wait would hang.
std::atomic<bool> answering{false};
// How often a wait looks whether the app has begun to quit.
constexpr auto QUIT_CHECK = std::chrono::milliseconds(50);
// One dialog at a time: another would open inside the first one's modal loop.
std::atomic<bool> dialogOpen{false};
// What the user picked in a dialog during this run: "picked" in where the page reaches.
std::mutex grantedMutex;
std::vector<fs::path> granted;

// ASCII alone, whatever locale GTK sets.
char lower(char c) { return c >= 'A' && c <= 'Z' ? static_cast<char>(c - 'A' + 'a') : c; }

// An address opens outside the app only when it is one a browser or a mail app takes. It goes on in ASCII, with a space,
// a quote, any other byte and a % that escapes nothing escaped: every system opens it alike, no handler's command line
// splits it, and Windows finds no %VARIABLE% to expand in it.
std::string checkedUrl(const std::string &url) {
    const auto colon = url.find(':');
    std::string scheme = url.substr(0, colon == std::string::npos ? 0 : colon);
    std::transform(scheme.begin(), scheme.end(), scheme.begin(), lower);
    const bool hasControl = std::any_of(url.begin(), url.end(), [](unsigned char c) { return c < ' ' || c == 0x7f; });
    if ((scheme != "http" && scheme != "https" && scheme != "mailto") || hasControl) {
        throw std::invalid_argument("crossbind: openExternal opens http, https and mailto addresses alone, not " + url);
    }
    std::string escaped;
    for (size_t i = 0; i < url.size(); i += 1) {
        const unsigned char c = url[i];
        const bool isEscape = c == '%' && i + 2 < url.size() && std::isxdigit(static_cast<unsigned char>(url[i + 1])) &&
                              std::isxdigit(static_cast<unsigned char>(url[i + 2]));
        if (c < 0x80 && c != ' ' && c != '"' && (c != '%' || isEscape)) {
            escaped += static_cast<char>(c);
            continue;
        }
        char hex[4];
        std::snprintf(hex, sizeof hex, "%%%02X", c);
        escaped += hex;
    }
    return escaped;
}

// A relative path would mean the host's own working folder.
void checkPath(const std::string &path, const char *function) {
    if (path.empty() || path.find('\0') != std::string::npos || !pathOf(path).is_absolute()) {
        throw std::invalid_argument(std::string("crossbind: ") + function + " takes an absolute path, not \"" + path + "\"");
    }
}

// A path as written, without a trailing separator: comparing never touches the disk or a network share.
fs::path normal(std::string text) {
#ifdef _WIN32
    // Windows names a file in any case.
    std::transform(text.begin(), text.end(), text.begin(), lower);
#endif
    const fs::path path = pathOf(text).lexically_normal();
    return path.has_filename() ? path : path.parent_path();
}

bool isWithin(const fs::path &path, const fs::path &folder) {
    return std::mismatch(folder.begin(), folder.end(), path.begin(), path.end()).first == folder.end();
}

// The page reaches places by name: the app's folders as app.paths() names them, and "picked", what its dialogs picked, a
// picked folder with what is in it. The app's own code reaches any path.
void checkScope(const std::string &path, const char *function, const std::vector<std::string> &places, const char *rule) {
    const fs::path asked = normal(path);
    const Paths folders = appPaths();
    std::vector<fs::path> allowed;
    for (const auto &place : places) {
        if (place == "data") allowed.push_back(normal(folders.data));
        if (place == "cache") allowed.push_back(normal(folders.cache));
        if (place == "logs") allowed.push_back(normal(folders.logs));
        if (place == "picked") {
            std::lock_guard<std::mutex> lock(grantedMutex);
            allowed.insert(allowed.end(), granted.begin(), granted.end());
        }
    }
    if (std::none_of(allowed.begin(), allowed.end(), [&](const fs::path &folder) { return isWithin(asked, folder); })) {
        throw std::invalid_argument(std::string("crossbind: the page's ") + function + " " + rule + ", not " + path +
                                    "; the app's native code reaches any path through <crossbind/app.h>");
    }
}

void grant(const std::string &path) {
    std::lock_guard<std::mutex> lock(grantedMutex);
    granted.push_back(normal(path));
}

void grant(const std::vector<std::string> &paths) {
    for (const auto &path : paths) grant(path);
}

// An extension goes without its dot, whoever gave it.
template <typename Options>
Options withoutDots(Options options) {
    for (auto &filter : options.filters) {
        for (auto &extension : filter.extensions) {
            if (!extension.empty() && extension[0] == '.') extension.erase(0, 1);
            if (extension.empty()) throw std::invalid_argument("crossbind: the filter " + filter.name + " has an empty extension");
        }
    }
    return options;
}

// Shows a dialog unless one is open, and lets the page reach what its user picked.
template <typename Options, typename T>
void showDialog(void (*show)(Options, std::function<void(T)>), std::type_identity_t<Options> options,
                std::type_identity_t<std::function<void(T)>> done) {
    if (dialogOpen.exchange(true)) throw std::runtime_error("crossbind: another dialog is open");
    try {
        show(withoutDots(std::move(options)), [done = std::move(done)](T result) {
            if (result) grant(*result);
            dialogOpen = false;
            done(std::move(result));
        });
    } catch (...) {
        dialogOpen = false;
        throw;
    }
}

// Waits for what the main thread hands done. The promise is shared, as done may run after the wait has given up, and a
// done dropped unrun breaks it rather than hang the wait.
template <typename T, typename Start>
T wait(Start start) {
    if (!answering) throw std::runtime_error("crossbind: <crossbind/app.h> answers once the app's module has started, until the app quits");
    auto result = std::make_shared<std::promise<T>>();
    auto answer = result->get_future();
    start([result](T value) { result->set_value(std::move(value)); });
    result.reset();
    while (answer.wait_for(QUIT_CHECK) == std::future_status::timeout) {
        if (!answering) throw std::runtime_error("crossbind: the app quit before it answered");
    }
    return answer.get();
}

void waitDone(const std::function<void(std::function<void(Failure)>)> &start) {
    if (const Failure failure = wait<Failure>(start)) throw std::runtime_error(*failure);
}

std::string json(const std::string &text) {
    std::string out = "\"";
    for (const unsigned char c : text) {
        if (c == '"' || c == '\\') {
            out += '\\';
            out += static_cast<char>(c);
        } else if (c < 0x20) {
            char escaped[7];
            std::snprintf(escaped, sizeof escaped, "\\u%04x", c);
            out += escaped;
        } else {
            out += static_cast<char>(c);
        }
    }
    return out + '"';
}

std::string json(const std::vector<std::string> &items) {
    std::string out = "[";
    for (const auto &item : items) out += (out.size() > 1 ? "," : "") + json(item);
    return out + "]";
}

std::string ok(const std::string &value) { return "[0," + value + "]"; }

std::function<void(Failure)> answered(ReplyFn reply) {
    return [reply = std::move(reply)](Failure failure) { reply(failure ? errorReply(*failure) : ok("null")); };
}

// The updater downloads, so the page's calls of it run on a thread of their own, which answers them. Without one they
// fail at once on the module's thread: an Android app answers from threads Java knows alone.
void inBackground(ReplyFn reply, std::function<std::string()> work) {
    auto answer = [reply = std::move(reply), work = std::move(work)] {
        std::string result;
        try {
            result = work();
        } catch (const std::exception &error) {
            result = errorReply(error.what());
        } catch (...) {
            result = errorReply("crossbind: the updater failed");
        }
        reply(result);
    };
#ifdef CROSSBIND_APP_UPDATER_URL
    std::thread(std::move(answer)).detach();
#else
    answer();
#endif
}

jsi::Value property(jsi::Runtime &rt, const jsi::Value &options, const char *key) {
    return options.isObject() ? options.asObject(rt).getProperty(rt, key) : jsi::Value::undefined();
}

std::string text(jsi::Runtime &rt, const jsi::Value &options, const char *key) {
    const jsi::Value value = property(rt, options, key);
    return value.isUndefined() ? std::string() : value.asString(rt).utf8(rt);
}

bool flag(jsi::Runtime &rt, const jsi::Value &options, const char *key) {
    const jsi::Value value = property(rt, options, key);
    return !value.isUndefined() && value.asBool();
}

std::vector<std::string> texts(jsi::Runtime &rt, const jsi::Value &array) {
    std::vector<std::string> out;
    if (array.isUndefined()) return out;
    const jsi::Array items = array.asObject(rt).asArray(rt);
    for (size_t i = 0; i < items.size(rt); i += 1) out.push_back(items.getValueAtIndex(rt, i).asString(rt).utf8(rt));
    return out;
}

std::vector<FileFilter> filters(jsi::Runtime &rt, const jsi::Value &options) {
    std::vector<FileFilter> out;
    const jsi::Value value = property(rt, options, "filters");
    if (value.isUndefined()) return out;
    const jsi::Array items = value.asObject(rt).asArray(rt);
    for (size_t i = 0; i < items.size(rt); i += 1) {
        const jsi::Value filter = items.getValueAtIndex(rt, i);
        out.push_back({text(rt, filter, "name"), texts(rt, property(rt, filter, "extensions"))});
    }
    return out;
}

}  // namespace

void answerWaits(bool answer) { answering = answer; }

std::optional<std::vector<std::string>> openDialog(const OpenOptions &options) {
    return wait<Picked>([&](std::function<void(Picked)> done) { showDialog(showOpenDialog, options, std::move(done)); });
}

std::optional<std::string> saveDialog(const SaveOptions &options) {
    return wait<std::optional<std::string>>(
        [&](std::function<void(std::optional<std::string>)> done) { showDialog(showSaveDialog, options, std::move(done)); });
}

void openExternal(const std::string &url) {
    const std::string address = checkedUrl(url);
    waitDone([&](std::function<void(Failure)> done) { openUrl(address, std::move(done)); });
}

void openPath(const std::string &path) {
    checkPath(path, "openPath");
    waitDone([&](std::function<void(Failure)> done) { openFile(path, std::move(done)); });
}

void revealInFolder(const std::string &path) {
    checkPath(path, "revealInFolder");
    waitDone([&](std::function<void(Failure)> done) { revealFile(path, std::move(done)); });
}

Paths paths() { return appPaths(); }

void quit() { quitApp(); }

void emitEvent(const std::string &event, const std::string &json) { postEvent(event, json); }

void callApp(jsi::Runtime &rt, const std::string &name, const jsi::Value &options, ReplyFn reply) {
    try {
        if (name == "dialog.open") {
            OpenOptions open{text(rt, options, "title"), text(rt, options, "defaultPath"), filters(rt, options),
                             flag(rt, options, "directory"), flag(rt, options, "multiple")};
            showDialog(showOpenDialog, std::move(open), [reply](Picked picked) { reply(ok(picked ? json(*picked) : "null")); });
        } else if (name == "dialog.save") {
            SaveOptions save{text(rt, options, "title"), text(rt, options, "defaultPath"), text(rt, options, "defaultName"),
                             filters(rt, options)};
            showDialog(showSaveDialog, std::move(save), [reply](std::optional<std::string> file) { reply(ok(file ? json(*file) : "null")); });
        } else if (name == "shell.openExternal") {
            openUrl(checkedUrl(text(rt, options, "url")), answered(reply));
        } else if (name == "shell.openPath") {
            const std::string path = text(rt, options, "path");
            checkPath(path, "shell.openPath");
            // Opening a program runs it: the page opens files where the app lets it alone.
            checkScope(path, "shell.openPath", CROSSBIND_APP_OPEN_PATH,
                       "opens what app.openPath in crossbind.config.js lists of data, cache, logs and picked");
            openFile(path, answered(reply));
        } else if (name == "shell.revealInFolder") {
            const std::string path = text(rt, options, "path");
            checkPath(path, "shell.revealInFolder");
            checkScope(path, "shell.revealInFolder", {"data", "cache", "logs", "picked"}, "reaches the app's folders and what its dialogs picked");
            revealFile(path, answered(reply));
        } else if (name == "app.paths") {
            const Paths folders = appPaths();
            reply(ok("{\"data\":" + json(folders.data) + ",\"cache\":" + json(folders.cache) + ",\"logs\":" + json(folders.logs) + "}"));
        } else if (name == "app.quit") {
            // A platform whose apps do not quit themselves throws, and the page hears that alone.
            quitApp();
            reply(ok("null"));
        } else if (name == "updater.check") {
            inBackground(reply, [] {
                const std::optional<std::string> version = checkForUpdate();
                return ok(version ? "{\"version\":" + json(*version) + "}" : "null");
            });
        } else if (name == "updater.install") {
            inBackground(reply, [] {
                installUpdate();
                return ok("null");
            });
        } else {
            throw std::invalid_argument("crossbind: an app has no function " + name);
        }
    } catch (const std::exception &error) {
        reply(errorReply(error.what()));
    }
}

}  // namespace crossbind::app

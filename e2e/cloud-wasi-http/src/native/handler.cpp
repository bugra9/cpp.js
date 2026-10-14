#include <crossbind/http.h>

#include <stdexcept>
#include <string>
#include <utility>

namespace crossbind::http {

constexpr size_t BIG_BODY = 3 * 1024 * 1024;

// One path per thing e2e/run.mjs proves: the request as the handler sees it, a body sent back whole, a
// status of the handler's choosing, an exception, and a body larger than the host buffers at once.
Response handle(Request request) {
    if (request.path == "/echo") return { 200, { { "content-type", "application/octet-stream" } }, std::move(request.body) };
    if (request.path == "/missing") return { 404, {}, "not found\n" };
    if (request.path == "/throw") throw std::runtime_error("thrown for " + request.path);
    if (request.path == "/big") return { 200, {}, std::string(BIG_BODY, 'x') };

    std::string text = request.method + " " + request.path + "\nquery " + request.query + "\nauthority " + request.authority + "\n";
    for (const auto &[name, value] : request.headers) {
        if (name.rfind("x-", 0) == 0) text += name + ": " + value + "\n";
    }
    return { 200, { { "content-type", "text/plain; charset=utf-8" } }, text };
}

}

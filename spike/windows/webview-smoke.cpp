// The Windows platform layer on a real WebView2: a page of crossbind://app calls the host over its reply channel, posts
// bytes to the scheme and reads them back, and reports what it saw. Exits 0 when all of it worked.
#include "platform.h"
#include "webview/webview.h"

#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <string>
#include <thread>

namespace {

constexpr const char *PAGE = R"html(<!doctype html><meta charset="utf-8"><title>smoke</title><script>
(async () => {
  const checks = [];
  try {
    const reply = await window.webkit.messageHandlers.crossbind.postMessage('ping');
    checks.push(reply === 'pong:ping' ? 'reply' : `reply=${reply}`);
    const sent = new Uint8Array(70000).map((_, i) => i % 251);
    const response = await fetch('crossbind://app/b/echo?n=1', { method: 'POST', body: sent });
    const echoed = new Uint8Array(await response.arrayBuffer());
    checks.push(echoed.length === sent.length && echoed.every((b, i) => b === sent[i]) ? 'bytes' : `bytes=${echoed.length}`);
    checks.push(response.headers.get('x-crossbind') === 'yes' ? 'headers' : 'no-headers');
    checks.push(location.origin === 'crossbind://app' ? 'origin' : `origin=${location.origin}`);
    checks.push(window.isSecureContext ? 'secure' : 'insecure');
    console.log('the console reaches the host');
  } catch (error) {
    checks.push(`error ${error.message}`);
  }
  window.webkit.messageHandlers.crossbind.postMessage(`done ${checks.join(',')}`);
})();
</script>)html";

}  // namespace

int main() {
    // Before the webview, whose making waits for WebView2.
    std::thread([] {
        Sleep(60000);
        std::printf("timed out\n");
        std::fflush(stdout);
        std::_Exit(2);
    }).detach();
    webview::detail::win32_environment_options_hook = [] {
        return static_cast<ICoreWebView2EnvironmentOptions *>(schemeEnvironmentOptions("crossbind", {}));
    };
    webview::webview view(false, nullptr);
    view.set_title("crossbind windows smoke");
    view.set_size(800, 600, WEBVIEW_HINT_NONE);
    void *webView = view.browser_controller().value();
    registerSchemeHandler(webView, "crossbind", [](SchemeRequest request, SchemeRespond respond) {
        SchemeResponse response;
        if (request.path == "/") {
            response.mime = "text/html";
            response.body.assign(PAGE, PAGE + std::strlen(PAGE));
        } else if (request.path == "/b/echo" && request.method == "POST") {
            response.body = std::move(request.body);
            response.headers.emplace_back("X-Crossbind", "yes");
        } else {
            response.status = 404;
        }
        // From another thread, as the host core answers.
        std::thread([respond = std::move(respond), response = std::move(response)]() mutable { respond(std::move(response)); }).detach();
    });
    installReplyChannel(webView, "crossbind", [](std::string origin, std::string message, ReplyFn reply) {
        if (message.rfind("done ", 0) == 0) {
            const bool ok = message == "done reply,bytes,headers,origin,secure" && origin == "crossbind://app";
            std::printf("%s (from %s)\n", message.c_str(), origin.c_str());
            std::fflush(stdout);
            std::_Exit(ok ? 0 : 1);
        }
        std::thread([reply = std::move(reply), message] { reply("pong:" + message); }).detach();
    });
    forwardConsole(webView);
    restrictNavigation(webView, {"crossbind://app"}, [] {});
    view.navigate("crossbind://app/");
    view.run();
    return 3;
}

// A desktop app: a window with the system webview whose page reaches a crossbind module running in Hermes. The page
// comes from crossbind://app/, or in the debug host the dev server opens, from the URL CROSSBIND_APP_URL names. Its
// calls arrive as webview messages, their large bytes as crossbind:// request and response bodies.
#include "host_core.h"
#include "platform.h"
#include "webview/webview.h"

#include <algorithm>
#include <cstdio>
#include <cstdlib>

namespace {

constexpr const char *APP_ORIGIN = "crossbind://app";
constexpr const char *APP_URL = "crossbind://app/";
constexpr int WIDTH = 1024;
constexpr int HEIGHT = 768;
constexpr const char *REFUSED = "[1,{\"name\":\"Error\",\"message\":\"crossbind: a page from this origin may not call the app's module\"}]";

SchemeHandler schemeHandler;

std::string originOf(const std::string &url) {
    const auto scheme = url.find("://");
    if (scheme == std::string::npos) return url;
    return url.substr(0, url.find_first_of("/?#", scheme + 3));
}

#ifdef __APPLE__
// WKWebView takes its scheme handlers from the configuration it is made from.
void configureWebView(void *configuration) { registerSchemeHandler(configuration, "crossbind", schemeHandler); }
#endif

}  // namespace

int main() {
    const std::string resources = resourceDir();
#ifdef CROSSBIND_APP_DEV
    const char *devUrl = std::getenv("CROSSBIND_APP_URL");
#else
    // A release build loads its own page, whatever starts it.
    const char *devUrl = nullptr;
#endif
    crossbind::app::Core core(resources + "/page");
    core.cors = devUrl != nullptr;
    schemeHandler = [&core](SchemeRequest request, SchemeRespond respond) { core.serve(std::move(request), std::move(respond)); };
    // Bindings keep JSI values in globals, which must not be destroyed after the runtime they belong to, so the app ends
    // without running destructors.
    const auto quit = [&core](int status) {
        core.stop();
        std::fflush(nullptr);
        std::_Exit(status);
    };

    std::string bootError;
    try {
        bootError = core.boot(crossbind::app::readFile(resources + "/host.hbc"), "host.hbc", resources + "/data");
    } catch (const std::exception &error) {
        bootError = error.what();
    }
    if (!bootError.empty()) {
        std::fprintf(stderr, "crossbind: the app's module failed to start: %s\n", bootError.c_str());
        quit(1);
    }

#ifdef __APPLE__
    webview::detail::cocoa_webkit::cocoa_configure_hook = configureWebView;
#endif
    webview::webview view(devUrl != nullptr, nullptr);
    view.set_title(appName());
    view.set_size(WIDTH, HEIGHT, WEBVIEW_HINT_NONE);
    void *webView = view.browser_controller().value();

    std::vector<std::string> origins{APP_ORIGIN};
    if (devUrl) origins.push_back(originOf(devUrl));
    installReplyChannel(webView, "crossbind", [&core, origins](std::string origin, std::string message, ReplyFn reply) {
        if (std::find(origins.begin(), origins.end(), origin) == origins.end()) {
            reply(REFUSED);
            return;
        }
        core.receive(std::move(message), std::move(reply));
    });
    if (devUrl || std::getenv("CROSSBIND_APP_CONSOLE")) forwardConsole(webView);
    restrictNavigation(webView, origins, [&core] { core.reset(); });
    // Quitting from the Dock or the system ends the app as closing its window does.
    onQuit([&quit] { quit(0); });

    view.navigate(devUrl ? devUrl : APP_URL);
    view.run();
    quit(0);
}

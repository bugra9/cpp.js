// A desktop app: a window with the system webview whose page reaches a crossbind module running in Hermes. The page
// comes from crossbind://app/, or in the debug host the dev server opens, from the URL CROSSBIND_APP_URL names. Its
// calls arrive as webview messages, their large bytes as crossbind:// request and response bodies.
#include "app.h"
#include "platform.h"
#include "webview/webview.h"

namespace {

namespace app = crossbind::app;

constexpr int WIDTH = 1024;
constexpr int HEIGHT = 768;

SchemeHandler schemeHandler;

#ifdef __APPLE__
// WKWebView takes its scheme handlers from the configuration it is made from.
void configureWebView(void *configuration) { registerSchemeHandler(configuration, "crossbind", schemeHandler); }
#elif defined(_WIN32)
// WebView2 takes its schemes from the environment the webview is made in; a dev server's page requests the scheme too.
std::vector<std::string> schemeOrigins;
ICoreWebView2EnvironmentOptions *environmentOptions() {
    return static_cast<ICoreWebView2EnvironmentOptions *>(schemeEnvironmentOptions("crossbind", schemeOrigins));
}
#endif

}  // namespace

int main() {
    const char *devUrl = app::devUrl();
    app::Core &core = app::start(devUrl);
    schemeHandler = [&core](SchemeRequest request, SchemeRespond respond) { core.serve(std::move(request), std::move(respond)); };

#ifdef __APPLE__
    webview::detail::cocoa_webkit::cocoa_configure_hook = configureWebView;
#elif defined(_WIN32)
    if (devUrl) {
        const std::string url = devUrl;
        schemeOrigins.push_back(url.substr(0, url.find_first_of("/?#", url.find("://") + 3)));
    }
    webview::detail::win32_environment_options_hook = environmentOptions;
#endif
    webview::webview view(devUrl != nullptr, nullptr);
    view.set_title(appName());
    view.set_size(WIDTH, HEIGHT, WEBVIEW_HINT_NONE);
    void *webView = view.browser_controller().value();
#ifndef __APPLE__
    registerSchemeHandler(webView, "crossbind", schemeHandler);
#endif
    const std::string url = app::attach(core, webView, devUrl);
    // Quitting from the Dock or the system ends the app as closing its window does.
    onQuit([&core] { app::quit(core, 0); });

    view.navigate(url);
    view.run();
    app::quit(core, 0);
}

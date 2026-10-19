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
#endif

}  // namespace

int main() {
    const char *devUrl = app::devUrl();
    app::Core &core = app::start(devUrl);
    schemeHandler = [&core](SchemeRequest request, SchemeRespond respond) { core.serve(std::move(request), std::move(respond)); };

#ifdef __APPLE__
    webview::detail::cocoa_webkit::cocoa_configure_hook = configureWebView;
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

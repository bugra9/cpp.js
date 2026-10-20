#include "app.h"

#include <algorithm>
#include <cstdlib>

namespace crossbind::app {

namespace {

constexpr const char *APP_ORIGIN = "crossbind://app";
constexpr const char *APP_URL = "crossbind://app/";
constexpr const char *REFUSED = "[1,{\"name\":\"Error\",\"message\":\"crossbind: a page from this origin may not call the app's module\"}]";

}  // namespace

std::string originOf(const std::string &url) {
    const auto scheme = url.find("://");
    if (scheme == std::string::npos) return url;
    return url.substr(0, url.find_first_of("/?#", scheme + 3));
}

std::string attach(Core &core, void *webView, const char *devUrl) {
    std::vector<std::string> origins{APP_ORIGIN};
    if (devUrl) origins.push_back(originOf(devUrl));
    // Only the top frame gets the token every message and crossbind:// call carries: a frame of another origin, or a
    // sandboxed one, cannot read it.
    addTopFrameScript(webView, "Object.defineProperty(globalThis, '__crossbind_token', { value: '" + core.token() + "' });");
    installReplyChannel(webView, "crossbind", [&core, origins](std::string origin, std::string message, ReplyFn reply) {
        if (!origin.empty() && std::find(origins.begin(), origins.end(), origin) == origins.end()) {
            reply(REFUSED);
            return;
        }
        core.receive(std::move(message), std::move(reply));
    });
    if (devUrl || std::getenv("CROSSBIND_APP_CONSOLE")) forwardConsole(webView);
    restrictNavigation(webView, origins, [&core] { core.reset(); });
    return devUrl ? devUrl : APP_URL;
}

}  // namespace crossbind::app

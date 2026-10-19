#include "app.h"

#include <algorithm>
#include <cstdio>
#include <cstdlib>

namespace crossbind::app {

namespace {

constexpr const char *APP_ORIGIN = "crossbind://app";
constexpr const char *APP_URL = "crossbind://app/";
constexpr const char *REFUSED = "[1,{\"name\":\"Error\",\"message\":\"crossbind: a page from this origin may not call the app's module\"}]";

std::string originOf(const std::string &url) {
    const auto scheme = url.find("://");
    if (scheme == std::string::npos) return url;
    return url.substr(0, url.find_first_of("/?#", scheme + 3));
}

}  // namespace

const char *devUrl() {
#ifdef CROSSBIND_APP_DEV
    return std::getenv("CROSSBIND_APP_URL");
#else
    // A release build loads its own page, whatever starts it.
    return nullptr;
#endif
}

Core &start(const char *devUrl) {
    const std::string resources = resourceDir();
    Core &core = *new Core(resources + "/page");
    core.cors = devUrl != nullptr;
    std::string bootError;
    try {
        bootError = core.boot(readFile(resources + "/host.hbc"), "host.hbc", resources + "/data");
    } catch (const std::exception &error) {
        bootError = error.what();
    }
    if (!bootError.empty()) {
        std::fprintf(stderr, "crossbind: the app's module failed to start: %s\n", bootError.c_str());
        quit(core, 1);
    }
    return core;
}

void quit(Core &core, int status) {
    core.stop();
    std::fflush(nullptr);
    std::_Exit(status);
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

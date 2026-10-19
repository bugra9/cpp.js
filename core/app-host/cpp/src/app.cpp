#include "app.h"

#include <cstdio>
#include <cstdlib>

namespace crossbind::app {

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

}  // namespace crossbind::app

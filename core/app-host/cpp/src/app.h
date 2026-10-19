#pragma once

// What an app does around its webview, whatever makes its window: the module starts from the app's files, and the
// webview gets the page's token, the module's channel, the page's console and the navigation lock.
#include "host_core.h"

namespace crossbind::app {

// The page a debug app opens instead of its own: the dev server's, which CROSSBIND_APP_URL names. Null in a release app.
const char *devUrl();
// Starts the module from the app's files, or ends the app with the reason.
Core &start(const char *devUrl);
// Ends the app without running destructors: bindings keep JSI values in globals, which must not be destroyed after the
// runtime they belong to.
[[noreturn]] void quit(Core &core, int status);
// Readies a webview for the page, and returns the URL it opens first.
std::string attach(Core &core, void *webView, const char *devUrl);

}  // namespace crossbind::app

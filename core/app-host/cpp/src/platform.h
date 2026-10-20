#pragma once

// What a platform gives the host: the webview's channels, its URL scheme, its navigation rule and where the app's
// files are. darwin/ implements it with WKWebView on macOS and iOS (ios/ has the iOS app's own parts), linux/ with
// WebKitGTK, windows/ with WebView2.
#include <cstdint>
#include <functional>
#include <string>
#include <utility>
#include <vector>

using ReplyFn = std::function<void(const std::string &)>;
// A page message with the origin of the frame that sent it, empty where the webview does not tell it (WebKitGTK).
// reply() may be called from any thread.
using MessageHandler = std::function<void(std::string origin, std::string message, ReplyFn reply)>;

struct SchemeRequest {
    std::string method;
    std::string path;
    std::string query;
    std::vector<uint8_t> body;
};

struct SchemeResponse {
    int status = 200;
    std::string mime = "application/octet-stream";
    std::vector<uint8_t> body;
    std::vector<std::pair<std::string, std::string>> headers;
};

using SchemeRespond = std::function<void(SchemeResponse)>;
using SchemeHandler = std::function<void(SchemeRequest, SchemeRespond)>;

// A message channel whose reply resolves the page's own postMessage() promise.
void installReplyChannel(void *webView, const char *name, MessageHandler handler);
// The page's console and uncaught errors, written to this process's output.
void forwardConsole(void *webView);
// Runs a script in the top frame of every page, before the page's own.
void addTopFrameScript(void *webView, const std::string &source);
// Serves <scheme>:// requests: on macOS of the webview made from this configuration, on Linux of this web view.
// respond() may be called from any thread.
void registerSchemeHandler(void *target, const char *scheme, SchemeHandler handler);
// The webview loads only these origins, in any frame; a link to another opens in the default browser. newPage runs
// when the main frame commits another document.
void restrictNavigation(void *webView, std::vector<std::string> origins, std::function<void()> newPage);
// Runs when the app is quit other than by closing its window (the Dock on macOS, the system on iOS), before it would
// exit.
void onQuit(std::function<void()> quit);
// Where the app's files are, and its name.
std::string resourceDir();
std::string appName();

#ifdef _WIN32
// The ICoreWebView2EnvironmentOptions WebView2's environment is made with: they register the scheme, which pages of
// these other origins may request as well.
void *schemeEnvironmentOptions(const char *scheme, const std::vector<std::string> &origins);
#endif

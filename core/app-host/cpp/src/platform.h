#pragma once

// What a platform gives the host: the webview's channels, its URL scheme, its navigation rule and where the app's
// files are. darwin/ implements it with WKWebView.
#include <cstdint>
#include <functional>
#include <string>
#include <utility>
#include <vector>

using ReplyFn = std::function<void(const std::string &)>;
// A page message with the origin of the frame that sent it. reply() may be called from any thread.
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
// Serves <scheme>:// requests of the webview made from this configuration. respond() may be called from any thread.
void registerSchemeHandler(void *configuration, const char *scheme, SchemeHandler handler);
// The webview loads only these origins, in any frame; a link to another opens in the default browser. newPage runs
// when the main frame commits another document.
void restrictNavigation(void *webView, std::vector<std::string> origins, std::function<void()> newPage);
// Runs when the Dock or the system quits the app, before it would exit.
void onQuit(std::function<void()> quit);
// Where the app's files are, and its name.
std::string resourceDir();
std::string appName();

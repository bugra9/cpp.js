#pragma once

// What a platform gives the host: the webview's channels, its URL scheme, its navigation rule and where the app's
// files are. darwin/ implements it with WKWebView on macOS and iOS (ios/ has the iOS app's own parts), linux/ with
// WebKitGTK, windows/ with WebView2.
#include "crossbind/app.h"

#include <cstdint>
#include <filesystem>
#include <functional>
#include <optional>
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
// The page's alert(), confirm() and prompt(), and on macOS its file inputs, as a browser shows them. WebKitGTK and
// WebView2 show them themselves.
void showPageDialogs(void *webView);
// Tells the user why the app cannot go on: in a message box on the desktop, in the system's log on iOS and Android.
void showError(const std::string &message);
// Where the app's files are.
std::string resourceDir();

// The app's functions behind crossbind/app and <crossbind/app.h>. Each is called on the module's thread, works on the
// main thread and calls done there: a dialog with what its user picked, or nothing when they cancelled; the others with
// why they failed, or nothing. A platform that has no such function throws.
using Picked = std::optional<std::vector<std::string>>;
using Failure = std::optional<std::string>;
void showOpenDialog(crossbind::app::OpenOptions options, std::function<void(Picked)> done);
void showSaveDialog(crossbind::app::SaveOptions options, std::function<void(std::optional<std::string>)> done);
// An http, https or mailto address, which the caller has checked.
void openUrl(std::string url, std::function<void(Failure)> done);
void openFile(std::string path, std::function<void(Failure)> done);
void revealFile(std::string path, std::function<void(Failure)> done);
// The app's folders, made if missing; on any thread.
crossbind::app::Paths appPaths();
// Ends the app on the main thread, as closing its window does.
void quitApp();
// The window the app's dialogs belong to.
void setMainWindow(void *window);
// Fetches an address into a file for a desktop app's updater, on the thread that calls it, which is not the main one,
// and throws why it could not, as when the answer runs past maxBytes.
void download(const std::string &url, const std::filesystem::path &file, std::uintmax_t maxBytes);

#ifdef __APPLE__
// macOS sends the standard shortcuts, ⌘C and ⌘Q among them, through the menu bar, so a window without the app, Edit,
// View and Window menus never sees them.
void installAppMenu();
#endif

#ifdef _WIN32
// The ICoreWebView2EnvironmentOptions WebView2's environment is made with: they register the scheme, which pages of
// these other origins may request as well.
void *schemeEnvironmentOptions(const char *scheme, const std::vector<std::string> &origins);
// Starts an update's setup program, which installs it where the app is once the app has quit, and opens it anew.
void runSetup(const std::filesystem::path &setup);
#endif

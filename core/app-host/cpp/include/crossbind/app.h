#pragma once

// What an app's host does for the app's own code: the dialogs that pick files, opening an address or a file outside
// the app, the app's folders, quitting, events for the page and a desktop app's updates. The page reaches the same
// through crossbind/app, where openPath() opens files where app.openPath lets it alone and revealInFolder() shows the
// app's folders and what a dialog picked alone; here they reach any path. Call them from the module's code, which an
// app builds with CROSSBIND_APP defined, once the module has started and never on the app's main thread: the dialogs
// and the functions that open something wait for that thread, and throw when called before it can answer, as from a
// static initializer, or once the app quits. An iOS app has paths(), openExternal() and emitEvent() alone, and an
// Android app paths() and emitEvent(): the others throw there.
#include <optional>
#include <string>
#include <vector>

namespace crossbind::app {

// A kind of file a dialog offers: its name, and the extensions, with or without the dot, that make it; "*" is any file.
struct FileFilter {
    std::string name;
    std::vector<std::string> extensions;
};

struct OpenOptions {
    std::string title;
    // The folder the dialog shows first.
    std::string defaultPath;
    std::vector<FileFilter> filters;
    // Folders instead of files.
    bool directory = false;
    bool multiple = false;
};

struct SaveOptions {
    std::string title;
    // The folder the dialog shows first.
    std::string defaultPath;
    std::string defaultName;
    std::vector<FileFilter> filters;
};

// The app's own folders, made when first asked for: what it keeps, what it can lose, and its logs.
struct Paths {
    std::string data;
    std::string cache;
    std::string logs;
};

// The files or folders the user picked, or nothing when they cancelled.
std::optional<std::vector<std::string>> openDialog(const OpenOptions &options = {});
// The file the user chose to save to, or nothing when they cancelled.
std::optional<std::string> saveDialog(const SaveOptions &options = {});
// A web or mail address in the default browser or mail app: http, https and mailto alone.
void openExternal(const std::string &url);
// A file in the app the system opens its kind with, at an absolute path.
void openPath(const std::string &path);
// A file, selected, in the system's file manager.
void revealInFolder(const std::string &path);
Paths paths();
// Ends the app as closing its window does.
void quit();
// Sends the page an event, whose listeners through crossbind/app's events.on get the value json holds, a JSON text. It
// waits for nothing, so any thread may call it. A page gets the events emitted once it listens: one emitted before,
// as before the module starts or once the app quits, reaches none.
void emitEvent(const std::string &event, const std::string &json = "null");
// The version app.updater.url in crossbind.config.js offers when it is newer than this app's, or nothing. It waits for
// the download, and throws while another check or install runs.
std::optional<std::string> checkForUpdate();
// Downloads that version, checks that the key of app.updater.publicKey signed it and installs it in place of this app,
// which then quits and opens the new version. It throws when the app is up to date or the update fails.
void installUpdate();

}  // namespace crossbind::app

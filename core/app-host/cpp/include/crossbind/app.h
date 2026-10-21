#pragma once

// What an app's host does for the app's own code: the dialogs that pick files, opening an address or a file outside
// the app, the app's folders and quitting. The page reaches the same through crossbind/app, where openPath() opens
// files where app.openPath lets it alone and revealInFolder() shows the app's folders and what a dialog picked alone;
// here they reach any path. Call them from the module's code, which an app builds with CROSSBIND_APP defined, once the
// module has started and never on the app's main thread: the dialogs and the functions that open something wait for
// that thread, and throw when called before it can answer, as from a static initializer, or once the app quits. An
// iOS app has paths() and openExternal() alone, and an Android app paths(): the others throw there.
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

}  // namespace crossbind::app

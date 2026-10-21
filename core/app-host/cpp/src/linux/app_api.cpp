#include "crossbind_app.h"
#include "linux/main_thread.h"
#include "platform.h"

#include <gtk/gtk.h>

#include <cerrno>
#include <cstdlib>
#include <memory>
#include <stdexcept>

namespace {

GtkWindow *mainWindow = nullptr;

// GTK matches a pattern in one case alone, where macOS and Windows match an extension in any; "*" is any file.
std::string patternOf(const std::string &extension) {
    if (extension == "*") return "*";
    std::string pattern = "*.";
    for (const char c : extension) {
        const char lower = g_ascii_tolower(c);
        const char upper = g_ascii_toupper(c);
        pattern += lower == upper ? std::string(1, c) : std::string{'[', lower, upper, ']'};
    }
    return pattern;
}

void addFilters(GtkFileChooser *chooser, const std::vector<crossbind::app::FileFilter> &filters) {
    for (const auto &filter : filters) {
        GtkFileFilter *kind = gtk_file_filter_new();
        gtk_file_filter_set_name(kind, filter.name.c_str());
        for (const auto &extension : filter.extensions) gtk_file_filter_add_pattern(kind, patternOf(extension).c_str());
        gtk_file_chooser_add_filter(chooser, kind);
    }
}

// An XDG base directory: the variable's absolute path, else the default under the home folder.
std::string baseDirectory(const char *variable, const char *underHome) {
    const char *set = std::getenv(variable);
    if (set && *set == '/') return set;
    return std::string(g_get_home_dir()) + underHome;
}

std::string made(const std::string &path) {
    if (g_mkdir_with_parents(path.c_str(), 0700) != 0) {
        throw std::runtime_error("crossbind: cannot make the app's folder " + path + ": " + g_strerror(errno));
    }
    return path;
}

// What the system opens a URI with, or why it cannot.
Failure launch(const std::string &uri, const std::string &what) {
    GError *error = nullptr;
    if (g_app_info_launch_default_for_uri(uri.c_str(), nullptr, &error)) return std::nullopt;
    const std::string reason = error ? error->message : "nothing opens it";
    g_clear_error(&error);
    return "crossbind: cannot open " + what + ": " + reason;
}

// A file revealFile shows, until the file manager answers.
struct Reveal {
    std::string path;
    std::function<void(Failure)> done;
};

void openFolderOf(const Reveal &reveal) {
    gchar *folder = g_path_get_dirname(reveal.path.c_str());
    gchar *folderUri = g_filename_to_uri(folder, nullptr, nullptr);
    reveal.done(folderUri ? launch(folderUri, folder) : Failure("crossbind: there is no folder of " + reveal.path));
    g_free(folderUri);
    g_free(folder);
}

}  // namespace

crossbind::app::Paths appPaths() {
    const std::string id = CROSSBIND_APP_ID;
    return {made(baseDirectory("XDG_DATA_HOME", "/.local/share") + "/" + id), made(baseDirectory("XDG_CACHE_HOME", "/.cache") + "/" + id),
            made(baseDirectory("XDG_STATE_HOME", "/.local/state") + "/" + id + "/logs")};
}

// The portal's chooser where there is one, as in a Flatpak, else GTK's own; modal to the app's window.
void showOpenDialog(crossbind::app::OpenOptions options, std::function<void(Picked)> done) {
    onMainThread([options = std::move(options), done = std::move(done)] {
        GtkFileChooserNative *dialog = gtk_file_chooser_native_new(options.title.empty() ? nullptr : options.title.c_str(), mainWindow,
            options.directory ? GTK_FILE_CHOOSER_ACTION_SELECT_FOLDER : GTK_FILE_CHOOSER_ACTION_OPEN, nullptr, nullptr);
        GtkFileChooser *chooser = GTK_FILE_CHOOSER(dialog);
        gtk_file_chooser_set_select_multiple(chooser, options.multiple);
        if (!options.defaultPath.empty()) gtk_file_chooser_set_current_folder(chooser, options.defaultPath.c_str());
        addFilters(chooser, options.filters);
        Picked picked;
        if (gtk_native_dialog_run(GTK_NATIVE_DIALOG(dialog)) == GTK_RESPONSE_ACCEPT) {
            picked.emplace();
            GSList *files = gtk_file_chooser_get_filenames(chooser);
            for (GSList *file = files; file; file = file->next) {
                picked->push_back(static_cast<char *>(file->data));
                g_free(file->data);
            }
            g_slist_free(files);
        }
        g_object_unref(dialog);
        done(std::move(picked));
    });
}

void showSaveDialog(crossbind::app::SaveOptions options, std::function<void(std::optional<std::string>)> done) {
    onMainThread([options = std::move(options), done = std::move(done)] {
        GtkFileChooserNative *dialog = gtk_file_chooser_native_new(options.title.empty() ? nullptr : options.title.c_str(), mainWindow,
            GTK_FILE_CHOOSER_ACTION_SAVE, nullptr, nullptr);
        GtkFileChooser *chooser = GTK_FILE_CHOOSER(dialog);
        gtk_file_chooser_set_do_overwrite_confirmation(chooser, TRUE);
        if (!options.defaultPath.empty()) gtk_file_chooser_set_current_folder(chooser, options.defaultPath.c_str());
        if (!options.defaultName.empty()) gtk_file_chooser_set_current_name(chooser, options.defaultName.c_str());
        addFilters(chooser, options.filters);
        std::optional<std::string> file;
        if (gtk_native_dialog_run(GTK_NATIVE_DIALOG(dialog)) == GTK_RESPONSE_ACCEPT) {
            if (char *name = gtk_file_chooser_get_filename(chooser)) {
                file = name;
                g_free(name);
            }
        }
        g_object_unref(dialog);
        done(std::move(file));
    });
}

void openUrl(std::string url, std::function<void(Failure)> done) {
    onMainThread([url = std::move(url), done = std::move(done)] { done(launch(url, url)); });
}

void openFile(std::string path, std::function<void(Failure)> done) {
    onMainThread([path = std::move(path), done = std::move(done)] {
        gchar *uri = g_file_test(path.c_str(), G_FILE_TEST_EXISTS) ? g_filename_to_uri(path.c_str(), nullptr, nullptr) : nullptr;
        if (!uri) {
            done("crossbind: there is no " + path);
            return;
        }
        done(launch(uri, path));
        g_free(uri);
    });
}

// The file managers of GNOME, KDE and others show a file selected when asked over D-Bus; without one, its folder opens.
// The answer comes back to the loop, which a file manager that has to start first would hold up otherwise.
void revealFile(std::string path, std::function<void(Failure)> done) {
    onMainThread([path = std::move(path), done = std::move(done)]() mutable {
        gchar *uri = g_file_test(path.c_str(), G_FILE_TEST_EXISTS) ? g_filename_to_uri(path.c_str(), nullptr, nullptr) : nullptr;
        if (!uri) {
            done("crossbind: there is no " + path);
            return;
        }
        auto reveal = std::make_unique<Reveal>(Reveal{std::move(path), std::move(done)});
        GDBusConnection *bus = g_bus_get_sync(G_BUS_TYPE_SESSION, nullptr, nullptr);
        if (!bus) {
            openFolderOf(*reveal);
            g_free(uri);
            return;
        }
        const gchar *uris[] = {uri, nullptr};
        g_dbus_connection_call(bus, "org.freedesktop.FileManager1", "/org/freedesktop/FileManager1", "org.freedesktop.FileManager1",
                               "ShowItems", g_variant_new("(^ass)", uris, ""), nullptr, G_DBUS_CALL_FLAGS_NONE, -1, nullptr,
                               [](GObject *source, GAsyncResult *result, gpointer data) {
                                   const std::unique_ptr<Reveal> reveal(static_cast<Reveal *>(data));
                                   GVariant *shown = g_dbus_connection_call_finish(G_DBUS_CONNECTION(source), result, nullptr);
                                   if (!shown) {
                                       openFolderOf(*reveal);
                                       return;
                                   }
                                   g_variant_unref(shown);
                                   reveal->done(std::nullopt);
                               },
                               reveal.release());
        g_object_unref(bus);
        g_free(uri);
    });
}

void quitApp() {
    onMainThread([] {
        if (mainWindow) gtk_window_close(mainWindow);
    });
}

// Forgotten when the window goes, so a late quit finds none.
void setMainWindow(void *window) {
    mainWindow = GTK_WINDOW(window);
    g_object_add_weak_pointer(G_OBJECT(mainWindow), reinterpret_cast<gpointer *>(&mainWindow));
}

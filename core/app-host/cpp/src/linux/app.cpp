#include "crossbind_app.h"
#include "platform.h"

#include <gtk/gtk.h>
#include <unistd.h>

#include <climits>

namespace {

std::string executablePath() {
    char path[PATH_MAX];
    const ssize_t length = readlink("/proc/self/exe", path, sizeof path);
    return length > 0 ? std::string(path, static_cast<size_t>(length)) : std::string();
}

}  // namespace

// A Linux app is a directory: the executable, and the app's files in resources/ beside it.
std::string resourceDir() {
    const std::string executable = executablePath();
    return executable.substr(0, executable.find_last_of('/')) + "/resources";
}

// The app ends with its window; anything else ends the process as it ends any other.
void onQuit(std::function<void()>) {}

// WebKitGTK shows the page's dialogs, file inputs and downloads itself.
void showPageDialogs(void *) {}

// Without a display GTK cannot show it either, and the output alone tells it.
void showError(const std::string &message) {
    if (!gtk_init_check(nullptr, nullptr)) return;
    GtkWidget *dialog = gtk_message_dialog_new(nullptr, GTK_DIALOG_MODAL, GTK_MESSAGE_ERROR, GTK_BUTTONS_CLOSE, "%s cannot open",
                                               CROSSBIND_APP_NAME);
    gtk_message_dialog_format_secondary_text(GTK_MESSAGE_DIALOG(dialog), "%s", message.c_str());
    gtk_dialog_run(GTK_DIALOG(dialog));
    gtk_widget_destroy(dialog);
}

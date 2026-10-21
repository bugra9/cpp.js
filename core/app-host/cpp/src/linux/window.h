#pragma once

#include <gtk/gtk.h>

// The app's window, the box in it that holds the menu bar above the webview, and the webview; null until
// setMainWindow has them, and once they go.
GtkWindow *appWindow();
GtkBox *appWindowBox();
GtkWidget *appWebView();

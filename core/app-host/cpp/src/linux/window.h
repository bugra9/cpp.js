#pragma once

#include <gtk/gtk.h>

// The app's window, the box in it that holds the menu bar above the webview, and the webview; null until
// setMainWindow has them, and once they go.
GtkWindow *appWindow();
GtkBox *appWindowBox();
GtkWidget *appWebView();
// Holds the window to app.window's limits, its fixed size or the most the page grows to with the menu bar, but for while
// it fills the screen, which a window manager would hold to them as well.
void keepSizeLimits();

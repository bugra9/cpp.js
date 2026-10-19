#pragma once

#include <glib.h>

#include <functional>

// Runs fn on the GTK main loop: at once when the caller is on it, otherwise as soon as the loop gets to it.
inline void onMainThread(std::function<void()> fn) {
    g_main_context_invoke_full(
        nullptr, G_PRIORITY_DEFAULT,
        [](gpointer data) -> gboolean {
            (*static_cast<std::function<void()> *>(data))();
            return G_SOURCE_REMOVE;
        },
        new std::function<void()>(std::move(fn)), [](gpointer data) { delete static_cast<std::function<void()> *>(data); });
}

#pragma once

#include <glib.h>
#include <sys/syscall.h>
#include <unistd.h>

#include <functional>

// Runs fn on the GTK main loop: at once when the caller is the process's first thread, which runs GTK, otherwise as soon
// as the loop gets to it. g_main_context_invoke would run it on any thread that finds the loop between two iterations.
inline void onMainThread(std::function<void()> fn) {
    // The image's glibc predates gettid().
    if (syscall(SYS_gettid) == getpid()) {
        fn();
        return;
    }
    g_idle_add_full(
        G_PRIORITY_DEFAULT,
        [](gpointer data) -> gboolean {
            (*static_cast<std::function<void()> *>(data))();
            return G_SOURCE_REMOVE;
        },
        new std::function<void()>(std::move(fn)), [](gpointer data) { delete static_cast<std::function<void()> *>(data); });
}

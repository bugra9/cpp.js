#include "platform.h"

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

std::string appName() {
    const std::string executable = executablePath();
    return executable.substr(executable.find_last_of('/') + 1);
}

// The app ends with its window; anything else ends the process as it ends any other.
void onQuit(std::function<void()>) {}

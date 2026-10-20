#include "platform.h"
#include "windows/com.h"

using namespace crossbind::windows;

namespace {

std::string executablePath() {
    std::wstring path(MAX_PATH, L'\0');
    for (;;) {
        const DWORD length = GetModuleFileNameW(nullptr, path.data(), static_cast<DWORD>(path.size()));
        if (length < path.size()) {
            path.resize(length);
            return utf8(path.c_str());
        }
        path.resize(path.size() * 2);
    }
}

}  // namespace

// A Windows app is a directory: the executable, and the app's files in resources\ beside it.
std::string resourceDir() {
    const std::string executable = executablePath();
    return executable.substr(0, executable.find_last_of("\\/")) + "\\resources";
}

std::string appName() {
    const std::string executable = executablePath();
    std::string name = executable.substr(executable.find_last_of("\\/") + 1);
    if (name.size() > 4 && name.compare(name.size() - 4, 4, ".exe") == 0) name.resize(name.size() - 4);
    return name;
}

// The app ends with its window; anything else ends the process as it ends any other.
void onQuit(std::function<void()>) {}

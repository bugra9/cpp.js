#include "windows/com.h"

#include <cstring>

namespace crossbind::windows {

namespace {

constexpr UINT RUN = WM_APP + 1;
DWORD uiThread = 0;
HWND dispatcher = nullptr;

LRESULT CALLBACK dispatch(HWND window, UINT message, WPARAM wParam, LPARAM lParam) {
    if (message != RUN) return DefWindowProcW(window, message, wParam, lParam);
    auto *fn = reinterpret_cast<std::function<void()> *>(lParam);
    (*fn)();
    delete fn;
    return 0;
}

// A message-only window of the UI thread, whose message loop runs what other threads post to it.
void startDispatcher() {
    uiThread = GetCurrentThreadId();
    WNDCLASSW type{};
    type.lpfnWndProc = dispatch;
    type.hInstance = GetModuleHandleW(nullptr);
    type.lpszClassName = L"crossbind_dispatcher";
    RegisterClassW(&type);
    dispatcher = CreateWindowExW(0, type.lpszClassName, L"", 0, 0, 0, 0, 0, HWND_MESSAGE, nullptr, type.hInstance, nullptr);
}

}  // namespace

std::wstring wide(const std::string &text) {
    if (text.empty()) return {};
    const int size = MultiByteToWideChar(CP_UTF8, 0, text.data(), static_cast<int>(text.size()), nullptr, 0);
    std::wstring result(static_cast<size_t>(size), L'\0');
    MultiByteToWideChar(CP_UTF8, 0, text.data(), static_cast<int>(text.size()), result.data(), size);
    return result;
}

std::string utf8(const wchar_t *text) {
    if (!text || !*text) return {};
    const int size = WideCharToMultiByte(CP_UTF8, 0, text, -1, nullptr, 0, nullptr, nullptr);
    std::string result(static_cast<size_t>(size - 1), '\0');
    WideCharToMultiByte(CP_UTF8, 0, text, -1, result.data(), size, nullptr, nullptr);
    return result;
}

std::string take(LPWSTR text) {
    std::string result = utf8(text);
    CoTaskMemFree(text);
    return result;
}

LPWSTR give(const std::wstring &text) {
    auto *copy = static_cast<LPWSTR>(CoTaskMemAlloc((text.size() + 1) * sizeof(wchar_t)));
    if (copy) std::memcpy(copy, text.c_str(), (text.size() + 1) * sizeof(wchar_t));
    return copy;
}

// The platform's calls all start here, on the UI thread, before any other thread posts to it.
ICoreWebView2 *coreWebView(void *controller) {
    if (!dispatcher) startDispatcher();
    ICoreWebView2 *core = nullptr;
    static_cast<ICoreWebView2Controller *>(controller)->get_CoreWebView2(&core);
    return core;
}

void onMainThread(std::function<void()> fn) {
    if (GetCurrentThreadId() == uiThread) {
        fn();
        return;
    }
    PostMessageW(dispatcher, RUN, 0, reinterpret_cast<LPARAM>(new std::function<void()>(std::move(fn))));
}

}  // namespace crossbind::windows

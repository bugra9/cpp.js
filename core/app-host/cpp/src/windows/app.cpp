#include "crossbind_app.h"
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

// The app ends with its window; anything else ends the process as it ends any other.
void onQuit(std::function<void()>) {}

// WebView2 shows the page's dialogs, file inputs and downloads itself.
void showPageDialogs(void *) {}

// The page gets the devices app.permissions lists, and no other, without a question of WebView2's; WebView2 decides the
// rest.
void answerPermissions(void *webView) {
    auto *asked = new Handler<ICoreWebView2PermissionRequestedEventHandler, ICoreWebView2 *, ICoreWebView2PermissionRequestedEventArgs *>(
        IID_ICoreWebView2PermissionRequestedEventHandler, [](ICoreWebView2 *, ICoreWebView2PermissionRequestedEventArgs *args) -> HRESULT {
            COREWEBVIEW2_PERMISSION_KIND kind = COREWEBVIEW2_PERMISSION_KIND_UNKNOWN_PERMISSION;
            args->get_PermissionKind(&kind);
            bool isAllowed = false;
            switch (kind) {
            case COREWEBVIEW2_PERMISSION_KIND_CAMERA:
                isAllowed = CROSSBIND_APP_PERMISSION_CAMERA;
                break;
            case COREWEBVIEW2_PERMISSION_KIND_MICROPHONE:
                isAllowed = CROSSBIND_APP_PERMISSION_MICROPHONE;
                break;
            case COREWEBVIEW2_PERMISSION_KIND_GEOLOCATION:
                isAllowed = CROSSBIND_APP_PERMISSION_LOCATION;
                break;
            default:
                return S_OK;
            }
            // A decision WebView2 kept would outlive an update that changes the list.
            ICoreWebView2PermissionRequestedEventArgs3 *kept = nullptr;
            if (SUCCEEDED(args->QueryInterface(IID_ICoreWebView2PermissionRequestedEventArgs3, reinterpret_cast<void **>(&kept)))) {
                kept->put_SavesInProfile(FALSE);
                kept->Release();
            }
            args->put_State(isAllowed ? COREWEBVIEW2_PERMISSION_STATE_ALLOW : COREWEBVIEW2_PERMISSION_STATE_DENY);
            return S_OK;
        });
    EventRegistrationToken token;
    coreWebView(webView)->add_PermissionRequested(asked, &token);
    asked->Release();
}

void showError(const std::string &message) {
    MessageBoxW(nullptr, wide(message).c_str(), wide(CROSSBIND_APP_NAME " cannot open").c_str(), MB_OK | MB_ICONERROR);
}

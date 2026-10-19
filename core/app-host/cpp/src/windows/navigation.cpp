#include "platform.h"
#include "windows/com.h"

#include <shellapi.h>

#include <algorithm>

using namespace crossbind::windows;

// A page from another origin in any frame would reach the module's channel and its crossbind:// routes, so the webview
// never loads one. A link the user follows to such a page opens in the default browser instead, and no page opens a
// window of the app's own.
namespace {

struct Lock {
    std::vector<std::string> origins;
    std::function<void()> newPage;
};

std::string originOf(const std::string &uri) {
    const auto scheme = uri.find("://");
    if (scheme == std::string::npos) return uri;
    return uri.substr(0, uri.find_first_of("/?#", scheme + 3));
}

bool allows(const Lock &lock, const std::string &uri) {
    if (uri.rfind("about:", 0) == 0) return true;
    // A blob URL carries the origin of the page that made it.
    if (uri.rfind("blob:", 0) == 0) return allows(lock, uri.substr(5));
    return std::find(lock.origins.begin(), lock.origins.end(), originOf(uri)) != lock.origins.end();
}

void openOutside(const std::string &uri) {
    const std::string scheme = uri.substr(0, uri.find(':'));
    if (scheme != "http" && scheme != "https" && scheme != "mailto") return;
    ShellExecuteW(nullptr, L"open", wide(uri).c_str(), nullptr, nullptr, SW_SHOWNORMAL);
}

using Starting = Handler<ICoreWebView2NavigationStartingEventHandler, ICoreWebView2 *, ICoreWebView2NavigationStartingEventArgs *>;

Starting *decide(Lock *lock) {
    return new Starting(IID_ICoreWebView2NavigationStartingEventHandler,
        [lock](ICoreWebView2 *, ICoreWebView2NavigationStartingEventArgs *args) -> HRESULT {
            LPWSTR requested = nullptr;
            args->get_Uri(&requested);
            const std::string uri = take(requested);
            if (allows(*lock, uri)) return S_OK;
            BOOL followed = FALSE;
            args->get_IsUserInitiated(&followed);
            if (followed) openOutside(uri);
            args->put_Cancel(TRUE);
            return S_OK;
        });
}

}  // namespace

void restrictNavigation(void *webView, std::vector<std::string> origins, std::function<void()> newPage) {
    ICoreWebView2 *core = coreWebView(webView);
    auto *lock = new Lock{std::move(origins), std::move(newPage)};
    EventRegistrationToken token;
    Starting *top = decide(lock);
    core->add_NavigationStarting(top, &token);
    top->Release();
    Starting *frames = decide(lock);
    core->add_FrameNavigationStarting(frames, &token);
    frames->Release();
    auto *windows = new Handler<ICoreWebView2NewWindowRequestedEventHandler, ICoreWebView2 *, ICoreWebView2NewWindowRequestedEventArgs *>(
        IID_ICoreWebView2NewWindowRequestedEventHandler, [](ICoreWebView2 *, ICoreWebView2NewWindowRequestedEventArgs *args) -> HRESULT {
            LPWSTR requested = nullptr;
            args->get_Uri(&requested);
            openOutside(take(requested));
            args->put_Handled(TRUE);
            return S_OK;
        });
    core->add_NewWindowRequested(windows, &token);
    windows->Release();
    auto *loading = new Handler<ICoreWebView2ContentLoadingEventHandler, ICoreWebView2 *, ICoreWebView2ContentLoadingEventArgs *>(
        IID_ICoreWebView2ContentLoadingEventHandler, [lock](ICoreWebView2 *, ICoreWebView2ContentLoadingEventArgs *) -> HRESULT {
            lock->newPage();
            return S_OK;
        });
    core->add_ContentLoading(loading, &token);
    loading->Release();
}

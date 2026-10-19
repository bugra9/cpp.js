#include "platform.h"

#include <webkit2/webkit2.h>

#include <algorithm>

// A page from another origin in any frame would reach the module's channel and its crossbind:// routes, so the webview
// never loads one. A link the user follows to such a page opens in the default browser instead.
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

gboolean onDecidePolicy(WebKitWebView *, WebKitPolicyDecision *decision, WebKitPolicyDecisionType type, gpointer data) {
    if (type != WEBKIT_POLICY_DECISION_TYPE_NAVIGATION_ACTION && type != WEBKIT_POLICY_DECISION_TYPE_NEW_WINDOW_ACTION) return FALSE;
    WebKitNavigationAction *action = webkit_navigation_policy_decision_get_navigation_action(WEBKIT_NAVIGATION_POLICY_DECISION(decision));
    const char *requested = webkit_uri_request_get_uri(webkit_navigation_action_get_request(action));
    const std::string uri = requested ? requested : "";
    if (allows(*static_cast<Lock *>(data), uri)) return FALSE;
    const bool followed = type == WEBKIT_POLICY_DECISION_TYPE_NEW_WINDOW_ACTION
        || webkit_navigation_action_get_navigation_type(action) == WEBKIT_NAVIGATION_TYPE_LINK_CLICKED;
    const std::string scheme = uri.substr(0, uri.find(':'));
    if (followed && (scheme == "http" || scheme == "https" || scheme == "mailto")) {
        g_app_info_launch_default_for_uri(uri.c_str(), nullptr, nullptr);
    }
    webkit_policy_decision_ignore(decision);
    return TRUE;
}

void onLoadChanged(WebKitWebView *, WebKitLoadEvent event, gpointer data) {
    if (event == WEBKIT_LOAD_COMMITTED) static_cast<Lock *>(data)->newPage();
}

}  // namespace

void restrictNavigation(void *webView, std::vector<std::string> origins, std::function<void()> newPage) {
    auto *lock = new Lock{std::move(origins), std::move(newPage)};
    g_signal_connect(WEBKIT_WEB_VIEW(webView), "decide-policy", G_CALLBACK(onDecidePolicy), lock);
    g_signal_connect(WEBKIT_WEB_VIEW(webView), "load-changed", G_CALLBACK(onLoadChanged), lock);
}

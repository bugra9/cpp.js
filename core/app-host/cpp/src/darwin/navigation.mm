#import <TargetConditionals.h>
#if TARGET_OS_IPHONE
#import <UIKit/UIKit.h>
#else
#import <Cocoa/Cocoa.h>
#endif
#import <WebKit/WebKit.h>
#import <objc/runtime.h>

#include "platform.h"

#include <algorithm>

// A page from another origin in any frame would reach the module's channel and its crossbind:// routes, so the webview
// never loads one. A link the user follows to such a page opens in the default browser instead.
@interface CBNavigationLock : NSObject <WKNavigationDelegate> {
@public
    std::vector<std::string> origins;
    std::function<void()> newPage;
}
@end

@implementation CBNavigationLock

- (BOOL)allows:(NSURL *)url {
    NSString *scheme = url.scheme.lowercaseString;
    if ([scheme isEqualToString:@"about"]) return YES;
    // A blob URL carries the origin of the page that made it.
    if ([scheme isEqualToString:@"blob"]) return [self allows:[NSURL URLWithString:url.resourceSpecifier]];
    std::string origin = std::string(scheme.UTF8String ?: "") + "://" + (url.host.UTF8String ?: "");
    if (url.port) origin += ":" + std::to_string(url.port.intValue);
    return std::find(origins.begin(), origins.end(), origin) != origins.end();
}

- (void)webView:(WKWebView *)webView
    decidePolicyForNavigationAction:(WKNavigationAction *)action
                    decisionHandler:(void (^)(WKNavigationActionPolicy))decide {
    NSURL *url = action.request.URL;
    if ([self allows:url]) {
        decide(WKNavigationActionPolicyAllow);
        return;
    }
    const BOOL followed = action.navigationType == WKNavigationTypeLinkActivated || action.targetFrame == nil;
    if (followed && [@[ @"http", @"https", @"mailto" ] containsObject:url.scheme.lowercaseString]) {
#if TARGET_OS_IPHONE
        [UIApplication.sharedApplication openURL:url options:@{} completionHandler:nil];
#else
        [NSWorkspace.sharedWorkspace openURL:url];
#endif
    }
    decide(WKNavigationActionPolicyCancel);
}

- (void)webView:(WKWebView *)webView didCommitNavigation:(WKNavigation *)navigation {
    newPage();
}

@end

void restrictNavigation(void *webView, std::vector<std::string> origins, std::function<void()> newPage) {
    static char key;
    WKWebView *view = (__bridge WKWebView *)webView;
    CBNavigationLock *lock = [CBNavigationLock new];
    lock->origins = std::move(origins);
    lock->newPage = std::move(newPage);
    // The webview holds its navigation delegate weakly.
    objc_setAssociatedObject(view, &key, lock, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
    view.navigationDelegate = lock;
}

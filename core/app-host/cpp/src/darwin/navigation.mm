#import <TargetConditionals.h>
#if TARGET_OS_IPHONE
#import <UIKit/UIKit.h>
#else
#import <Cocoa/Cocoa.h>
#import <CoreServices/CoreServices.h>
#endif
#import <WebKit/WebKit.h>
#import <objc/runtime.h>

#include "platform.h"

#include <algorithm>

#if !TARGET_OS_IPHONE
// What the page downloads goes where its user picks, as a browser asks. It arrives in a file of its own beside that
// place and takes it once whole, so a download that fails leaves the file it was to replace as it was.
API_AVAILABLE(macos(11.3))
@interface CBDownloads : NSObject <WKDownloadDelegate> {
    // Each download's destination and the file it arrives in.
    NSMapTable<WKDownload *, NSArray<NSURL *> *> *places;
}
@end

@implementation CBDownloads

- (instancetype)init {
    if ((self = [super init])) places = [NSMapTable weakToStrongObjectsMapTable];
    return self;
}

- (void)download:(WKDownload *)download
    decideDestinationUsingResponse:(NSURLResponse *)response
                 suggestedFilename:(NSString *)name
                 completionHandler:(void (^)(NSURL *))done {
    NSWindow *window = download.webView.window;
    if (!window) {
        done(nil);
        return;
    }
    NSSavePanel *panel = [NSSavePanel savePanel];
    panel.nameFieldStringValue = name;
    [panel beginSheetModalForWindow:window completionHandler:^(NSModalResponse result) {
        if (result != NSModalResponseOK) {
            done(nil);
            return;
        }
        NSString *part = [NSString stringWithFormat:@".%@.%@.download", panel.URL.lastPathComponent, NSUUID.UUID.UUIDString];
        NSURL *arrival = [panel.URL.URLByDeletingLastPathComponent URLByAppendingPathComponent:part];
        [self->places setObject:@[ panel.URL, arrival ] forKey:download];
        done(arrival);
    }];
}

- (void)downloadDidFinish:(WKDownload *)download {
    NSArray<NSURL *> *place = [places objectForKey:download];
    [places removeObjectForKey:download];
    NSFileManager *files = NSFileManager.defaultManager;
    NSError *error = nil;
    // The panel asked before it chose a file that exists.
    const BOOL isSaved = [files fileExistsAtPath:place[0].path]
                             ? [files replaceItemAtURL:place[0] withItemAtURL:place[1] backupItemName:nil options:0 resultingItemURL:nil error:&error]
                             : [files moveItemAtURL:place[1] toURL:place[0] error:&error];
    if (!isSaved) {
        [self failed:download place:place error:error];
        return;
    }
    // Gatekeeper checks it when it is opened, as it checks what a browser saves.
    [place[0] setResourceValue:@{(__bridge NSString *)kLSQuarantineTypeKey : (__bridge NSString *)kLSQuarantineTypeWebDownload}
                        forKey:NSURLQuarantinePropertiesKey
                         error:nil];
}

- (void)download:(WKDownload *)download didFailWithError:(NSError *)error resumeData:(NSData *)resumeData {
    NSArray<NSURL *> *place = [places objectForKey:download];
    [places removeObjectForKey:download];
    if (place) [self failed:download place:place error:error];
}

- (void)failed:(WKDownload *)download place:(NSArray<NSURL *> *)place error:(NSError *)error {
    [NSFileManager.defaultManager removeItemAtURL:place[1] error:nil];
    NSAlert *alert = [NSAlert new];
    alert.messageText = [NSString stringWithFormat:@"%@ was not saved", place[0].lastPathComponent];
    alert.informativeText = error.localizedDescription ?: @"";
    NSWindow *window = download.webView.window;
    if (window) {
        [alert beginSheetModalForWindow:window completionHandler:nil];
    } else {
        [alert runModal];
    }
}

@end
#endif

// A page from another origin in any frame would reach the module's channel and its crossbind:// routes, so the webview
// never loads one. A link the user follows to such a page opens in the default browser instead.
@interface CBNavigationLock : NSObject <WKNavigationDelegate> {
@public
    std::vector<std::string> origins;
    std::function<void()> newPage;
#if !TARGET_OS_IPHONE
    id downloads;
#endif
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
        if (@available(macOS 11.3, iOS 14.5, *)) {
            if (action.shouldPerformDownload) {
#if TARGET_OS_IPHONE
                // An iOS app saves no download yet, and following the link would replace the page with the file.
                decide(WKNavigationActionPolicyCancel);
#else
                decide(WKNavigationActionPolicyDownload);
#endif
                return;
            }
        }
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

#if !TARGET_OS_IPHONE
// A response the webview cannot show, such as a zip, downloads as it does in a browser.
- (void)webView:(WKWebView *)webView
    decidePolicyForNavigationResponse:(WKNavigationResponse *)response
                      decisionHandler:(void (^)(WKNavigationResponsePolicy))decide {
    if (@available(macOS 11.3, *)) {
        if (!response.canShowMIMEType) {
            decide(WKNavigationResponsePolicyDownload);
            return;
        }
    }
    decide(WKNavigationResponsePolicyAllow);
}

- (void)webView:(WKWebView *)webView navigationAction:(WKNavigationAction *)action didBecomeDownload:(WKDownload *)download
    API_AVAILABLE(macos(11.3)) {
    [self save:download];
}

- (void)webView:(WKWebView *)webView navigationResponse:(WKNavigationResponse *)response didBecomeDownload:(WKDownload *)download
    API_AVAILABLE(macos(11.3)) {
    [self save:download];
}

// A download holds its delegate weakly.
- (void)save:(WKDownload *)download API_AVAILABLE(macos(11.3)) {
    if (!downloads) downloads = [CBDownloads new];
    download.delegate = downloads;
}
#endif

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

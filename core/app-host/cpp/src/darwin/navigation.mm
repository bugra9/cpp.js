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

#if TARGET_OS_IPHONE
namespace {

// The page names a download, and WebKit passes the name on.
NSString *fileName(NSString *name) {
    NSString *last = name.lastPathComponent;
    return last.length == 0 || [@[ @"/", @".", @".." ] containsObject:last] ? @"download" : last;
}

}  // namespace

// What the page downloads arrives in a folder of its own among the app's temporary files, and the system's export sheet
// moves it where its user picks; the folder goes once the sheet does. UIKit shows one sheet at a time, so downloads
// that finish meanwhile wait their turn.
API_AVAILABLE(ios(14.5))
@interface CBDownloads : NSObject <WKDownloadDelegate, UIDocumentPickerDelegate> {
    // Each download's folder and file; the folder, file and window of each one waiting for the sheet; the folder of the
    // one it shows.
    NSMapTable<WKDownload *, NSArray<NSURL *> *> *places;
    NSMutableArray<NSArray *> *waiting;
    NSURL *shown;
}
@end

@implementation CBDownloads

- (instancetype)init {
    if ((self = [super init])) {
        places = [NSMapTable weakToStrongObjectsMapTable];
        waiting = [NSMutableArray new];
    }
    return self;
}

- (void)download:(WKDownload *)download
    decideDestinationUsingResponse:(NSURLResponse *)response
                 suggestedFilename:(NSString *)name
                 completionHandler:(void (^)(NSURL *))done {
    NSFileManager *manager = NSFileManager.defaultManager;
    NSURL *folder = [manager.temporaryDirectory URLByAppendingPathComponent:NSUUID.UUID.UUIDString isDirectory:YES];
    NSError *error = nil;
    if (![manager createDirectoryAtURL:folder withIntermediateDirectories:YES attributes:nil error:&error]) {
        [self tell:fileName(name) error:error over:download.webView.window];
        done(nil);
        return;
    }
    NSURL *file = [folder URLByAppendingPathComponent:fileName(name) isDirectory:NO];
    [places setObject:@[ folder, file ] forKey:download];
    done(file);
}

- (void)downloadDidFinish:(WKDownload *)download {
    NSArray<NSURL *> *place = [places objectForKey:download];
    [places removeObjectForKey:download];
    if (!place) return;
    UIWindow *window = download.webView.window;
    [waiting addObject:@[ place[0], place[1], window ? (id)window : NSNull.null ]];
    [self showNext];
}

- (void)download:(WKDownload *)download didFailWithError:(NSError *)error resumeData:(NSData *)resumeData {
    NSArray<NSURL *> *place = [places objectForKey:download];
    [places removeObjectForKey:download];
    if (!place) return;
    [NSFileManager.defaultManager removeItemAtURL:place[0] error:nil];
    [self tell:place[1].lastPathComponent error:error over:download.webView.window];
}

- (void)showNext {
    while (!shown && waiting.count > 0) {
        NSArray *next = waiting.firstObject;
        [waiting removeObjectAtIndex:0];
        UIDocumentPickerViewController *sheet = [[UIDocumentPickerViewController alloc] initForExportingURLs:@[ next[1] ] asCopy:NO];
        sheet.delegate = self;
        UIWindow *window = next[2] == NSNull.null ? nil : next[2];
        if (presentOnTop((__bridge void *)sheet, (__bridge void *)window)) {
            shown = next[0];
        } else {
            [NSFileManager.defaultManager removeItemAtURL:next[0] error:nil];
        }
    }
}

- (void)documentPicker:(UIDocumentPickerViewController *)sheet didPickDocumentsAtURLs:(NSArray<NSURL *> *)urls {
    [self sheetWentAway];
}

- (void)documentPickerWasCancelled:(UIDocumentPickerViewController *)sheet {
    [self sheetWentAway];
}

- (void)sheetWentAway {
    if (shown) [NSFileManager.defaultManager removeItemAtURL:shown error:nil];
    shown = nil;
    [self showNext];
}

- (void)tell:(NSString *)name error:(NSError *)error over:(UIWindow *)window {
    UIAlertController *alert = [UIAlertController alertControllerWithTitle:[NSString stringWithFormat:@"%@ was not saved", name]
                                                                   message:error.localizedDescription
                                                            preferredStyle:UIAlertControllerStyleAlert];
    [alert addAction:[UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault handler:nil]];
    presentOnTop((__bridge void *)alert, (__bridge void *)window);
}

@end
#else
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
    id downloads;
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
    if (@available(macOS 11.3, iOS 14.5, *)) {
        // A link's download attribute saves what it points at instead of showing it: the page's own files, and data
        // the page holds as a data: URL.
        if (action.shouldPerformDownload && ([self allows:url] || [url.scheme.lowercaseString isEqualToString:@"data"])) {
            decide(WKNavigationActionPolicyDownload);
            return;
        }
    }
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

// A response the webview cannot show, such as a zip, downloads as it does in a browser.
- (void)webView:(WKWebView *)webView
    decidePolicyForNavigationResponse:(WKNavigationResponse *)response
                      decisionHandler:(void (^)(WKNavigationResponsePolicy))decide {
    if (@available(macOS 11.3, iOS 14.5, *)) {
        if (!response.canShowMIMEType) {
            decide(WKNavigationResponsePolicyDownload);
            return;
        }
    }
    decide(WKNavigationResponsePolicyAllow);
}

- (void)webView:(WKWebView *)webView navigationAction:(WKNavigationAction *)action didBecomeDownload:(WKDownload *)download
    API_AVAILABLE(macos(11.3), ios(14.5)) {
    [self save:download];
}

- (void)webView:(WKWebView *)webView navigationResponse:(WKNavigationResponse *)response didBecomeDownload:(WKDownload *)download
    API_AVAILABLE(macos(11.3), ios(14.5)) {
    [self save:download];
}

// A download holds its delegate weakly.
- (void)save:(WKDownload *)download API_AVAILABLE(macos(11.3), ios(14.5)) {
    if (!downloads) downloads = [CBDownloads new];
    download.delegate = downloads;
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

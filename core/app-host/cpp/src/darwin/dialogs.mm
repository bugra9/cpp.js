#import <TargetConditionals.h>
#if TARGET_OS_IPHONE
#import <UIKit/UIKit.h>
#else
#import <Cocoa/Cocoa.h>
#endif
#import <WebKit/WebKit.h>
#import <objc/runtime.h>

#include "crossbind_app.h"
#include "platform.h"

namespace {

// The app's name titles the page's dialogs, as a browser's name the page's origin.
NSString *appTitle() {
    return [NSBundle.mainBundle objectForInfoDictionaryKey:@"CFBundleDisplayName"] ?: NSProcessInfo.processInfo.processName;
}

}  // namespace

// WKWebView leaves the page's dialogs to its UI delegate: without one, alert() returns at once, confirm() answers false
// and prompt() null.
@interface CBPageDialogs : NSObject <WKUIDelegate>
@end

@implementation CBPageDialogs

#if TARGET_OS_IPHONE

// Over whatever the app shows on top. With nothing to show it over, the caller answers at once, as if the dialog were
// cancelled: WebKit wants an answer to every one.
- (BOOL)show:(UIAlertController *)alert over:(WKWebView *)webView {
    UIViewController *top = webView.window.rootViewController;
    while (top.presentedViewController) top = top.presentedViewController;
    if (!top || top.isBeingDismissed) return NO;
    [top presentViewController:alert animated:YES completion:nil];
    return YES;
}

- (UIAlertController *)alertWithText:(NSString *)message {
    return [UIAlertController alertControllerWithTitle:appTitle() message:message preferredStyle:UIAlertControllerStyleAlert];
}

- (void)webView:(WKWebView *)webView
    runJavaScriptAlertPanelWithMessage:(NSString *)message
                      initiatedByFrame:(WKFrameInfo *)frame
                     completionHandler:(void (^)(void))done {
    UIAlertController *alert = [self alertWithText:message];
    [alert addAction:[UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault handler:^(UIAlertAction *) { done(); }]];
    if (![self show:alert over:webView]) done();
}

- (void)webView:(WKWebView *)webView
    runJavaScriptConfirmPanelWithMessage:(NSString *)message
                        initiatedByFrame:(WKFrameInfo *)frame
                       completionHandler:(void (^)(BOOL))done {
    UIAlertController *alert = [self alertWithText:message];
    [alert addAction:[UIAlertAction actionWithTitle:@"Cancel" style:UIAlertActionStyleCancel handler:^(UIAlertAction *) { done(NO); }]];
    [alert addAction:[UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault handler:^(UIAlertAction *) { done(YES); }]];
    if (![self show:alert over:webView]) done(NO);
}

- (void)webView:(WKWebView *)webView
    runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt
                              defaultText:(NSString *)text
                         initiatedByFrame:(WKFrameInfo *)frame
                        completionHandler:(void (^)(NSString *))done {
    UIAlertController *alert = [self alertWithText:prompt];
    [alert addTextFieldWithConfigurationHandler:^(UITextField *field) { field.text = text; }];
    [alert addAction:[UIAlertAction actionWithTitle:@"Cancel" style:UIAlertActionStyleCancel handler:^(UIAlertAction *) { done(nil); }]];
    __weak UIAlertController *shown = alert;
    [alert addAction:[UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault handler:^(UIAlertAction *) {
               done(shown.textFields.firstObject.text);
           }]];
    if (![self show:alert over:webView]) done(nil);
}

#else

// A sheet on the page's window, as Safari shows them.
- (void)show:(NSAlert *)alert over:(WKWebView *)webView then:(void (^)(NSModalResponse))done {
    if (webView.window) {
        [alert beginSheetModalForWindow:webView.window completionHandler:done];
    } else {
        done([alert runModal]);
    }
}

- (NSAlert *)alertWithText:(NSString *)message buttons:(NSArray<NSString *> *)buttons {
    NSAlert *alert = [NSAlert new];
    alert.messageText = appTitle();
    alert.informativeText = message;
    for (NSString *button in buttons) [alert addButtonWithTitle:button];
    return alert;
}

- (void)webView:(WKWebView *)webView
    runJavaScriptAlertPanelWithMessage:(NSString *)message
                      initiatedByFrame:(WKFrameInfo *)frame
                     completionHandler:(void (^)(void))done {
    [self show:[self alertWithText:message buttons:@[ @"OK" ]] over:webView then:^(NSModalResponse) { done(); }];
}

- (void)webView:(WKWebView *)webView
    runJavaScriptConfirmPanelWithMessage:(NSString *)message
                        initiatedByFrame:(WKFrameInfo *)frame
                       completionHandler:(void (^)(BOOL))done {
    [self show:[self alertWithText:message buttons:@[ @"OK", @"Cancel" ]] over:webView then:^(NSModalResponse response) {
        done(response == NSAlertFirstButtonReturn);
    }];
}

- (void)webView:(WKWebView *)webView
    runJavaScriptTextInputPanelWithPrompt:(NSString *)prompt
                              defaultText:(NSString *)text
                         initiatedByFrame:(WKFrameInfo *)frame
                        completionHandler:(void (^)(NSString *))done {
    NSAlert *alert = [self alertWithText:prompt buttons:@[ @"OK", @"Cancel" ]];
    NSTextField *field = [NSTextField textFieldWithString:text ?: @""];
    field.frame = NSMakeRect(0, 0, 260, 24);
    alert.accessoryView = field;
    alert.window.initialFirstResponder = field;
    [self show:alert over:webView then:^(NSModalResponse response) {
        done(response == NSAlertFirstButtonReturn ? field.stringValue : nil);
    }];
}

// A file input; iOS's WKWebView shows its own picker.
- (void)webView:(WKWebView *)webView
    runOpenPanelWithParameters:(WKOpenPanelParameters *)parameters
              initiatedByFrame:(WKFrameInfo *)frame
             completionHandler:(void (^)(NSArray<NSURL *> *))done {
    NSOpenPanel *panel = [NSOpenPanel openPanel];
    panel.canChooseFiles = YES;
    panel.canChooseDirectories = parameters.allowsDirectories;
    panel.allowsMultipleSelection = parameters.allowsMultipleSelection;
    if (!webView.window) {
        done([panel runModal] == NSModalResponseOK ? panel.URLs : nil);
        return;
    }
    [panel beginSheetModalForWindow:webView.window completionHandler:^(NSModalResponse response) {
        done(response == NSModalResponseOK ? panel.URLs : nil);
    }];
}

#endif

// The camera and microphone of app.permissions, which the system asks the app's user for; WebKit would ask as well.
- (void)webView:(WKWebView *)webView
    requestMediaCapturePermissionForOrigin:(WKSecurityOrigin *)origin
                          initiatedByFrame:(WKFrameInfo *)frame
                                      type:(WKMediaCaptureType)type
                           decisionHandler:(void (^)(WKPermissionDecision))decide API_AVAILABLE(macos(12.0), ios(15.0)) {
    bool isAllowed = false;
    switch (type) {
    case WKMediaCaptureTypeCamera:
        isAllowed = CROSSBIND_APP_PERMISSION_CAMERA;
        break;
    case WKMediaCaptureTypeMicrophone:
        isAllowed = CROSSBIND_APP_PERMISSION_MICROPHONE;
        break;
    case WKMediaCaptureTypeCameraAndMicrophone:
        isAllowed = CROSSBIND_APP_PERMISSION_CAMERA && CROSSBIND_APP_PERMISSION_MICROPHONE;
        break;
    }
    decide(isAllowed ? WKPermissionDecisionGrant : WKPermissionDecisionDeny);
}

// The location of app.permissions, which the system asks the app's user for.
- (void)webView:(WKWebView *)webView
    requestGeolocationPermissionForOrigin:(WKSecurityOrigin *)origin
                         initiatedByFrame:(WKFrameInfo *)frame
                          decisionHandler:(void (^)(WKPermissionDecision))decide API_AVAILABLE(macos(27.0), ios(27.0)) {
    decide(CROSSBIND_APP_PERMISSION_LOCATION ? WKPermissionDecisionGrant : WKPermissionDecisionDeny);
}

#if CROSSBIND_APP_PERMISSION_LOCATION
// Before macOS and iOS 27 WebKit asks a private selector of the UI delegate instead, which only an app that lists the
// location answers. Another carries no reason for it, without which CoreLocation asks the app's user nothing.
- (void)_webView:(WKWebView *)webView requestGeolocationPermissionForFrame:(WKFrameInfo *)frame decisionHandler:(void (^)(BOOL))decide {
    decide(YES);
}
#endif

@end

// CBPageDialogs, the page's UI delegate, answers them.
void answerPermissions(void *) {}

void showPageDialogs(void *webView) {
    WKWebView *view = (__bridge WKWebView *)webView;
    CBPageDialogs *dialogs = [CBPageDialogs new];
    // The webview holds its UI delegate weakly. On macOS webview's window releases the UI delegate it finds when it
    // goes, as it owns the one it set itself, so it gets a reference to this one.
#if TARGET_OS_IPHONE
    static char key;
    objc_setAssociatedObject(view, &key, dialogs, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
#else
    (void)CFBridgingRetain(dialogs);
#endif
    view.UIDelegate = dialogs;
}

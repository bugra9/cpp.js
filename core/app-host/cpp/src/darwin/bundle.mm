#import <Cocoa/Cocoa.h>

#include "crossbind_app.h"
#include "platform.h"

std::string resourceDir() { return NSBundle.mainBundle.resourcePath.UTF8String; }

void showError(const std::string &message) {
    [NSApplication sharedApplication];
    // An executable outside a bundle may show no window, which webview's window allows as well.
    if (!NSBundle.mainBundle.bundleIdentifier) [NSApp setActivationPolicy:NSApplicationActivationPolicyRegular];
    [NSApp activateIgnoringOtherApps:YES];
    NSAlert *alert = [NSAlert new];
    alert.alertStyle = NSAlertStyleCritical;
    alert.messageText = [NSString stringWithFormat:@"%@ cannot open", @(CROSSBIND_APP_NAME)];
    alert.informativeText = @(message.c_str());
    [alert runModal];
}

void onQuit(std::function<void()> quit) {
    [NSNotificationCenter.defaultCenter addObserverForName:NSApplicationWillTerminateNotification
                                                    object:nil
                                                     queue:nil
                                                usingBlock:^(NSNotification *) {
                                                  quit();
                                                }];
}

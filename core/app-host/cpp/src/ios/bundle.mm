#import <UIKit/UIKit.h>

#include "platform.h"

// The app's Xcode project copies the app's files into the bundle's app folder.
std::string resourceDir() { return std::string(NSBundle.mainBundle.resourcePath.UTF8String) + "/app"; }

// An iOS app that cannot start has no window to say so in.
void showError(const std::string &message) { NSLog(@"crossbind: %@", @(message.c_str())); }

void onQuit(std::function<void()> quit) {
    [NSNotificationCenter.defaultCenter addObserverForName:UIApplicationWillTerminateNotification
                                                    object:nil
                                                     queue:nil
                                                usingBlock:^(NSNotification *) {
                                                  quit();
                                                }];
}

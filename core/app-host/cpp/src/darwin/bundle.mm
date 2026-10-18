#import <Cocoa/Cocoa.h>

#include "platform.h"

std::string resourceDir() { return NSBundle.mainBundle.resourcePath.UTF8String; }

std::string appName() {
    NSString *name = [NSBundle.mainBundle objectForInfoDictionaryKey:@"CFBundleName"] ?: NSProcessInfo.processInfo.processName;
    return name.UTF8String;
}

void onQuit(std::function<void()> quit) {
    [NSNotificationCenter.defaultCenter addObserverForName:NSApplicationWillTerminateNotification
                                                    object:nil
                                                     queue:nil
                                                usingBlock:^(NSNotification *) {
                                                  quit();
                                                }];
}

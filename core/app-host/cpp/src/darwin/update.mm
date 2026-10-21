#import <Foundation/Foundation.h>

#include "platform.h"

#include <stdexcept>

namespace {

// How often the wait looks at what the download has received.
constexpr int64_t CHECK_NSEC = NSEC_PER_SEC / 4;

}  // namespace

// A session that keeps nothing, so that every check asks the server anew.
void download(const std::string &url, const std::filesystem::path &file, std::uintmax_t maxBytes) {
    @autoreleasepool {
        NSString *address = [NSString stringWithUTF8String:url.c_str()];
        NSURL *source = address ? [NSURL URLWithString:address] : nil;
        if (!source) throw std::runtime_error("crossbind: " + url + " is no address");
        NSString *path = [NSString stringWithUTF8String:file.c_str()];
        if (!path) throw std::runtime_error("crossbind: cannot download to " + file.string());
        NSURL *target = [NSURL fileURLWithPath:path];
        NSURLSessionConfiguration *configuration = NSURLSessionConfiguration.ephemeralSessionConfiguration;
        configuration.requestCachePolicy = NSURLRequestReloadIgnoringLocalCacheData;
        NSURLSession *session = [NSURLSession sessionWithConfiguration:configuration];
        dispatch_semaphore_t finished = dispatch_semaphore_create(0);
        __block std::string failure;
        NSURLSessionDownloadTask *task = [session downloadTaskWithURL:source
                                                    completionHandler:^(NSURL *location, NSURLResponse *response, NSError *error) {
                                                      const NSInteger status = [response isKindOfClass:NSHTTPURLResponse.class]
                                                                                   ? ((NSHTTPURLResponse *)response).statusCode
                                                                                   : 0;
                                                      NSError *moved = nil;
                                                      if (error) {
                                                          failure = "crossbind: cannot download " + url + ": " +
                                                                    (error.localizedDescription.UTF8String ?: "no reason given");
                                                      } else if (status != 200) {
                                                          failure = "crossbind: " + url + " answered " + std::to_string(status);
                                                      } else {
                                                          // The task deletes its file once this returns.
                                                          [NSFileManager.defaultManager removeItemAtURL:target error:nil];
                                                          if (![NSFileManager.defaultManager moveItemAtURL:location toURL:target error:&moved]) {
                                                              failure = "crossbind: cannot keep the download of " + url + ": " +
                                                                        (moved.localizedDescription.UTF8String ?: "no reason given");
                                                          }
                                                      }
                                                      dispatch_semaphore_signal(finished);
                                                    }];
        [task resume];
        const auto isTooLarge = [&] { return static_cast<std::uintmax_t>(task.countOfBytesReceived) > maxBytes; };
        while (dispatch_semaphore_wait(finished, dispatch_time(DISPATCH_TIME_NOW, CHECK_NSEC)) != 0) {
            if (isTooLarge()) [task cancel];
        }
        [session finishTasksAndInvalidate];
        if (isTooLarge()) throw std::runtime_error("crossbind: " + url + " answered more than " + std::to_string(maxBytes) + " bytes");
        if (!failure.empty()) throw std::runtime_error(failure);
    }
}

#import <TargetConditionals.h>
#if TARGET_OS_IPHONE
#import <UIKit/UIKit.h>
#else
#import <Cocoa/Cocoa.h>
#import <UniformTypeIdentifiers/UniformTypeIdentifiers.h>
#endif

#include "platform.h"

#include <stdexcept>

namespace {

NSString *ns(const std::string &text) { return [NSString stringWithUTF8String:text.c_str()] ?: @""; }

void onMain(void (^block)(void)) { dispatch_async(dispatch_get_main_queue(), block); }

// One of the user's folders, or a folder of the app's in it, made when missing.
std::string folder(NSSearchPathDirectory directory, NSString *child) {
    NSURL *url = [NSFileManager.defaultManager URLsForDirectory:directory inDomains:NSUserDomainMask].firstObject;
    if (child) url = [url URLByAppendingPathComponent:child isDirectory:YES];
    NSError *error = nil;
    if (!url || ![NSFileManager.defaultManager createDirectoryAtURL:url withIntermediateDirectories:YES attributes:nil error:&error]) {
        throw std::runtime_error(std::string("crossbind: cannot make the app's folder ") + (url.path.UTF8String ?: "") + ": " +
                                 (error.localizedDescription.UTF8String ?: "no such folder"));
    }
    return url.path.UTF8String;
}

}  // namespace

// Called on the module's thread, which has no autorelease pool of its own.
crossbind::app::Paths appPaths() {
    @autoreleasepool {
#if TARGET_OS_IPHONE
        // An iOS app's folders are its own already.
        return {folder(NSApplicationSupportDirectory, nil), folder(NSCachesDirectory, nil), folder(NSLibraryDirectory, @"Logs")};
#else
        NSString *id = NSBundle.mainBundle.bundleIdentifier ?: NSProcessInfo.processInfo.processName;
        return {folder(NSApplicationSupportDirectory, id), folder(NSCachesDirectory, id),
                folder(NSLibraryDirectory, [@"Logs/" stringByAppendingString:id])};
#endif
    }
}

void openUrl(std::string url, std::function<void(Failure)> done) {
    onMain(^{
      NSURL *address = [NSURL URLWithString:ns(url)];
      if (!address) {
          done("crossbind: " + url + " is no address");
          return;
      }
#if TARGET_OS_IPHONE
      [UIApplication.sharedApplication openURL:address options:@{} completionHandler:^(BOOL opened) {
        done(opened ? Failure() : Failure("crossbind: nothing opens " + url));
      }];
#else
      done([NSWorkspace.sharedWorkspace openURL:address] ? Failure() : Failure("crossbind: nothing opens " + url));
#endif
    });
}

#if TARGET_OS_IPHONE

void showOpenDialog(crossbind::app::OpenOptions, std::function<void(Picked)>) {
    throw std::runtime_error("crossbind: an iOS app has no file dialogs yet");
}

void showSaveDialog(crossbind::app::SaveOptions, std::function<void(std::optional<std::string>)>) {
    throw std::runtime_error("crossbind: an iOS app has no file dialogs yet");
}

void openFile(std::string, std::function<void(Failure)>) {
    throw std::runtime_error("crossbind: an iOS app opens no file in another app yet");
}

void revealFile(std::string, std::function<void(Failure)>) {
    throw std::runtime_error("crossbind: an iOS app has no file manager to show a file in");
}

void quitApp() { throw std::runtime_error("crossbind: an iOS app does not quit itself: the system ends it"); }

void setMenu(std::vector<MenuItem>, MenuClicked, std::function<void(Failure)>) {
    throw std::runtime_error("crossbind: an iOS app has no menu bar");
}

void setMainWindow(void *) {}

#else

namespace {

// The panel shows every filter's files at once; none at all, or "*", lets it show any file.
NSArray<UTType *> *typesOf(const std::vector<crossbind::app::FileFilter> &filters) {
    NSMutableArray<UTType *> *types = [NSMutableArray new];
    for (const auto &filter : filters) {
        for (const auto &extension : filter.extensions) {
            if (extension == "*") return @[];
            if (UTType *type = [UTType typeWithFilenameExtension:ns(extension)]) [types addObject:type];
        }
    }
    return types;
}

bool exists(NSURL *file) { return [NSFileManager.defaultManager fileExistsAtPath:file.path]; }

}  // namespace

// The panels are app-modal: nothing else in the app, quitting among it, happens while one asks.
void showOpenDialog(crossbind::app::OpenOptions options, std::function<void(Picked)> done) {
    onMain(^{
      NSOpenPanel *panel = [NSOpenPanel openPanel];
      panel.canChooseFiles = !options.directory;
      panel.canChooseDirectories = options.directory;
      panel.allowsMultipleSelection = options.multiple;
      if (!options.title.empty()) panel.message = ns(options.title);
      if (!options.defaultPath.empty()) panel.directoryURL = [NSURL fileURLWithPath:ns(options.defaultPath)];
      panel.allowedContentTypes = typesOf(options.filters);
      if ([panel runModal] != NSModalResponseOK) {
          done(std::nullopt);
          return;
      }
      std::vector<std::string> paths;
      for (NSURL *url in panel.URLs) paths.push_back(url.path.UTF8String);
      done(paths);
    });
}

void showSaveDialog(crossbind::app::SaveOptions options, std::function<void(std::optional<std::string>)> done) {
    onMain(^{
      NSSavePanel *panel = [NSSavePanel savePanel];
      if (!options.title.empty()) panel.message = ns(options.title);
      if (!options.defaultPath.empty()) panel.directoryURL = [NSURL fileURLWithPath:ns(options.defaultPath)];
      if (!options.defaultName.empty()) panel.nameFieldStringValue = ns(options.defaultName);
      panel.allowedContentTypes = typesOf(options.filters);
      if ([panel runModal] != NSModalResponseOK) {
          done(std::nullopt);
          return;
      }
      done(std::string(panel.URL.path.UTF8String));
    });
}

void openFile(std::string path, std::function<void(Failure)> done) {
    onMain(^{
      NSURL *file = [NSURL fileURLWithPath:ns(path)];
      if (!exists(file)) {
          done("crossbind: there is no " + path);
          return;
      }
      done([NSWorkspace.sharedWorkspace openURL:file] ? Failure() : Failure("crossbind: nothing opens " + path));
    });
}

void revealFile(std::string path, std::function<void(Failure)> done) {
    onMain(^{
      NSURL *file = [NSURL fileURLWithPath:ns(path)];
      if (!exists(file)) {
          done("crossbind: there is no " + path);
          return;
      }
      [NSWorkspace.sharedWorkspace activateFileViewerSelectingURLs:@[ file ]];
      done(std::nullopt);
    });
}

void quitApp() {
    onMain(^{
      [NSApp terminate:nil];
    });
}

// A panel that asks for its app, not a window of it, needs none.
void setMainWindow(void *) {}

#endif

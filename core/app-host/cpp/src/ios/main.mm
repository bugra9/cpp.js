// An iOS app: one scene whose WKWebView page reaches a crossbind module running in Hermes, as on macOS. The page comes
// from crossbind://app/, or in a debug app the dev server opens, from the URL CROSSBIND_APP_URL names.
#import <UIKit/UIKit.h>
#import <WebKit/WebKit.h>

#include "app.h"

namespace {

namespace app = crossbind::app;

app::Core *core;
const char *devUrl;

}  // namespace

@interface CBSceneDelegate : UIResponder <UIWindowSceneDelegate>
@property(nonatomic, strong) UIWindow *window;
@end

@implementation CBSceneDelegate

- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session options:(UISceneConnectionOptions *)options {
    WKWebViewConfiguration *configuration = [WKWebViewConfiguration new];
    registerSchemeHandler((__bridge void *)configuration, "crossbind", [](SchemeRequest request, SchemeRespond respond) {
        core->serve(std::move(request), std::move(respond));
    });
    WKWebView *webView = [[WKWebView alloc] initWithFrame:CGRectZero configuration:configuration];
#ifdef CROSSBIND_APP_DEV
    if (@available(iOS 16.4, *)) webView.inspectable = YES;
#endif
    const std::string url = app::attach(*core, (__bridge void *)webView, devUrl);

    UIViewController *controller = [UIViewController new];
    controller.view = webView;
    self.window = [[UIWindow alloc] initWithWindowScene:(UIWindowScene *)scene];
    self.window.rootViewController = controller;
    [self.window makeKeyAndVisible];
    [webView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:@(url.c_str())]]];
}

@end

@interface CBAppDelegate : UIResponder <UIApplicationDelegate>
@end

@implementation CBAppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)options {
    devUrl = app::devUrl();
    core = &app::start(devUrl);
    onQuit([] { app::quit(*core, 0); });
    return YES;
}

- (UISceneConfiguration *)application:(UIApplication *)application
    configurationForConnectingSceneSession:(UISceneSession *)session
                                   options:(UISceneConnectionOptions *)options {
    UISceneConfiguration *configuration = [[UISceneConfiguration alloc] initWithName:@"Default" sessionRole:session.role];
    configuration.delegateClass = CBSceneDelegate.class;
    return configuration;
}

@end

// The app's Xcode project only calls this from its main(): the whole app comes prebuilt.
extern "C" int crossbind_app_main(int argc, char *argv[]) {
    @autoreleasepool {
        return UIApplicationMain(argc, argv, nil, NSStringFromClass(CBAppDelegate.class));
    }
}

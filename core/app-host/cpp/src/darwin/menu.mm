#import <Cocoa/Cocoa.h>

#include "crossbind_app.h"
#include "platform.h"

namespace {

NSMenuItem *item(NSString *title, SEL action, NSString *key, NSEventModifierFlags modifiers = NSEventModifierFlagCommand) {
    NSMenuItem *item = [[NSMenuItem alloc] initWithTitle:title action:action keyEquivalent:key];
    item.keyEquivalentModifierMask = modifiers;
    return item;
}

NSMenu *submenu(NSMenu *parent, NSString *title) {
    NSMenu *menu = [[NSMenu alloc] initWithTitle:title];
    NSMenuItem *holder = [[NSMenuItem alloc] initWithTitle:title action:nil keyEquivalent:@""];
    holder.submenu = menu;
    [parent addItem:holder];
    return menu;
}

}  // namespace

// The menus of a Mac app made from Xcode's template, without its File and Help menus, which the page would fill.
void installAppMenu() {
    NSString *name = @(CROSSBIND_APP_NAME);
    NSMenu *bar = [NSMenu new];

    NSMenu *app = submenu(bar, name);
    [app addItem:item([@"About " stringByAppendingString:name], @selector(orderFrontStandardAboutPanel:), @"")];
    [app addItem:NSMenuItem.separatorItem];
    NSApp.servicesMenu = submenu(app, @"Services");
    [app addItem:NSMenuItem.separatorItem];
    [app addItem:item([@"Hide " stringByAppendingString:name], @selector(hide:), @"h")];
    [app addItem:item(@"Hide Others", @selector(hideOtherApplications:), @"h", NSEventModifierFlagCommand | NSEventModifierFlagOption)];
    [app addItem:item(@"Show All", @selector(unhideAllApplications:), @"")];
    [app addItem:NSMenuItem.separatorItem];
    [app addItem:item([@"Quit " stringByAppendingString:name], @selector(terminate:), @"q")];

    NSMenu *edit = submenu(bar, @"Edit");
    [edit addItem:item(@"Undo", @selector(undo:), @"z")];
    [edit addItem:item(@"Redo", @selector(redo:), @"z", NSEventModifierFlagCommand | NSEventModifierFlagShift)];
    [edit addItem:NSMenuItem.separatorItem];
    [edit addItem:item(@"Cut", @selector(cut:), @"x")];
    [edit addItem:item(@"Copy", @selector(copy:), @"c")];
    [edit addItem:item(@"Paste", @selector(paste:), @"v")];
    [edit addItem:item(@"Paste and Match Style", @selector(pasteAsPlainText:), @"v",
                       NSEventModifierFlagCommand | NSEventModifierFlagOption | NSEventModifierFlagShift)];
    [edit addItem:item(@"Delete", @selector(delete:), @"")];
    [edit addItem:item(@"Select All", @selector(selectAll:), @"a")];

    NSMenu *view = submenu(bar, @"View");
    [view addItem:item(@"Enter Full Screen", @selector(toggleFullScreen:), @"f", NSEventModifierFlagCommand | NSEventModifierFlagControl)];
    // The app has one window, so AppKit adds no tab items to these menus.
    NSWindow.allowsAutomaticWindowTabbing = NO;

    NSMenu *window = submenu(bar, @"Window");
    [window addItem:item(@"Minimize", @selector(performMiniaturize:), @"m")];
    [window addItem:item(@"Zoom", @selector(performZoom:), @"")];
    [window addItem:NSMenuItem.separatorItem];
    [window addItem:item(@"Close", @selector(performClose:), @"w")];
    // AppKit lists the app's windows below.
    NSApp.windowsMenu = window;

    NSApp.mainMenu = bar;
}

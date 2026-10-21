<!-- GENERATED from docs/api/app.md by scripts/build-agent-skill.mjs. Do not edit. -->

# Apps — `target.runtimeEnv: 'app'`

> An app whose page runs in the system webview and whose bindings run natively in the app's own process, with no
> Node.js and no browser engine of its own. macOS, Linux, Windows, iOS and Android for now.

The page calls the module exactly as a web build that runs its module in a worker does: `initNative()` resolves to the
module, and every call is awaited. The C++ and Rust behind it run in Hermes, inside the app, with the speed and the
system access of native code.

## Set up

```bash
pnpm add -D crossbind@beta @crossbind/plugin-vite@beta @crossbind/core-app-host@beta vite
```

```js
// crossbind.config.js
export default {
    general: { name: 'my-app' },
    target: { runtimeEnv: 'app' },
    paths: { config: import.meta.url },
};
```

```js
// vite.config.js
import { defineConfig } from 'vite';
import viteCrossbindPlugin from '@crossbind/plugin-vite';

export default defineConfig({ plugins: [viteCrossbindPlugin()] });
```

`npm create crossbind@beta -- <dir> Desktop App` scaffolds such a project from `examples/desktop-app`.

## Develop and build

| Command | What it does |
|---|---|
| `crossbind app dev` | Builds the host for this machine and opens the app on the dev server. An edit to the page reloads it; an edit to native code, or to what the page imports from it, rebuilds the host and opens the app again. The page's console shows in the terminal, and closing the window ends the session. |
| `crossbind app build` | Builds the page and the host and writes the app: `dist/<name>.app`, signed ad hoc, on macOS; `dist/<name>-linux-<arch>/` and the same as a `.tar.gz` on Linux. |
| `crossbind app build -p linux` | Writes the Linux app for x64 and arm64, on a Mac as well: `dist/<name>-linux-x64/` and `dist/<name>-linux-arm64/`, each with its `.tar.gz`. A Linux app's development session runs on Linux. |
| `crossbind app build -p windows` | Writes the Windows app for x64 and arm64, on a Mac or a Linux machine as well: `dist/<name>-win32-x64/` and `dist/<name>-win32-arm64/`, each with its `.zip`. A Windows app's development session runs on Windows. |
| `crossbind build -p host -e app` | Builds the host alone, with no page in it: `<paths.output>/<name>.darwin-<arch>.app` on macOS, `<paths.output>/<name>.linux-<arch>` and its `.tar.gz` on Linux. `-p linux` or `-p win32` builds a Linux app, or a Windows app with its `.zip`, from a Mac as well. |
| `crossbind app dev -p ios` | Builds the host for the iOS Simulator and opens the app there on the dev server: in the Simulator already booted, else in an iPhone of the newest iOS. Edits reload the page or rebuild the host as on the desktop, and ending the app in the Simulator ends the session. |
| `crossbind app build -p ios` | Builds the page and the host for devices and the Simulator and writes the app's Xcode project, `dist/<name>-ios/` (see [iOS](#ios)). |
| `crossbind build -p ios -e app` | Writes the Xcode project with no page in it: `<paths.output>/<name>-ios`, or `<name>-ios.debug` for a debug build. |
| `crossbind app dev -p android` | Builds the host for the attached Android device or emulator, installs the app as a debug APK and opens it on the dev server, which the device reaches through `adb reverse`. Edits reload the page or rebuild the host as on the desktop; the page's console shows in the terminal, and the end of the app's process, as when it is swiped away, ends the session (Back leaves the process running). crossbind starts no emulator: start one, or connect a phone with USB debugging on, and with several attached set `ANDROID_SERIAL`. |
| `crossbind app build -p android` | Builds the page and the host for arm64-v8a and x86_64, writes the app's Gradle project, `dist/<name>-android/`, and packages it: `dist/<name>-android.apk`, and with an upload key `dist/<name>-android.aab` too (see [Android](#android)). |
| `crossbind build -p android -e app` | Writes the Gradle project with no page in it: `<paths.output>/<name>-android`, or `<name>-android.debug` for a debug build. A release build packages it as `crossbind app build -p android` does. |

`crossbind app` runs the project's Vite with `CROSSBIND_APP_PLATFORM` set to the platform `-p` names, `macos`, `linux`,
`windows`, `ios` or `android`; without `-p` it keeps the variable the environment sets, and without that builds this
machine's desktop app. `vite` and `vite build` take the variable as well, and Vite's own options, such as `--port` or
`--mode`, pass through `crossbind app` to Vite. A macOS or iOS build fetches Hermes once; Linux, Windows and Android
apps build in crossbind's linux, windows and android-app images, which carry what they compile and link against (see
[Hermes](#hermes)).
They need `RUNNER=DOCKER_RUN` or `DOCKER_EXEC`, and another runner stops the build before its first step.

## The page

`initNative()` and the imports from headers and crates work as in a web build with `useWorker`
([`threading.md`](./threading.md)):

- Every call, `new` and property read returns a promise.
- An object stays in the app's process; the page holds a handle, which the garbage collector releases. A page that
  replaces the page, a reload among them, frees what the previous one held.
- Vectors arrive as arrays, and a plain array passed for a vector parameter becomes one.
- Enum values keep their identity.
- An error keeps its own fields, such as `code`.
- A JavaScript function cannot be passed to the module (`DataCloneError`).

`initNative({ env })` sets environment variables in the app's process. The build's env is the app's own, and a variable
the process already has keeps its value.

## The window

`app.name` in `crossbind.config.js` is the name the app shows: its window's title, its macOS menus, its Windows file
description and the label under its icon on iOS and Android; without it, the app shows `general.name`. A Windows app's
executable also carries `package.json`'s version, which Windows takes as up to four numbers from 0 to 65535 and a
prerelease part, as 1.2.3-beta.1. `app.window` sizes the desktop window:

```js
app: {
    name: 'My App',
    window: { width: 1024, height: 768, minWidth: 640, minHeight: 480, resizable: true },
},
```

The sizes are the page's, in whole pixels up to 16384, whatever frame the window adds around it; a display too small for
the window holds it to its own size. The window opens at 1024 × 768 and
resizes without app.window, and shrinks to any size without a minimum, which needs a window that resizes. An option the
build cannot honour stops it, naming the option.

A macOS app has the app, Edit, View and Window menus every Mac app has, so ⌘C, ⌘V, ⌘Z, ⌘A, ⌘W and ⌘Q reach it. The
page's `alert()`, `confirm()` and `prompt()` show as they do in a browser, and so does the picker of a file input. A
download the page starts, such as an `<a download>` link, asks where to save on macOS. On Android, Back goes back in the
page's history first, and leaves the app when there is none.

An app that cannot start, for want of the WebView2 Runtime or of a file it carries, writes why to its output; a desktop
app its user opened says so in a message box as well.

## The app's functions

The page imports what the app's host does for it from `crossbind/app`, and the app's C++ calls the same through
`<crossbind/app.h>`, which an app's own code finds as it builds, with `CROSSBIND_APP` defined:

```js
import { app, dialog, shell } from 'crossbind/app';

const file = await dialog.save({ defaultName: 'report.csv', filters: [{ name: 'CSV', extensions: ['csv'] }] });
if (file) await Native.exportReport(file);
const { data, cache, logs } = await app.paths();
```

```cpp
#ifdef CROSSBIND_APP
#include <crossbind/app.h>

std::string databasePath() { return crossbind::app::paths().data + "/notes.sqlite"; }
#endif
```

| Function | What it does | macOS, Linux, Windows | iOS | Android |
|---|---|---|---|---|
| `dialog.open({ title, defaultPath, filters, directory, multiple })` | The paths of the files or folders its user picks, or `null` | ✓ | | |
| `dialog.save({ title, defaultPath, defaultName, filters })` | The path its user chooses to save to, or `null` | ✓ | | |
| `shell.openExternal(url)` | An http, https or mailto address in the default browser or mail app | ✓ | ✓ | |
| `shell.openPath(path)` | A file in the app the system opens its kind with | ✓ | | |
| `shell.revealInFolder(path)` | A file, selected, in the system's file manager, or on Linux without one its folder | ✓ | | |
| `app.paths()` | `{ data, cache, logs }`, the app's own folders, made when first asked for | ✓ | ✓ | ✓ |
| `app.quit()` | Ends the app as closing its window does | ✓ | | |

In the page each returns a promise once `initNative()` has run, as what it loads carries the calls to the host; in C++
each waits for its answer, a dialog for its user's. A function a platform has not got rejects, or throws, saying so,
and in a web or Node.js build every one rejects. A filter's extensions go with or without their dot, `"*"` for any
file, paths are absolute, and an option the page misspells fails before the host sees it. The dialogs are modal: to the
app on macOS, to its window elsewhere; one shows at a time, and another rejects while it does.

The page's `shell.openPath` opens files where `app.openPath` in `crossbind.config.js` lets it alone, and nowhere
without it: in `data`, `cache` or `logs`, the app's folders, and in `picked`, what a dialog picked during this run, a
picked folder with what is in it. Opening a program runs it, and a script that found its way into the page could
name any path: list no folder the module writes a file to that the page names or fills. Its `shell.revealInFolder`
shows the app's folders and what a dialog picked during this run. The app's C++ reaches any path. It calls these
functions once the module has started and never on the app's main thread, which the dialogs and the functions that
open something wait for: called before that, as from a static initializer, or once the app quits, they throw.

On the desktop the folders take the name of `app.id`: under `~/Library` on macOS, under `$XDG_DATA_HOME`,
`$XDG_CACHE_HOME` and `$XDG_STATE_HOME` on Linux, and under `%APPDATA%` and `%LOCALAPPDATA%` on Windows. An iOS
app's are its own `Library/Application Support`, `Library/Caches` and `Library/Logs`, and an Android app's its
`files`, `cache` and `files/logs`.

## What the app holds

```
<name>.app/Contents/
├── Info.plist                    CFBundleIdentifier dev.crossbind.<name>
├── MacOS/<name>                  the window, the webview, Hermes and the bindings
├── Frameworks/hermesvm.framework
└── Resources/
    ├── host.hbc                  the embind runtime and the protocol, as Hermes bytecode
    ├── page/                     what Vite built, served at crossbind://app/
    └── data/                     the packages' data (CROSSBIND_DATA_PATH)

<name>-linux-<arch>/
├── <name>                        the window, the webview, Hermes and the bindings, in one executable
└── resources/                    host.hbc, page/ and data/, as on macOS

<name>-win32-<arch>/              as on Linux, with <name>.exe

<name>-ios/                       an Xcode project, written anew on every build
├── <name>.xcodeproj
├── main.m                        calls the app, which comes prebuilt
├── Info.plist
├── lib/iphoneos/, lib/iphonesimulator/
│                                 the host and the archives it links, for each SDK
├── Frameworks/hermesvm.xcframework
└── app/                          host.hbc, page/ and data/, copied into the app's bundle

<name>-android/                   a Gradle project, written anew on every build
├── settings.gradle, build.gradle, gradlew and gradle/
│                                 the Android Gradle plugin and Gradle 9.8.1's wrapper
└── app/
    ├── build.gradle              the app's id, version and ABIs, and Hermes and androidx.webkit from Maven
    └── src/main/
        ├── AndroidManifest.xml
        ├── java/dev/crossbind/app/CrossbindActivity.java
        │                         the WebView, its message port and navigation rule
        ├── jniLibs/<abi>/        the host, JSI, the NDK's libc++ and the packages' shared libraries
        └── assets/app/           host.hbc, page/ and data/, copied out to the app's files when it first starts

<name>-android.apk                the release APK Gradle makes of it, and <name>-android.aab with an upload key
```

The sample app is 6.7 MB on disk and 1.8 MB zipped (arm64): a 0.8 MB host and a 6 MB Hermes. It shows its first
native result 0.34 s after launch on an M-series Mac. A Linux app links Hermes into its executable and runs on the
system's WebKitGTK. A Windows app links it in too and runs on the system's WebView2: the sample's executable is 4.6 MB
on x64, 1.8 MB zipped, and 4.1 MB on arm64, 1.6 MB zipped. Built for iOS devices, the sample is 4.7 MB, 1.3 MB
zipped: a 1.3 MB executable and a 3.3 MB Hermes.
The sample's Android release APK is 14.8 MB with both ABIs: each ABI's libraries take 5.5 MB of it (Hermes 2.4 MB, the
NDK's libc++ 1.4 MB, the host 1 MB), and the Java side 2.9 MB, which R8, off by default, would shrink. Google Play
delivers one ABI.

## Security

- The webview loads `crossbind://app` alone, in any frame; during development, the dev server too. A frame from
  another origin would reach the module's channel and its `crossbind://` requests, so none is loaded. A link the user
  follows to another page opens in the default browser, and any other navigation away is refused.
- The host gives the top frame of its page a token, and every message to the module and every call that travels as a
  `crossbind://` request carries it. Markup, such as an image, a frame from another origin and a sandboxed frame
  cannot read it, so none of them reaches the module. On macOS, iOS and Windows the channel also checks the sender's
  origin, which WebKitGTK does not tell.
- Responses from `crossbind://` let another origin read them only during development, when the page comes from the
  dev server.
- The app's functions (`crossbind/app`) travel with the same token, so the top frame of the page reaches them, and so
  does a frame of the page's own origin, which can read the top frame's globals: the page and such frames are the
  app's own code. `shell.openExternal` opens http, https and mailto addresses alone, the page's `shell.openPath` opens
  files where `app.openPath` lets it alone, nowhere by default, and its `shell.revealInFolder` shows the app's folders
  and what its dialogs picked alone.
- Only the debug host the dev server opens reads `CROSSBIND_APP_URL`; a release build always loads its own page.
- On Android the page comes from `https://appassets.androidplatform.net`, which the app serves from its files, and
  the top frame loads that origin alone. Android does not let an app refuse a frame's page, but no frame reaches the
  module: calls and their bytes travel over a message port the app hands the top frame alone, with the token, and
  the app's origin answers no request for them. Any app can start an activity with extras, so a debug Android app
  opens a dev server on the device alone, and only a debuggable one writes its console to logcat.

## iOS

An iOS app is an Xcode project crossbind writes anew on every build, with the app prebuilt in it, so there is nothing
in it to edit: what would change it comes from `crossbind.config.js`.

```js
app: {
    id: 'com.example.myapp', // the bundle id; dev.crossbind.<name> without it
    team: 'ABCDE12345',      // the Apple team that signs the app; XCODE_DEVELOPMENT_TEAM of ~/.crossbind.json without it
},
```

Open `dist/<name>-ios/<name>.xcodeproj` in Xcode to run the app on a device or to archive it for TestFlight and the App
Store; Xcode signs it for the team. The version is the project's `package.json` version without its prerelease part,
as Apple takes numbers alone. A build for the Simulator
needs no team: `xcodebuild -project dist/<name>-ios/<name>.xcodeproj -sdk iphonesimulator build`.

## Android

An Android app is a Gradle project crossbind writes anew on every build, with the host prebuilt in it for arm64-v8a
and x86_64, so there is nothing in it to edit either.

```js
app: {
    id: 'com.example.myapp', // the application id; dev.crossbind.<name> without it, with _ for each -
},
```

`crossbind app build -p android` packages it in crossbind's android-app image, with no network: the release APK,
`dist/<name>-android.apk`, and with an upload key also the bundle Google Play takes, `dist/<name>-android.aab`.
Without one, the APK is signed with this machine's debug key, which installs it for testing (`adb install`), and the
build says so. The upload key comes from the environment alone, so no secret reaches a file:

| Variable | Value |
|---|---|
| `CROSSBIND_ANDROID_KEYSTORE` | The keystore that holds the upload key. |
| `CROSSBIND_ANDROID_KEY_ALIAS` | The key's alias in it. |
| `CROSSBIND_ANDROID_KEYSTORE_PASSWORD` | The keystore's password. |
| `CROSSBIND_ANDROID_KEY_PASSWORD` | The key's password, when it is not the keystore's. |

The keystore reaches the container read-only and the passwords by name, never on a command line. A keystore without
its alias and password stops the build, and so does an alias or a password without a keystore. Android Studio makes
an upload key, and so does the `keytool` of any JDK. The Gradle project stays in `dist/<name>-android/`, which
Android Studio opens too. The version name is the project's `package.json` version; the version code is made from its
numbers, major × 1,000,000 + minor × 1,000 + patch, so the prereleases of one version share it.

The image carries a JDK, the Android SDK platform and build tools, Gradle and every Maven artifact the build takes,
Hermes' `hermes-android` and androidx.webkit among them, each checked against its sha256, so a build needs no JDK or
Android SDK on the machine and fetches nothing. Gradle's caches and the debug key stay in `~/.crossbind/android/`: the
next build reuses them, and an app signed with the same debug key installs over the last. The host builds in the same
image, as a package's Android libraries do in the android image it adds to, so it needs Docker (`RUNNER=DOCKER_RUN`
or `DOCKER_EXEC`).

`crossbind app dev -p android` keeps one container of the image for the session, whose Gradle daemon packages each
build, and removes it when the session ends. The image is amd64 only, as the android image is, so it runs under
emulation on an Apple silicon Mac: there the conformance app reopened about 25 s after an edit to its native code, and
its page reloaded within 2 s of an edit. The app reaches the device through this machine's `adb`, from `PATH` or the
Android SDK, which crossbind does not install: `brew install --cask android-platform-tools` on macOS,
`sudo apt install adb` on Debian and Ubuntu, or Android Studio's. An app the device already has under another key,
such as the one Google Play installed, cannot be updated; crossbind names the `adb uninstall` that removes it, with
its data, and leaves running it to you.

## Hermes

The host runs React Native's Hermes, release `250829098.0.17`, on every platform. For macOS and iOS the first build
downloads the release for Apple platforms from Maven Central into `~/.crossbind/hermes/` and checks it against the
sha256 crossbind pins. Android, Linux and Windows apps take it from the image they build in. The android-app image
carries the same release's `hermes-android` AAR, whose headers the host compiles against and whose `libhermesvm.so`
Gradle packages, and the release's `hermesc`, which compiles the host bundle.

Linux has no published Hermes, so the linux image carries the same release built from its source, pinned by sha256,
for x64 and arm64. A Linux host builds in that image with its static libc++, against the WebKitGTK 4.1 headers and
libraries of Ubuntu 22.04's packages, which the image carries too, each checked against the sha256 crossbind pins
(`tooling/docker/webkitgtk-sysroot.txt`); the app itself runs on the system's WebKitGTK.

Windows has none for llvm-mingw either, so the windows image carries the same release built from its source with
llvm-mingw, for x64 and arm64, and the headers of Microsoft's WebView2 SDK, release `1.0.4258.31`, both pinned by
sha256. A Windows host builds in that image into one executable, with llvm-mingw's libc++ and the mingw-w64 runtime
linked in and no DLL beside it: webview/webview loads the system's WebView2 Runtime itself.

`crossbind licenses -e app` lists what the app carries beside its packages: crossbind's runtime, Hermes, JSI's
`jsi.cpp` from the same release and webview/webview, each with its version, its sha256 and its license text; with
`--platform linux`, the Hermes source and the libc++ a Linux app links; with `--platform win32`, the Hermes source, the
WebView2 SDK and the llvm-mingw and mingw-w64 runtimes a Windows app links, whose notices its build copies out of the
image; with `--platform ios`, no webview/webview, which an iOS app does not use; with `--platform android`, Hermes'
AAR, the fbjni and androidx.webkit Gradle adds and the NDK's libc++ the app carries. `--notices` writes them to a file
to ship with the app.

## Environment variables of the app

| Variable | Effect |
|---|---|
| `CROSSBIND_APP_URL` | Opens this page instead of `crossbind://app/`, in a debug build only; the Vite plugin sets it to the dev server. |
| `CROSSBIND_APP_CONSOLE` | Writes the page's console and uncaught errors to the app's output; on during development. A Windows app has no console of its own, so it writes only to an output that is redirected, as a development session's is. With it, an app that cannot start says why in its output alone, without a message box. |

An Android app takes them as its activity's string extras (`adb shell am start --es CROSSBIND_APP_CONSOLE 1 …`) and
writes to logcat, under the tag `Crossbind`: the URL only on `localhost`, and the console only in a debuggable app.

## Limits

- macOS 11 or later, built on macOS.
- Linux: a glibc system with WebKitGTK 4.1, release 2.40 or later (`libwebkit2gtk-4.1-0` on Debian and Ubuntu),
  measured on Ubuntu 22.04. A Linux app builds in crossbind's linux image, so it needs Docker (`RUNNER=DOCKER_RUN` or
  `DOCKER_EXEC`), on a Mac as well.
- The ad hoc signature opens the app on the Mac that built it. Developer ID signing and notarization are not wired yet.
- Windows, x64 and arm64, with the WebView2 Runtime, which Windows 11 includes; measured on GitHub's Windows Server
  2025 runner with WebView2 154 and its Windows 11 arm64 runner with 155. A Windows app builds in crossbind's windows
  image, so it needs Docker (`RUNNER=DOCKER_RUN` or `DOCKER_EXEC`), on a Mac or a Linux machine as well. Building
  one or developing it on a Windows machine has not been measured yet.
- A Windows app is not signed, so SmartScreen warns about it once it is downloaded. Authenticode signing is not wired
  yet.
- On the desktop, one window.
- On macOS the file dialogs, `shell.revealInFolder`, `app.paths` and `app.quit` have been measured, and so has
  `shell.openExternal` refusing other addresses; `shell.openExternal` opening one and `shell.openPath` opening a file
  have not. On Linux and Windows the dialogs, `shell.openExternal` opening an address, `shell.openPath`,
  `shell.revealInFolder` and `app.quit` are built, not measured yet.
- A download the page starts saves where its user picks on macOS, when it is a `Blob` or other data the page holds: an
  `<a download>` link to one of the app's own files saves nothing yet, so the page fetches the file and saves it as a
  `Blob`. WebView2 and WebKitGTK handle downloads themselves on Windows and Linux, which has not been measured yet; an
  iOS or Android app does not save one yet.
- iOS 15.1 or later, arm64 alone: devices, and the Simulator of an Apple silicon Mac. It builds on macOS with Xcode.
- During development an iOS app runs in the Simulator; a device runs the Xcode project's build.
- An iOS app has no icon of its own yet, which App Store Connect requires.
- Android 13 (API 33) or later, the level crossbind's Android libraries build against, with Android System WebView
  116 or later, the first that passes byte arrays as ArrayBuffer messages; an older WebView gets a message that names
  the version it needs. arm64-v8a and x86_64.
- An Android app builds on macOS and Linux. It has no icon of its own yet, and its one activity shows the page under the
  system bars' insets.
- Vite only.

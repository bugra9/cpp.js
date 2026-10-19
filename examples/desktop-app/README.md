# @crossbind/example-desktop-app
**crossbind desktop app sample**

A macOS, Linux and iOS app whose page runs in the system webview and whose C++ runs natively in the app: crossbind
builds `src/native` and the matrix library into the app's own host, and the page calls it with the same `initNative()`
and awaited calls as a web build that runs its module in a worker. There is no Node.js and no browser engine in the
app; the page uses the system's own, WKWebView on macOS and iOS and WebKitGTK on Linux.

# Getting Started

>**Note**: Make sure you have completed the [crossbind - Prerequisites](https://crossbind.dev/docs/guide/getting-started/prerequisites) instructions.
Apps build on macOS with Xcode's command line tools, iOS apps with Xcode and its iOS platform, and Linux apps in
crossbind's linux image; the bindings are generated in Docker. The first build fetches Hermes once into `~/.crossbind/hermes`: React Native's build for Apple platforms on
macOS, the same release built from its source on Linux, where it also downloads WebKitGTK's headers and libraries.

## Setup

Install the dependencies:

```bash
pnpm install
```

Inside the crossbind repository, build the library's archives first:
`pnpm --filter @crossbind/example-lib-prebuilt-matrix run build:desktop`, `run build:ios` for the iOS app and
`run build:android` for the Android app.

## Get Started

```bash
pnpm dev
```

opens the app on Vite's dev server: edits to the page reload it, edits to the C++ rebuild the app and open it again,
and the page's console shows in the terminal. Closing the window ends the session.

## Build

```bash
pnpm build
```

writes the app to `dist/crossbind-example-desktop-app.app`, signed ad hoc, so it opens on the Mac that built it. On
Linux it writes `dist/crossbind-example-desktop-app-linux-<arch>/` and the same as a `.tar.gz`, which runs where
WebKitGTK 4.1 is installed (`libwebkit2gtk-4.1-0` on Debian and Ubuntu).

## iOS

```bash
pnpm dev:ios
```

opens the app in the iOS Simulator on Vite's dev server, as `pnpm dev` does on the desktop; ending the app in the
Simulator ends the session.

```bash
pnpm build:ios
```

writes the app's Xcode project to `dist/crossbind-example-desktop-app-ios/`. Open it in Xcode to run the app on an
iPhone, once `crossbind.config.js` names the app's bundle id and Apple team (`app: { id, team }`).

## Android

```bash
pnpm dev:android
```

opens the app on the attached Android device or the running emulator on Vite's dev server, as `pnpm dev` does on the
desktop; ending the app ends the session. Start an emulator first, in Android Studio's Device Manager, or connect a
phone with USB debugging on.

```bash
pnpm build:android
```

writes the app's Gradle project to `dist/crossbind-example-desktop-app-android/`. Open it in Android Studio, or run
`./gradlew assembleDebug` in it for an APK and `./gradlew bundleRelease` for Google Play.

## Test

`pnpm run e2e:prod` opens the built app and waits for the page to log the result; with `CROSSBIND_APP_PLATFORM=ios` it
builds the Xcode project for the Simulator and opens the app there, and with `android` it builds the Gradle project as
a debug APK and opens the app on the attached device.

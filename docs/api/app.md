# Apps — `target.runtimeEnv: 'app'`

> An app whose page runs in the system webview and whose bindings run natively in the app's own process, with no
> Node.js and no browser engine of its own. macOS, Linux, iOS and Android for now.

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
| `vite` | Builds the host for this machine and opens the app on the dev server. An edit to the page reloads it; an edit to native code, or to what the page imports from it, rebuilds the host and opens the app again. The page's console shows in the terminal, and closing the window ends the session. |
| `vite build` | Builds the page and the host and writes the app: `dist/<name>.app`, signed ad hoc, on macOS; `dist/<name>-linux-<arch>/` and the same as a `.tar.gz` on Linux. |
| `crossbind build -p host -e app` | Builds the host alone, with no page in it: `<paths.output>/<name>.darwin-<arch>.app` on macOS, `<paths.output>/<name>.linux-<arch>` and its `.tar.gz` on Linux. `-p linux` builds a Linux app from a Mac as well. |
| `CROSSBIND_APP_PLATFORM=ios vite` | Builds the host for the iOS Simulator and opens the app there on the dev server: in the Simulator already booted, else in an iPhone of the newest iOS. Edits reload the page or rebuild the host as on the desktop, and ending the app in the Simulator ends the session. |
| `CROSSBIND_APP_PLATFORM=ios vite build` | Builds the page and the host for devices and the Simulator and writes the app's Xcode project, `dist/<name>-ios/` (see [iOS](#ios)). |
| `crossbind build -p ios -e app` | Writes the Xcode project with no page in it: `<paths.output>/<name>-ios`, or `<name>-ios.debug` for a debug build. |
| `CROSSBIND_APP_PLATFORM=android vite` | Builds the host for the attached Android device or emulator, installs the app as a debug APK and opens it on the dev server, which the device reaches through `adb reverse`. Edits reload the page or rebuild the host as on the desktop; the page's console shows in the terminal, and the end of the app's process, as when it is swiped away, ends the session (Back leaves the process running). crossbind starts no emulator: start one, or connect a phone with USB debugging on, and with several attached set `ANDROID_SERIAL`. |
| `CROSSBIND_APP_PLATFORM=android vite build` | Builds the page and the host for arm64-v8a and x86_64 and writes the app's Gradle project, `dist/<name>-android/` (see [Android](#android)). |
| `crossbind build -p android -e app` | Writes the Gradle project with no page in it: `<paths.output>/<name>-android`, or `<name>-android.debug` for a debug build. |

The first build fetches Hermes once, and on Linux WebKitGTK's headers and libraries too (see [Hermes](#hermes)).
Without `CROSSBIND_APP_PLATFORM`, Vite builds this machine's desktop app; `ios` and `android` are the other values it
takes.

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
│                                 the Android Gradle plugin and Gradle 9.4.1's wrapper
└── app/
    ├── build.gradle              the app's id, version and ABIs, and Hermes and androidx.webkit from Maven
    └── src/main/
        ├── AndroidManifest.xml
        ├── java/dev/crossbind/app/CrossbindActivity.java
        │                         the WebView, its message port and navigation rule
        ├── jniLibs/<abi>/        the host, JSI, the NDK's libc++ and the packages' shared libraries
        └── assets/app/           host.hbc, page/ and data/, copied out to the app's files when it first starts
```

The sample app is 6.7 MB on disk and 1.8 MB zipped (arm64): a 0.8 MB host and a 6 MB Hermes. It shows its first
native result 0.34 s after launch on an M-series Mac. A Linux app links Hermes into its executable and runs on the
system's WebKitGTK. Built for iOS devices, the sample is 4.7 MB, 1.3 MB zipped: a 1.3 MB executable and a 3.3 MB Hermes.
The sample's Android release APK is 14.8 MB with both ABIs: each ABI's libraries take 5.5 MB of it (Hermes 2.4 MB, the
NDK's libc++ 1.4 MB, the host 1 MB), and the Java side 2.9 MB, which R8, off by default, would shrink. Google Play
delivers one ABI.

## Security

- The webview loads `crossbind://app` alone, in any frame; during development, the dev server too. A frame from
  another origin would reach the module's channel and its `crossbind://` requests, so none is loaded. A link the user
  follows to another page opens in the default browser, and any other navigation away is refused.
- The host gives the top frame of its page a token, and every message to the module and every call that travels as a
  `crossbind://` request carries it. Markup, such as an image, a frame from another origin and a sandboxed frame
  cannot read it, so none of them reaches the module. On macOS and iOS the channel also checks the sender's origin,
  which WebKitGTK does not tell.
- Responses from `crossbind://` let another origin read them only during development, when the page comes from the
  dev server.
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

Open `dist/<name>-android/` in Android Studio to run the app on a device or an emulator, or to make a signed bundle for
Google Play. From a terminal, `./gradlew bundleRelease` makes the bundle and `./gradlew assembleDebug` an APK that
installs anywhere, signed with the machine's debug key. The version name is the project's `package.json` version; the
version code is made from its numbers, major × 1,000,000 + minor × 1,000 + patch, so the prereleases of one version
share it.

Gradle adds Hermes, React Native's `hermes-android` of the same release, and androidx.webkit from Maven, and needs a
JDK 17 or later and the Android SDK: `ANDROID_HOME`'s, else the one Android Studio installs. The host builds in
crossbind's android image, as a package's Android libraries do, so it needs Docker (`RUNNER=DOCKER_RUN` or
`DOCKER_EXEC`), and the first build unpacks Hermes' AAR with `unzip`.

## Hermes

The host runs React Native's Hermes for Apple platforms, release `250829098.0.17`, on macOS and iOS alike. The first
build downloads it from Maven Central into `~/.crossbind/hermes/` and checks it against the sha256 crossbind pins.
Android takes the same release's `hermes-android` AAR the same way: the host compiles against its headers and links
its `libhermesvm.so`, which the app's Gradle build packages, and the host bundle compiles with the `hermesc` of the
release's `hermes-compiler` package, pinned too, in crossbind's android image.

Linux has no published Hermes: the first Linux build compiles the same release from its source, pinned by sha256, in
crossbind's linux image, once per machine and arch, in a few minutes. The host builds in that image too, with its
static libc++, against the WebKitGTK 4.1 headers and libraries of Ubuntu 22.04's packages. The first build downloads
those from Launchpad into `~/.crossbind/sysroots/` and checks each against the sha256 crossbind pins
(`src/assets/webkitgtk-sysroot.txt`); the app itself runs on the system's WebKitGTK.

`crossbind licenses -e app` lists what the app carries beside its packages: crossbind's runtime, Hermes, JSI's
`jsi.cpp` from the same release and webview/webview, each with its version, its sha256 and its license text; with
`-p linux`, the Hermes source and the libc++ a Linux app links; with `-p ios`, no webview/webview, which an iOS app does
not use; with `-p android`, Hermes' AAR, the fbjni and androidx.webkit Gradle adds and the NDK's libc++ the app
carries. `--notices` writes them to a file to ship with the app.

## Environment variables of the app

| Variable | Effect |
|---|---|
| `CROSSBIND_APP_URL` | Opens this page instead of `crossbind://app/`, in a debug build only; the Vite plugin sets it to the dev server. |
| `CROSSBIND_APP_CONSOLE` | Writes the page's console and uncaught errors to the app's output; on during development. |

An Android app takes them as its activity's string extras (`adb shell am start --es CROSSBIND_APP_CONSOLE 1 …`) and
writes to logcat, under the tag `Crossbind`: the URL only on `localhost`, and the console only in a debuggable app.

## Limits

- macOS 11 or later, built on macOS.
- Linux: a glibc system with WebKitGTK 4.1, release 2.40 or later (`libwebkit2gtk-4.1-0` on Debian and Ubuntu),
  measured on Ubuntu 22.04. A Linux app builds in crossbind's linux image, so it needs Docker (`RUNNER=DOCKER_RUN` or
  `DOCKER_EXEC`), on a Mac as well.
- The ad hoc signature opens the app on the Mac that built it. Developer ID signing and notarization are not wired yet.
- On the desktop, one window, 1024 × 768, titled after the app.
- iOS 15.1 or later, arm64 alone: devices, and the Simulator of an Apple silicon Mac. It builds on macOS with Xcode.
- During development an iOS app runs in the Simulator; a device runs the Xcode project's build.
- An iOS app has no icon of its own yet, which App Store Connect requires.
- Android 13 (API 33) or later, the level crossbind's Android libraries build against, with Android System WebView
  116 or later, the first that passes byte arrays as ArrayBuffer messages; an older WebView gets a message that names
  the version it needs. arm64-v8a and x86_64.
- An Android app builds on macOS and Linux. It has no icon of its own yet, and its one activity shows the page under the
  system bars' insets.
- Vite only.

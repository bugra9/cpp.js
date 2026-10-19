# Apps — `target.runtimeEnv: 'app'`

> An app whose page runs in the system webview and whose bindings run natively in the app's own process, with no
> Node.js and no browser engine of its own. macOS, Linux and iOS for now; Android follows.

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

The first build fetches Hermes once, and on Linux WebKitGTK's headers and libraries too (see [Hermes](#hermes)).
Without `CROSSBIND_APP_PLATFORM`, Vite builds this machine's desktop app; `ios` is the one other value it takes.

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
```

The sample app is 6.7 MB on disk and 1.8 MB zipped (arm64): a 0.8 MB host and a 6 MB Hermes. It shows its first
native result 0.34 s after launch on an M-series Mac. A Linux app links Hermes into its executable and runs on the
system's WebKitGTK. Built for iOS devices, the sample is 4.7 MB, 1.3 MB zipped: a 1.3 MB executable and a 3.3 MB Hermes.

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

## Hermes

The host runs React Native's Hermes for Apple platforms, release `250829098.0.17`, on macOS and iOS alike. The first
build downloads it from Maven Central into `~/.crossbind/hermes/` and checks it against the sha256 crossbind pins.

Linux has no published Hermes: the first Linux build compiles the same release from its source, pinned by sha256, in
crossbind's linux image, once per machine and arch, in a few minutes. The host builds in that image too, with its
static libc++, against the WebKitGTK 4.1 headers and libraries of Ubuntu 22.04's packages. The first build downloads
those from Launchpad into `~/.crossbind/sysroots/` and checks each against the sha256 crossbind pins
(`src/assets/webkitgtk-sysroot.txt`); the app itself runs on the system's WebKitGTK.

`crossbind licenses -e app` lists what the app carries beside its packages: crossbind's runtime, Hermes, JSI's
`jsi.cpp` from the same release and webview/webview, each with its version, its sha256 and its license text; with
`-p linux`, the Hermes source and the libc++ a Linux app links; with `-p ios`, no webview/webview, which an iOS app does
not use. `--notices` writes them to a file to ship with the app.

## Environment variables of the app

| Variable | Effect |
|---|---|
| `CROSSBIND_APP_URL` | Opens this page instead of `crossbind://app/`, in a debug build only; the Vite plugin sets it to the dev server. |
| `CROSSBIND_APP_CONSOLE` | Writes the page's console and uncaught errors to the app's output; on during development. |

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
- Vite only.

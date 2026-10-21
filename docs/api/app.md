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
| `crossbind app build` | Builds the page and the host and writes the app with what installs it (see [Installers](#installers)): `dist/<name>.app`, signed ad hoc or with a Developer ID (see [Signing a macOS app](#signing-a-macos-app)), and `dist/<name>.dmg` on macOS; `dist/<name>-linux-<arch>/`, the same as a `.tar.gz`, and its `.deb` on Linux. |
| `crossbind app build -p linux` | Writes the Linux app for x64 and arm64, on a Mac as well: `dist/<name>-linux-x64/` and `dist/<name>-linux-arm64/`, each with its `.tar.gz` and `.deb`. A Linux app's development session runs on Linux. |
| `crossbind app build -p windows` | Writes the Windows app for x64 and arm64, on a Mac or a Linux machine as well: `dist/<name>-win32-x64/` and `dist/<name>-win32-arm64/`, each with its `.zip` and `-setup.exe`. A Windows app's development session runs on Windows. |
| `crossbind build -p host -e app` | Builds the host alone, with no page in it: `<paths.output>/<name>.darwin-<arch>.app` on macOS, `<paths.output>/<name>.linux-<arch>` and its `.tar.gz` on Linux. `-p linux` or `-p win32` builds a Linux app, or a Windows app with its `.zip`, from a Mac as well. |
| `crossbind app dev -p ios` | Builds the host for the iOS Simulator and opens the app there on the dev server: in the Simulator already booted, else in an iPhone of the newest iOS. Edits reload the page or rebuild the host as on the desktop, and ending the app in the Simulator ends the session. |
| `crossbind app build -p ios` | Builds the page and the host for devices and the Simulator and writes the app's Xcode project, `dist/<name>-ios/` (see [iOS](#ios)). |
| `crossbind build -p ios -e app` | Writes the Xcode project with no page in it: `<paths.output>/<name>-ios`, or `<name>-ios.debug` for a debug build. |
| `crossbind app dev -p android` | Builds the host for the attached Android device or emulator, installs the app as a debug APK and opens it on the dev server, which the device reaches through `adb reverse`. Edits reload the page or rebuild the host as on the desktop; the page's console shows in the terminal, and the end of the app's process, as when it is swiped away, ends the session (Back leaves the process running). crossbind starts no emulator: start one, or connect a phone with USB debugging on, and with several attached set `ANDROID_SERIAL`. |
| `crossbind app build -p android` | Builds the page and the host for arm64-v8a and x86_64, writes the app's Gradle project, `dist/<name>-android/`, and packages it: `dist/<name>-android.apk`, and with an upload key `dist/<name>-android.aab` too (see [Android](#android)). |
| `crossbind build -p android -e app` | Writes the Gradle project with no page in it: `<paths.output>/<name>-android`, or `<name>-android.debug` for a debug build. A release build packages it as `crossbind app build -p android` does. |
| `crossbind app updater-key` | Prints a new key pair for a desktop app's updates: the public key for `app.updater.publicKey`, the private one for `CROSSBIND_UPDATER_PRIVATE_KEY` (see [Updates](#updates)). |

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
- A JavaScript function passed to the module runs in the page when native code calls it, later and without an answer
  ([Events and callbacks](#events-and-callbacks)).

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

A macOS app opens with the app, Edit, View and Window menus every Mac app has, so ⌘C, ⌘V, ⌘Z, ⌘A, ⌘W and ⌘Q reach
it, and the page may set its own, as [Menus](#menus) tells. The
page's `alert()`, `confirm()` and `prompt()` show as they do in a browser, and so does the picker of a file input. A
download the page starts, such as an `<a download>` link, asks where to save on macOS. On Android, Back goes back in the
page's history first, and leaves the app when there is none.

An app that cannot start, for want of the WebView2 Runtime or of a file it carries, writes why to its output; a desktop
app its user opened says so in a message box as well.

## The icon

`app.icon` names a square PNG, at best 1024 × 1024, and the build makes each platform's icon from it:

```js
app: {
    icon: 'icon.png',
},
```

- macOS: `icon.icns` in the bundle, 16 to 1024 pixels, which the Dock and Finder show as the PNG is: a Mac icon keeps
  a transparent margin of its own.
- Windows: the executable's icon, 16 to 256 pixels, which Explorer, the taskbar and the window show.
- Linux: the window's icon, 512 pixels, and the menu's, which the Debian package installs. GNOME on Wayland shows the
  menu's for the window too.
- iOS: one 1024 × 1024 image, its transparent parts white, from which Xcode makes every size and whose corners iOS
  rounds: the App Store takes no transparent icon.
- Android: an adaptive icon, the whole PNG, its margin too, in the middle two thirds of a white square, which the
  launcher shapes.

Without `app.icon` an app has the system's default icon. A path that names no square PNG stops the build. Each size is
resampled from the PNG, so a small one blurs when enlarged.

## Installers

`crossbind app build` writes what installs a desktop app beside it:

- macOS: `dist/<name>.dmg`, a disk image that holds the app beside a link to Applications, onto which its user drags
  it.
- Linux: `dist/<name>-linux-<arch>.deb`, a Debian package that puts the app in `/usr/lib/<package>`, its command in
  `/usr/bin` and its entry and icon in the menu. It depends on WebKitGTK 4.1, release 2.40 or later, and GTK 3, which
  `apt install ./<name>-linux-<arch>.deb` installs with it. The package is named after `general.name`, in lower case
  with a hyphen for each underscore, from its first letter or digit; package.json's `author` and `description` are its
  maintainer and description, and the app's name stands for both without them.
- Windows: `dist/<name>-win32-<arch>-setup.exe`, which installs the app for the user who runs it, with no
  administrator's approval, in `%LOCALAPPDATA%\Programs\<app name>`. It adds the app to the Start menu and to the apps
  Settings lists, whose Uninstall removes it again and leaves its data, and when the system has no WebView2 Runtime it
  downloads Microsoft's bootstrapper, which installs it. While the app runs, an update or Uninstall asks to close it
  and changes nothing. `/S` installs without a window. NSIS, in crossbind's windows image, builds it.

The Debian package and the shortcut and folder take their names from the app's, so a `general.name` that makes no
Debian name, or an app name with any of `< > : / | ? *` or a space or dot at its end, stops `crossbind app build` before
anything compiles.

A macOS or Windows app is signed with a key in the environment, as the next sections tell. The Debian package is not
signed: apt checks the signature of a repository, not of a package.

## Signing a macOS app

`crossbind app build` signs a macOS app ad hoc, which opens it on the Mac that built it alone, and says so. With a
Developer ID it signs the app and its framework with that identity instead, in the hardened runtime, and with an App
Store Connect API key Apple also notarizes the app, whose ticket the build staples to it before it makes the disk
image: the app then opens on any Mac, offline too. The disk image stays unsigned, so that Gatekeeper judges the app in
it, which Apple has notarized. Both come from the environment alone:

| Variable | Value |
|---|---|
| `CROSSBIND_APPLE_SIGNING_IDENTITY` | A code signing identity in the keychain, by name or hash, as `Developer ID Application: <name> (<team>)`. |
| `CROSSBIND_APPLE_API_KEY` | The API key's `.p8` file, which App Store Connect gives once. |
| `CROSSBIND_APPLE_API_KEY_ID` | The key's ID. |
| `CROSSBIND_APPLE_API_ISSUER` | The issuer ID of the key's team. |

An identity the keychain does not hold, a name two of its identities share, as after a renewal, a key without an
identity or a key without all three stops `crossbind app build` before anything compiles, and so does a key beside an
identity other than a Developer ID Application one. Apple takes a few minutes to check the app, two hours at most
before the build gives up, and a rejection stops the build with Apple's log. A signed app that is not notarized opens
on another Mac only once its user allows it in System Settings, and the build says so.

## Signing a Windows app

`crossbind app build` leaves a Windows app and its setup program unsigned, so SmartScreen warns about them once they
are downloaded, and says so. With a key in the environment, jsign in crossbind's windows image signs the app before
its zip is made, and the setup program and its uninstaller as NSIS writes them, with Authenticode and a timestamp. The
key is jsign's own: a cloud's key service whose credentials jsign takes as its password, such as Azure Trusted Signing,
Azure Key Vault, AWS or Google Cloud KMS, or SSL.com eSigner, or a PKCS#12 file. Its files reach the container
read-only, and its passwords by name, never on a command line:

| Variable | Value |
|---|---|
| `CROSSBIND_WINDOWS_SIGNING_STORETYPE` | jsign's store type, as `TRUSTEDSIGNING`, `AZUREKEYVAULT`, `AWS`, `GOOGLECLOUD`, `ESIGNER` or `PKCS12`. |
| `CROSSBIND_WINDOWS_SIGNING_KEYSTORE` | The key store: the service's endpoint or name, or the PKCS#12 file. |
| `CROSSBIND_WINDOWS_SIGNING_ALIAS` | The key's name in it. |
| `CROSSBIND_WINDOWS_SIGNING_STOREPASS` | Its password, or the service's access token. |
| `CROSSBIND_WINDOWS_SIGNING_KEYPASS` | The key's password, where it is not the store's. |
| `CROSSBIND_WINDOWS_SIGNING_CERTFILE` | The certificate chain a cloud key comes without, as a `.p7b` file. |
| `CROSSBIND_WINDOWS_SIGNING_TSAURL` | The timestamp server; `http://timestamp.digicert.com` without it. |

With Azure Trusted Signing, for one:

```bash
export CROSSBIND_WINDOWS_SIGNING_STORETYPE=TRUSTEDSIGNING
export CROSSBIND_WINDOWS_SIGNING_KEYSTORE=weu.codesigning.azure.net
export CROSSBIND_WINDOWS_SIGNING_ALIAS=<account>/<profile>
export CROSSBIND_WINDOWS_SIGNING_STOREPASS="$(az account get-access-token --resource https://codesigning.azure.net --query accessToken -o tsv)"
```

A variable without the store type, a store type jsign does not take, a key file that is not there, or a hardware
token, which the container does not reach, stops `crossbind app build` before anything compiles. SmartScreen trusts a signed app as its certificate's
downloads build a reputation, so the first downloads of a new certificate may still warn.

## Updates

A desktop app updates itself from where `app.updater` says, with updates the key it names has signed:

```js
app: {
    updater: {
        url: 'https://example.com/updates/<name>-{platform}-{arch}.update.json',
        publicKey: '<what crossbind app updater-key prints>',
    },
},
```

`crossbind app updater-key` makes the key pair. The public key goes in `app.updater.publicKey`; the private one goes in
`CROSSBIND_UPDATER_PRIVATE_KEY` where the app is built, and nowhere else, as whoever has it can sign an update the app
installs. With it, `crossbind app build` writes each desktop app's update beside the app, signed with Ed25519:

- `dist/<name>-<platform>-<arch>.update.json`, the manifest: package.json's version, the update's file and its
  signature.
- The file: on macOS `dist/<name>-darwin-<arch>.app.zip`, the app as signed and notarized, zipped with ditto; on Linux
  the app's `.tar.gz`; on Windows its setup program.

Both go where `app.updater.url` points, with `{platform}` as `darwin`, `linux` or `win32` and `{arch}` as `x64` or
`arm64`, and the file beside the manifest. The page asks for an update and installs it when it decides to, as once its
user agrees; the host asks no one:

```js
import { updater } from 'crossbind/app';

const update = await updater.check();
if (update && confirm(`Install ${update.version}?`)) await updater.install();
```

`updater.check()` gives `{ version }` when the manifest's version is newer than the app's, as semver orders them, and
`null` otherwise. `updater.install()` downloads the file into the app's cache folder and installs it only when the
signature covers the app's id, its platform and architecture, its version and its SHA-512. The app then quits and
opens the new version, so it saves what it needs first; the promise rejects when installing fails. One check or
install runs at a time, and another rejects meanwhile. A manifest past 64 KiB or a file past 2 GiB fails.

- macOS: the bundle in the zip takes the app's place, and opens.
- Linux: the folder in the archive takes the app's place, and its executable opens.
- Windows: the setup program waits up to 30 seconds for the app to quit, installs the update in the app's folder and
  opens it, or opens the app as it was once it has waited in vain.

On macOS and Linux the app's folder swaps the app for its update in one step, which local file systems such as APFS
and ext4 do; where it cannot, as on a network share, the update fails and leaves the app as it is. An app updates where
its user can change it, too: a macOS app opened from its disk image, or from where it was downloaded to, updates once
it is moved to Applications, and a Linux app installed from its Debian package updates with the package manager. The
C++ of an app calls the same as `crossbind::app::checkForUpdate()` and `crossbind::app::installUpdate()`, which wait
for the download. An iOS or Android app updates through its store, and `updater.check()` rejects there.

An `app.updater.url` that is neither https nor http on localhost or names no manifest, a public key that is none or
one anyone can forge signatures for, a package.json version that is not semver, and a private key that is not the
public key's pair stop `crossbind app build` before anything compiles. The host checks signatures with Monocypher,
which it compiles in.

## The app's functions

The page imports what the app's host does for it from `crossbind/app`. The app's C++ calls the same, but for
`menu.set` and `events.on`, through `<crossbind/app.h>`, which an app's own code finds as it builds, with
`CROSSBIND_APP` defined:

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
| `menu.set(menus)` | Sets the app's menus, whose clicks are the event `menu`; the page alone | ✓ | | |
| `events.on(name, listener)` | Calls `listener` with each event of this name the app's C++ emits; returns what stops it | ✓ | ✓ | ✓ |
| `updater.check()` | `{ version }`, the newer version `app.updater.url` offers, or `null` | ✓ | | |
| `updater.install()` | Installs that version once its signature holds, then quits the app and opens the new one | ✓ | | |

In the page each returns a promise once `initNative()` has run, as what it loads carries the calls to the host, but
`events.on`, which returns at once what stops it and throws where it cannot listen; in C++ each waits for its answer,
a dialog for its user's, but `emitEvent`. A function a platform has not got rejects, or throws, saying so, and in a web
or Node.js build every one fails. A filter's extensions go with or without their dot, `"*"` for any
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

## Events and callbacks

Native code reaches the page in two ways, each one way.

A function the page passes to the module, such as a progress callback, runs in the page when native code calls it:

```js
await Native.exportReport(file, (done) => { progress.value = done; });
```

The call reaches the page later. Native code goes on at once and gets `undefined` for an answer, so pass a function
where native code calls one whose answer it does not use, such as an `emscripten::val`, a Rust `JsFunction` or a
`void` callback. Native code calls it on the module's thread, as any JavaScript value; another thread emits an event
instead. The calls run in the order native code made them, perhaps after the call that passed the function returns,
and an error one throws reaches the page as an uncaught one. Their arguments arrive as results do, numbers, strings and
arrays as copies; a pointer, such as the one a C callback gets for its buffer, may point at nothing by the time the
page reads it. Native code may keep the function and call it again, and the page lets go of it once native code has.

An event the app's C++ emits reaches the page's listeners of it, with the value its JSON text holds:

```cpp
crossbind::app::emitEvent("progress", "{\"done\":0.5}");
```

```js
import { events } from 'crossbind/app';

const stop = events.on('progress', ({ done }) => { progress.value = done; });
```

`emitEvent` waits for nothing, so any thread may call it, and events of the module's thread keep their order among the
calls of the page's functions. A page gets the events emitted once its first `events.on`, or the first function it
passes, has reached the host: a call of the module it makes after either comes later. Text that is no JSON reaches no
page, and the app's output says why. Both travel with the page's other messages, on every platform an app runs on.

## Menus

The page sets the app's menus while it runs, and hears of their clicks as the event `menu`:

```js
import { events, menu } from 'crossbind/app';

await menu.set([
    { label: 'File', items: [
        { label: 'Open…', id: 'open', accelerator: 'CmdOrCtrl+O' },
        { type: 'separator' },
        { role: 'quit' },
    ] },
    { role: 'editMenu' },
    { label: 'View', items: [{ label: 'Sidebar', id: 'sidebar', checked: true, accelerator: 'F9' }] },
    { role: 'windowMenu' },
]);
events.on('menu', ({ id, checked }) => {
    if (id === 'open') openFile();
    if (id === 'sidebar') sidebar.hidden = !checked;
});
```

A menu is `{ label, items }`, or a standard one by its role, `editMenu` or `windowMenu`, which a label may rename. An
item is `{ label, id, accelerator, enabled, checked }`, a submenu `{ label, items }`, `{ type: 'separator' }`, a
standard menu, or a standard item by its role, which a label may rename: `undo`, `redo`, `cut`, `copy`, `paste` and
`selectAll`, which keep the platform's keys, and `minimize`, `close` and `quit`, whose accelerator the page may change.
A click of an item with an id is the event `menu` of `{ id }`, or of `{ id, checked }` for an item with `checked`,
which the click turns over first; a standard item does what its role says, and the page hears nothing of it. An
accelerator is a key with `CmdOrCtrl`, `Ctrl` or `Alt`, and maybe `Shift`, joined by `+`, as `CmdOrCtrl+Shift+O` is,
or one of `F1` to `F12`, alone or with any of them. The key is a capital letter, a digit, a function key or one of
`Enter`, `Escape`, `Tab`, `Space`, `Backspace`, `Delete`, `Up`, `Down`, `Left`, `Right`, `Home`, `End`, `PageUp`,
`PageDown`, `Plus`, `Minus`, `Comma` and `Period`, and `CmdOrCtrl` is ⌘ on macOS and Ctrl elsewhere. A menu the page
gets wrong fails before the host sees it, naming the item.

Each call replaces the menus the last one set, so the page changes an item by setting them all again. On macOS they
follow the app menu, which the app keeps with its ⌘H, ⌥⌘H and ⌘Q, in place of the Edit, View and Window menus it
opens with: ⌘C, ⌘V, ⌘Z and ⌘A reach the page through `editMenu` or the editing items alone, and ⌘M and ⌘W through
`windowMenu` or `minimize` and `close`. On Windows and Linux they are a bar in the window, above the page, which keeps
its size, as the window grows by the bar's height unless it fills the screen; `editMenu` and `windowMenu` are there the
standard items of that platform's apps, and `menu.set([])` takes the bar away. iOS and Android apps have no menu bar,
and `menu.set` rejects there. The event `menu` is the menus' alone: the app's C++ sets no menus, and the events it
emits, one of which the page may set them on, go by other names.

## What the app holds

```
<name>.app/Contents/
├── Info.plist                    CFBundleIdentifier dev.crossbind.<name>
├── MacOS/<name>                  the window, the webview, Hermes and the bindings
├── Frameworks/hermesvm.framework
└── Resources/
    ├── icon.icns                 the icon, with app.icon
    ├── host.hbc                  the embind runtime and the protocol, as Hermes bytecode
    ├── page/                     what Vite built, served at crossbind://app/
    └── data/                     the packages' data (CROSSBIND_DATA_PATH)

<name>-linux-<arch>/
├── <name>                        the window, the webview, Hermes and the bindings, in one executable
└── resources/                    host.hbc, page/ and data/, as on macOS, and icon.png with app.icon

<name>-win32-<arch>/              as on Linux, with <name>.exe, which carries the icon

<name>-ios/                       an Xcode project, written anew on every build
├── <name>.xcodeproj
├── main.m                        calls the app, which comes prebuilt
├── Info.plist
├── Assets.xcassets/              the icon, with app.icon
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
        ├── res/mipmap-*/         the icon, with app.icon
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
- An update installs only when the key of `app.updater.publicKey` signed it, over the app's id, its platform and
  architecture, its version and its file. A server can offer any version to `updater.check()`, and can serve an older
  signed update that is still newer than the installed app, but it installs nothing unsigned, nothing built for another
  platform, and no other app the same key signs. Whoever holds `CROSSBIND_UPDATER_PRIVATE_KEY` can sign any update, so
  it stays where the app is built; the app checks no Apple or Authenticode signature of the update besides.
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
image, and the NSIS its setup program carries; with `--platform ios`, no webview/webview, which an iOS app does not use; with `--platform android`, Hermes'
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
- Signing with a Developer ID and notarizing have not been run with a real Developer ID yet. The app runs in the
  hardened runtime, measured with an ad hoc signature without library validation, which a Developer ID passes when the
  app and its framework carry the same team.
- Windows, x64 and arm64, with the WebView2 Runtime, which Windows 11 includes; measured on GitHub's Windows Server
  2025 runner with WebView2 154 and its Windows 11 arm64 runner with 155. A Windows app builds in crossbind's windows
  image, so it needs Docker (`RUNNER=DOCKER_RUN` or `DOCKER_EXEC`), on a Mac or a Linux machine as well. Building
  one or developing it on a Windows machine has not been measured yet.
- Signing a Windows app has been measured with a throwaway PKCS#12 key, whose signatures and timestamp on the app, its
  zip's copy and the setup program jsign reads back; not yet with a cloud's key service. Windows itself checks them,
  and the uninstaller's, in CI alone.
- The Windows setup program has been built, not yet run on Windows. Its install of the WebView2 Runtime, for a system
  that has none, cannot be measured on the Windows machines crossbind is tested on, which have the runtime; the
  bootstrapper it downloads over HTTPS runs with no check of its own.
- On the desktop, one window.
- The functions the page passes have been measured on macOS and Linux, and the events of C++ on macOS alone; on
  Windows, iOS and Android the conformance runs in CI check the functions.
- On macOS the file dialogs, `shell.revealInFolder`, `app.paths` and `app.quit` have been measured, and so has
  `shell.openExternal` refusing other addresses; `shell.openExternal` opening one and `shell.openPath` opening a file
  have not. On Linux and Windows the dialogs, `shell.openExternal` opening an address, `shell.openPath`,
  `shell.revealInFolder` and `app.quit` are built, not measured yet.
- The icon has been seen in macOS's Finder, in the icon files of an iOS Simulator build and on Android's launcher;
  Windows and Linux apps carry it, but nobody has looked at it there yet.
- A download the page starts saves where its user picks on macOS, when it is a `Blob` or other data the page holds: an
  `<a download>` link to one of the app's own files saves nothing yet, so the page fetches the file and saves it as a
  `Blob`. WebView2 and WebKitGTK handle downloads themselves on Windows and Linux, which has not been measured yet; an
  iOS or Android app does not save one yet.
- iOS 15.1 or later, arm64 alone: devices, and the Simulator of an Apple silicon Mac. It builds on macOS with Xcode.
- During development an iOS app runs in the Simulator; a device runs the Xcode project's build.
- Android 13 (API 33) or later, the level crossbind's Android libraries build against, with Android System WebView
  116 or later, the first that passes byte arrays as ArrayBuffer messages; an older WebView gets a message that names
  the version it needs. arm64-v8a and x86_64.
- An Android app builds on macOS and Linux. Its one activity shows the page under the system bars' insets.
- Vite only.

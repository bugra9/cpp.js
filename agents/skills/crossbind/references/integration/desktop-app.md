<!-- GENERATED from docs/playbooks/integration/desktop-app.md by scripts/build-agent-skill.mjs. Do not edit. -->

# Playbook — A desktop or mobile app on crossbind's own host

> The page runs in the system webview, the bindings natively in the app's process. Reference: [`docs/api/app.md`](../../api/app.md).

Use it when a project wants a desktop, iOS or Android app without Electron or React Native: the same page and the same
`initNative()` calls as its web build, with the C++ or Rust running natively. macOS, Linux, iOS and Android for now; for
Windows desktops today, use Electron with a Node-API addon ([`nodejs.md`](./nodejs.md#electron)).

## Steps

1. The page must be a Vite app. Install the host and the plugin next to crossbind:

   ```bash
   pnpm add -D crossbind@beta @crossbind/plugin-vite@beta @crossbind/core-app-host@beta vite
   ```

2. Mark the project as an app in `crossbind.config.js` and keep the rest of the config as for the web:

   ```js
   target: { runtimeEnv: 'app' },
   ```

3. Add `viteCrossbindPlugin()` to `vite.config.js` if it is not there yet.
4. Write the page as for a worker-backed web build: `await initNative()`, then await every call. Do not pass
   JavaScript functions to the module.
5. Run `pnpm vite` to develop, `pnpm vite build` to get `dist/<name>.app`.
6. For iOS, set `CROSSBIND_APP_PLATFORM=ios`: `vite` then opens the app in the Simulator and `vite build` writes the
   Xcode project `dist/<name>-ios/`. To run it on a device, give the app its bundle id and Apple team in
   `crossbind.config.js` (`app: { id, team }`) and open the project in Xcode.
7. For Android, set `CROSSBIND_APP_PLATFORM=android` with an emulator running or a phone attached: `vite` then opens
   the app on it and `vite build` writes the Gradle project `dist/<name>-android/`. Give the app its id in
   `crossbind.config.js` (`app: { id }`, without hyphens) and open the project in Android Studio, or run
   `./gradlew bundleRelease` in it, for Google Play.

## Validation

- `pnpm vite build` ends with `dist/<name>.app`, and `open dist/<name>.app` shows the page. On Linux it ends with
  `dist/<name>-linux-<arch>/` and its `.tar.gz`, and `dist/<name>-linux-<arch>/<name>` shows the page.
- `CROSSBIND_APP_PLATFORM=ios pnpm vite build` ends with `dist/<name>-ios/<name>.xcodeproj`, which
  `xcodebuild -project dist/<name>-ios/<name>.xcodeproj -sdk iphonesimulator build` builds with no team.
- `CROSSBIND_APP_PLATFORM=android pnpm vite build` ends with `dist/<name>-android/`, in which `./gradlew assembleDebug`
  makes `app/build/outputs/apk/debug/app-debug.apk`; `adb install` puts it on the emulator, and the page logs to
  `adb logcat -s Crossbind` when the app starts with `--es CROSSBIND_APP_CONSOLE 1`.
- With `CROSSBIND_APP_CONSOLE=1`, running `dist/<name>.app/Contents/MacOS/<name>` prints what the page logs.
- `crossbind licenses -e app --notices` writes the notices to ship with the app.

## Pitfalls

- A web build of the same project makes wasm, an app build the host: switch with `target.runtimeEnv`, or keep two
  configs.
- Navigation to another origin is refused; links the user follows open in the default browser. Embed no third-party
  page in an iframe.
- `vite` and `vite build` build the app of the machine they run on, macOS or Linux, unless `CROSSBIND_APP_PLATFORM=ios`
  asks for the iOS app; `crossbind build -p linux -e app` builds a Linux app from a Mac too. A Linux app needs Docker
  to build and WebKitGTK 4.1 (2.40 or later) to run.
- crossbind writes the iOS Xcode project and the Android Gradle project anew on every build, so an edit made in Xcode
  or Android Studio is gone after the next one: the app's identity goes in `crossbind.config.js`.
- An Android app needs Docker, a JDK 17 or later and the Android SDK to build, and an attached device or a running
  emulator to develop on; crossbind starts none. It runs on Android 13 or later with Android System WebView 116 or
  later.

## Reference

- `examples/desktop-app/` — the template (`npm create crossbind@beta -- <dir> Desktop App`).
- `e2e/desktop-app/` — the conformance suite inside an app.

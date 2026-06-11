# AGENTS.md — @cpp.js/plugin-react-native

> React Native (CLI **and** Expo) integration. The most multi-platform plugin in the repo: it touches Gradle (Android), CocoaPods + Xcode (iOS), Metro (JS), and SWIG (C++ bridge generation).

## What lives here

- `package.json` — defines the plugin npm package.
- `react-native-cppjs.podspec` — CocoaPods manifest. iOS app's `pod install` discovers this, runs the iOS build hooks (`script/build_ios.js`).
- `android/build.gradle` — Android Gradle Plugin module config; defers native compilation to `script/CMakeLists.txt` via `externalNativeBuild`.
- `script/CMakeLists.txt` — top-level CMake script Gradle's externalNativeBuild calls; shells out to Node scripts that produce the actual JS bridge + native lib.
- `script/build_android.js` — emits the per-ABI CMake parameter list into the file given as 3rd argument (consumed by `script/CMakeLists.txt`).
- `script/build_android_assets.js` — copies dependency data assets into the app's `android/app/src/main/assets/cppjs` (gradle config phase).
- `script/build_android_deps.js` — source-rebuilds dependencies flagged via `cppjs.overrides.js` / `CPPJS_REBUILD_DEPS`; prints `CPPJS_DEPS_STAMP=` for `build.gradle`.
- `script/resolveBuildTarget.js` — shared Android buildTarget resolution used by the two scripts above.
- `script/build_ios.js` — runs `cppjs build -p ios` + `createXCFramework`. Skips the native build when inputs are unchanged (see `iosLibCache.js`); force with `CPPJS_NO_IOS_CACHE=1`.
- `script/iosLibCache.js` — content-hash stamp (`.cppjs/build/ios-libs-stamp-<buildType>.json`) plus mtime-pinned xcframework outputs (plugin dir can be shared between apps) deciding whether `build_ios.js` can skip.
- `script/build_js.js` — generates the JS-side bridge module Metro bundles. Skips Metro when inputs are unchanged (see `bridgeCache.js`); force with `CPPJS_NO_BRIDGE_CACHE=1`.
- `script/bridgeCache.js` — content-hash stamp (`.cppjs/build/bridge-stamp-<platform>.json`) over app + dependency sources deciding whether `build_js.js` can skip Metro.
- `script/getCliPath.js` — resolves the cpp.js CLI path inside Gradle's CMake context. Deliberately state-free: CMake parses its stdout, so it must never load cpp.js config (which can log to stdout).
- `cpp/` — C++ glue used by the JSI bridge.
- `js/` — JS-side runtime that user code imports.
- `cppjs.config.mjs` — plugin's own cpp.js config (used to expose its native helpers as deps).

Sibling packages:
- `cppjs-plugins/cppjs-plugin-react-native-ios-helper/` — small iOS-side podspec helper.
- `cppjs-plugins/cppjs-plugin-metro/` — Metro bundler integration.

## Build flow on Android

1. User runs `pnpm android` (or `react-native run-android`).
2. Registered gradle tasks (`cppjsBridges`, `cppjsDeps`, `cppjsAssets` — wired before `preBuild`/`configureCMake*`) run the scripts; no process runs at configuration time, so the build is **configuration-cache compatible**. Each script content-caches itself, so the always-run tasks cost ~1 s warm.
3. `cppjsAssets` copies dependency data into **this library's own** `android/src/main/assets/cppjs` (AGP merges library assets into the APK — no cross-project mergeAssets coupling); `cppjsDeps` refreshes `.cppjs/deps-stamp` only when the consumed rebuilt-dependency set changes.
4. Gradle's externalNativeBuild fires `script/CMakeLists.txt` per requested ABI (intersection of `reactNativeArchitectures` with arm64-v8a/x86_64). The stamp file is registered as `CMAKE_CONFIGURE_DEPENDS`, so ninja re-runs the configure automatically when it changes.
5. CMake calls `node script/build_android.js <abi> <buildType> <paramsFile>` and reads one `-DKEY=VALUE` per line from that file (stdout is the cpp.js log channel — never print params there).
6. CMake builds `lib<name>.so` via `getCmakeParameters` output, links JSI/fbjni from the ReactAndroid prefab, and the result lands in the app's APK.

## Build flow on iOS

1. User runs `cd ios && pod install && cd ..`.
2. CocoaPods discovers `react-native-cppjs.podspec`; the podspec's `prepare_command` runs `node script/build_js.js ios && node script/build_ios.js Debug`.
3. `build_ios.js` invokes `createLib` + `createXCFramework` for both `iphoneos` and `iphonesimulator`.
4. The xcframework is vendored into the app via the podspec's `vendored_frameworks`.
5. Subsequent `pnpm ios` builds use the cached xcframeworks; rerun `pod install` to refresh.

## Build flow on JS side

`@cpp.js/plugin-metro` (sibling) hooks Metro's resolver/transformer to:

- Treat `.h` files as importable JS bridge modules.
- Watch native source dirs and trigger Metro reloads when bridge code regenerates.

## Invariants

- **arm64e + x86_64-simulator slices are dropped** for iOS. xcframework names are `ios-arm64` and `ios-arm64-simulator` — no `arm64e` or `x86_64`. The state/index.js path-resolution logic depends on this.
- **Podspec's `EXCLUDED_ARCHS[sdk=iphonesimulator*] = x86_64`** is mandatory. Apple Silicon Macs running the iOS simulator fail to link otherwise.
- **`script/CMakeLists.txt`** is invoked by **Gradle**, not by `cppjs build` directly. Its responsibilities differ from the cpp.js asset CMakeLists; don't conflate them.
- **`build_android.js` / `build_ios.js` shell out to `cpp.js` programmatically**, not via the CLI. They import `cpp.js` exports directly (`createLib`, `buildWasm`, `createXCFramework`).

## Common pitfalls

- **Editing `script/CMakeLists.txt` to do work it shouldn't.** It's a glue layer; real work belongs in the Node scripts it calls.
- **Forgetting to `pod install` after touching the podspec or sibling iOS helper.** iOS won't see the change.
- **Adding an arm64e or x86_64 simulator branch.** We dropped support deliberately. Any new CI matrix entry that includes them will fail.
- **Hardcoding paths inside scripts.** Use `state.config.paths.*` from `cpp.js`; the asset reorg moved several base paths.
- **Forgetting `script/build_js.js` step.** iOS podspec's prepare_command runs it before `build_ios.js`; CI workflow does too. Bridge JS is the link Metro relies on.

## Validation

Strict gate (RN plugin → both mobile samples):

```bash
pnpm run ci:linux:build && pnpm run e2e:dev && pnpm run e2e:prod
```

Mobile-specific (require macOS for iOS, Android SDK for Android):

```bash
# Android (Linux/macOS)
pnpm --filter=@cpp.js/sample-mobile-reactnative-cli android
pnpm run e2e:android

# iOS (macOS only)
cd cppjs-samples/cppjs-sample-mobile-reactnative-cli/ios && pod install && cd -
pnpm --filter=@cpp.js/sample-mobile-reactnative-cli ios
pnpm run e2e:ios
```

CI workflows: `.github/workflows/test-{android,ios}-sample.yml`.

## Reference

- Sibling iOS helper: `cppjs-plugins/cppjs-plugin-react-native-ios-helper/`
- Sibling Metro plugin: `cppjs-plugins/cppjs-plugin-metro/`
- Integration recipes: `docs/playbooks/integration/react-native-cli.md`, `docs/playbooks/integration/react-native-expo.md`
- Canonical samples: `cppjs-sample-mobile-reactnative-cli`, `cppjs-sample-mobile-reactnative-expo`, `cppjs-playground-mobile-reactnative-cli`
- iOS CI workflow (uses bridge cache): `.github/workflows/test-ios-sample.yml`

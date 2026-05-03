# Integration — React Native CLI (bare workflow)

> Persona 2 sub-playbook. The user's project is a bare React Native app (`react-native` in deps, no `expo`). Detection: `react-native` + `metro.config.js` + (`android/` and/or `ios/`) directories.

## Goal

Add cpp.js to a React Native CLI app so:

- Native C++ compiles to a `.so` (Android) and `.a` / xcframework (iOS) and links into the app bundle.
- JS side calls into C++ via the Embind/JSI bridge.
- Metro bundler picks up the cpp.js loader for the JS side.

## When to use

- `react-native` in deps; **no** `expo`/`@expo/cli` in deps.
- `metro.config.js` at root.
- `android/` and/or `ios/` native project directories present.
- Expo users → see `docs/playbooks/integration/react-native-expo.md`.

## Files involved

| File | Role |
|------|------|
| `package.json` | + `cpp.js`, `@cpp.js/plugin-react-native`, `@cpp.js/plugin-react-native-ios-helper`, `@cpp.js/plugin-metro`, optional `@cpp.js/package-<name>` |
| `metro.config.js` | Wrap `getDefaultConfig` output with `CppjsMetroPlugin(...)` |
| `cppjs.config.{js,mjs}` *(new at project root)* | Project-level cpp.js config: deps to consume, paths |
| `src/native/` *(if user wraps own C++)* | `.h` + `.cpp` source files |
| `android/app/build.gradle` | Auto-wired by `@cpp.js/plugin-react-native`'s native CMake hook (no manual edits) |
| `ios/Podfile.lock` | Updated by `pod install` after adding the plugin |
| `ios/<App>.xcodeproj` | Native iOS link picks up the auto-generated podspec |

## Commands

```bash
pnpm add cpp.js @cpp.js/plugin-react-native @cpp.js/plugin-react-native-ios-helper @cpp.js/plugin-metro
pnpm add @cpp.js/package-<name>     # optional

# iOS — install pods (regenerates Podfile.lock + xcframeworks)
cd ios && pod install && cd ..

# Run on Android
pnpm android      # or: pnpm react-native run-android
# Run on iOS
pnpm ios          # or: pnpm react-native run-ios
```

`pod install` runs build hooks from `react-native-cppjs.podspec` that compile the iOS native libraries. `pnpm android` triggers Gradle's externalNativeBuild, which calls `script/CMakeLists.txt` from `@cpp.js/plugin-react-native` and shells out to `cppjs build -p android`.

## Reference config

Mirror `cppjs-samples/cppjs-sample-mobile-reactnative-cli/`.

`metro.config.js` (canonical):

```js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const CppjsMetroPlugin = require('@cpp.js/plugin-metro');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
    ...CppjsMetroPlugin(defaultConfig),
};

module.exports = mergeConfig(defaultConfig, config);
```

`cppjs.config.{js,mjs}` at project root:

```js
import Matrix from '@cpp.js/sample-lib-prebuilt-matrix/cppjs.config.js';
// or any other prebuilt: import Gdal from '@cpp.js/package-gdal/cppjs.config.js';

export default {
    dependencies: [
        Matrix,
        // Gdal,
    ],
    paths: {
        config: import.meta.url,
    },
};
```

`.mjs` is preferred (ESM) so the `import.meta.url` reference works; `.js` is fine too if `package.json` declares `"type": "module"`.

## CI bridge cache (optional, advanced)

The `cppjs-sample-mobile-reactnative-cli` sample keeps a snapshot of generated bridge files at `ci/cppjs-snapshot/` — the iOS workflow restores it before `pod install` to skip the SWIG bridge generation step in CI. This is **not** required for normal development, only for fast CI builds. Pattern:

```
my-app/
└── ci/
    └── cppjs-snapshot/        ← snapshot of .cppjs/build/{bridge,interface} + cache.json
        └── build/
            ├── bridge/
            │   ├── native.i.cpp
            │   └── native.i.cpp.exports.json
            ├── interface/
            │   └── native.i
            └── ...
```

In CI, before pod install:

```bash
mkdir -p .cppjs
cp -r ci/cppjs-snapshot/. .cppjs/
```

Don't name the snapshot dir `.cppjs` — `clear:cache:samples`-style globs may pick it up and delete it. Use a different name (`cppjs-snapshot`, `bridge-cache`, etc.).

## Multithread → COOP/COEP

**Not applicable.** React Native runs JS on JSC/Hermes, not in a browser, so there's no SharedArrayBuffer / COOP/COEP gate. Multithread (`runtime: 'mt'`) on RN uses pthreads via JSI directly. No header config needed for RN apps.

## Validation

- [ ] `pnpm install` succeeds.
- [ ] `cd ios && pod install` succeeds, `Podfile.lock` updated, `*.xcframework` directories appear under `ios/Pods/` or vendored locations.
- [ ] `pnpm android` builds the APK and launches; the app calls into C++ without "library not loaded" errors.
- [ ] `pnpm ios` builds and launches in the iOS simulator (arm64 macOS) or on-device.
- [ ] JSI bridge: `import { initCppJs } from '@cpp.js/plugin-react-native'; await initCppJs(); Module.fn(...)` returns expected result.
- [ ] If wrapping own C++: editing `src/native/native.cpp` + restarting Metro picks up the change (or at least re-run `pod install` / `pnpm android` to recompile).

## Common pitfalls

- **Mixing Expo and bare RN.** If `expo` is in deps, this playbook doesn't apply — switch to `react-native-expo.md`.
- **Skipping `pod install`** after adding the plugin. iOS will fail to find the xcframeworks at link time.
- **Deleting `ci/.cppjs` directly with the older `find`-based clear scripts.** Use the `cppjs-snapshot/` rename pattern (see "CI bridge cache" above) so future clear globs don't wipe it.
- **arm64e / x86_64 simulator slices.** `@cpp.js/package-*-ios` podspecs already exclude `x86_64` for iphonesimulator (Apple Silicon-only). If a custom user package's podspec is missing `EXCLUDED_ARCHS[sdk=iphonesimulator*] = x86_64`, Apple Silicon Macs running the iOS simulator will fail to link.
- **NDK / cmake version mismatch.** RN's externalNativeBuild requires NDK 25+ and cmake 3.22+. `pnpm android` will surface mismatches via Gradle.
- **Editing native bridge code by hand.** `.cppjs/build/bridge/*` is generated by SWIG. Edit the source `.h`/`.cpp`, re-run `pnpm android` / `pnpm ios`, let the plugin regenerate the bridge.
- **Forgetting `watchFolders`** when project is inside a monorepo. If your app lives in a workspace and depends on workspace packages, Metro needs the full repo root in `watchFolders` (see the sample's `metro.config.js` for the pattern).

## Reference samples

- `cppjs-samples/cppjs-sample-mobile-reactnative-cli/` — canonical RN-cli reference (with `ci/cppjs-snapshot/`)
- `cppjs-samples/cppjs-playground-mobile-reactnative-cli/` — bigger demo with multiple packages

Plugin sources:
- `cppjs-plugins/cppjs-plugin-react-native/` (Gradle CMake hook + iOS podspec hook)
- `cppjs-plugins/cppjs-plugin-react-native-ios-helper/` (iOS-side glue)
- `cppjs-plugins/cppjs-plugin-metro/` (Metro bundler integration)

iOS CI workflow (uses bridge cache): `.github/workflows/test-ios-sample.yml`.

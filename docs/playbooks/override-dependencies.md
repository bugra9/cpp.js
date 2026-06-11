# Playbook — Override or rebuild a dependency from source (`cppjs.overrides.js`)

> App authors who need a dependency (e.g. `@cpp.js/package-zlib`) built differently than the published prebuilt: different version, extra build flags, patched sources — or excluded/replaced entirely.

## Goal

A `cppjs.overrides.js` next to the app's `cppjs.config.mjs` that makes cpp.js rebuild the named dependencies from source on every platform (wasm via the bundler plugins, Android via the RN gradle plugin, iOS via `pod install`) and link the rebuilt artifacts instead of the prebuilt ones.

## The overrides file

```js
// cppjs.overrides.js — keys match general name, package name or brand alias
export default {
    // 1) Plain source rebuild, same recipe:
    '@cpp.js/package-zlib': { rebuild: true },

    // 2) Recipe override (this is also an implicit rebuild):
    '@cpp.js/package-proj': {
        nativeVersion: '9.4.0',
        getBuildParams: (base, target) => [...base(target), '-DENABLE_TIFF=OFF'],
    },

    // 3) Exclude a dependency entirely:
    '@cpp.js/package-webp': { exclude: true },

    // 4) Replace with another implementation, keeping the old identity:
    '@cpp.js/package-jpegturbo': { replace: myOtherJpegConfig },
};
```

Overridable recipe keys: `nativeVersion`, `getURL`, `buildType`, `env`, `copyToSource`, `copyToDist`, `beforeRun`, `useIOSCMake`, `sourceReplaceList`, `getExtraLibs`, `replaceList` (append by default; `{ set: [...] }` to replace), `getBuildParams` (chained: receives the base recipe function first), `targetSpecs`, `export`.

One-off rebuilds without a file: `CPPJS_REBUILD_DEPS=all` (or a comma-separated name list) as an environment variable, or `cppjs build --rebuild-deps <names>`.

## How it works

- `buildDependencies` compiles the dependency from source into `<app>/.cppjs/deps/<name>/` and writes a `.cppjs-rebuild.json` marker keyed by a hash of (name, nativeVersion, serialized override).
- Every config load consumes a marker whose key still matches: the dependency's artifact paths switch to the rebuilt `dist`. This works across processes — e.g. Android rebuilds at the gradle config phase, the CMake configure phase picks the fresh paths up.
- The Android plugin forwards a stamp of the consumed set as a CMake argument (`-DCPPJS_DEPS_STAMP`), so changing the override set automatically re-runs the CMake configure — no manual `.cxx` cleaning.
- Rebuilds are incremental per target: adding an ABI/platform later only compiles the missing targets. Concurrent builds of the same dependency are serialized with a lock file (`<name>.lock`).

## Removing an override

- **Recipe-changing overrides** (anything beyond `rebuild: true`) change the marker key, so deleting the entry reverts to the prebuilt artifacts on the next build.
- **Bare `{ rebuild: true }`** has the same key as "no override" (the rebuilt output is content-equivalent), so its cached artifacts keep being used after you delete the entry. To force prebuilts back, drop the cache:

```bash
cppjs clean-deps                       # everything
cppjs clean-deps @cpp.js/package-zlib  # one dependency
```

## Sharp edges

- **Override functions must be self-contained.** They are keyed by their source text: values captured from outer scope do not change the key, so editing them silently keeps the stale cache. Inline every value.
- An incomplete rebuilt cache (e.g. killed build, missing `dist/prebuilt/CMakeLists.txt`) is treated as a miss and rebuilt; if it is consumed by a non-building process you get a log line and a fallback to prebuilts.
- Dependencies without a `cppjs.build` recipe (no source build published) log `using prebuilt` and skip the rebuild.
- **iOS picks overrides up at `pod install` time** (the podspec's prepare command runs the rebuild and vendors the xcframework). After changing `cppjs.overrides.js`, re-run `pod install` — an incremental Xcode build alone keeps the previous artifacts.

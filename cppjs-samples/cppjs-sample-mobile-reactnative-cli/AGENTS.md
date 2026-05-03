# AGENTS.md — @cpp.js/sample-mobile-reactnative-cli

> Canonical reference for the **React Native CLI** integration. This sample is what `docs/playbooks/integration/react-native-cli.md` and the iOS CI workflow point at.

## What this sample is for

- A minimal RN-cli app that loads `@cpp.js/sample-lib-prebuilt-matrix` and calls into it from JS.
- Reference for `metro.config.js` + `cppjs.config.mjs` shape in a bare RN project.
- Source of the **CI bridge cache** used by `.github/workflows/test-ios-sample.yml` to skip SWIG bridge generation in CI.

## Layout

```
cppjs-sample-mobile-reactnative-cli/
├── android/                              ← bare RN Android project
├── ios/                                  ← bare RN iOS project (Podfile + Podfile.lock)
├── ci/
│   └── cppjs-snapshot/                   ← bridge fixtures restored by iOS workflow
│       ├── build/bridge/native.i.cpp
│       ├── build/bridge/native.i.cpp.exports.json
│       ├── build/interface/native.i
│       └── cache.json
├── src/                                  ← RN JS app
├── app.json
├── cppjs.config.mjs                       ← imports Matrix sample-lib
├── metro.config.js                        ← wraps getDefaultConfig with CppjsMetroPlugin
├── package.json
└── playwright.{dev,prod}.config.cjs       ← e2e configs
```

## Key files an agent will touch

- **`metro.config.js`** — exact wiring for `@cpp.js/plugin-metro`. Used as the canonical example in `docs/playbooks/integration/react-native-cli.md`.
- **`cppjs.config.mjs`** — shows how to consume a workspace dep (`@cpp.js/sample-lib-prebuilt-matrix`).
- **`ci/cppjs-snapshot/`** — git-tracked fixtures. **Do not delete.** The iOS workflow's `cp -r ci/cppjs-snapshot/. .cppjs/` step depends on them.

## CI bridge cache pattern

The directory is named `cppjs-snapshot/` (not `.cppjs/`) on purpose: `pnpm clear:cache:samples` and similar globs match `*/.cppjs`, which would otherwise wipe these fixtures. Renaming the snapshot dir survives clear globs.

The iOS workflow restores the snapshot **before** `pod install` so SWIG / bridge generation can be skipped in CI:

```yaml
- name: Restore cached bridge files
  run: |
    mkdir -p ./cppjs-samples/.../my-app/.cppjs
    cp -r ./cppjs-samples/.../my-app/ci/cppjs-snapshot/. ./cppjs-samples/.../my-app/.cppjs/
```

The trailing `/.` + `mkdir -p` keeps the merge nesting-safe regardless of pre-existing state in the runner.

If you regenerate the snapshot, re-commit the four files under `ci/cppjs-snapshot/build/...` and `ci/cppjs-snapshot/cache.json`.

## Validation

Local (macOS):

```bash
pnpm install
cd cppjs-samples/cppjs-sample-mobile-reactnative-cli/ios && pod install && cd -
pnpm --filter=@cpp.js/sample-mobile-reactnative-cli ios

# E2E
pnpm run e2e:ios
```

Local (Linux/macOS for Android):

```bash
pnpm --filter=@cpp.js/sample-mobile-reactnative-cli android
pnpm run e2e:android
```

CI: `.github/workflows/test-ios-sample.yml` and `test-android-sample.yml`.

## Common pitfalls

- **Deleting `ci/cppjs-snapshot/`** with a careless `rm -rf` or assuming it's regenerable — it isn't (well, it is, but only after a full local build that we skip in CI).
- **Renaming back to `ci/.cppjs`.** `pnpm run clear`-style globs will eat it.
- **Skipping `pod install`** after touching the RN plugin's `react-native-cppjs.podspec`. Cached pods will be wrong.
- **Editing the `monorepo` `watchFolders` config** in `metro.config.js` to point elsewhere. The default `require('path').resolve('../../')` is intentional — Metro must see the workspace root to resolve the cpp.js plugin packages.
- **Adding `ios/Pods/` or `android/.gradle/` to git.** They're ignored; build artifacts.

## Reference

- RN-cli playbook: `docs/playbooks/integration/react-native-cli.md`
- Plugin source: `cppjs-plugins/cppjs-plugin-react-native/AGENTS.md`
- iOS CI workflow: `.github/workflows/test-ios-sample.yml`
- Snapshot restoration logic in CI: see "Restore cached bridge files" step

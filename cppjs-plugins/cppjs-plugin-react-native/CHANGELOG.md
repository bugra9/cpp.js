# @cpp.js/plugin-react-native

## 2.0.0-beta.33

### Patch Changes

- fix: on a freshly installed plugin, the app's `configureCMake*` tasks could run
  before this library's TurboModule codegen output existed
  ("codegen/jni ... is not an existing directory"). Every other project's CMake
  configure is now wired to `generateCodegenArtifactsFromSchema` via
  `gradle.projectsEvaluated`, so fresh installs build without a manual unblock.
- feat: Rust binding wiring — the embind-rust adapter and app Rust bridge crates
  join the Android/iOS native builds; the Android dependency stamp now tracks
  Rust bridge/crate content so a first `cargo:`/`.rs` import links in one run.
- Added dependency: `@cpp.js/core-embind-rust`.

## 1.0.2

### Patch Changes

- fix: workaround for race condition with turbomodule in android.
- Updated dependencies
  - @cpp.js/core-embind-jsi@1.0.3
  - cpp.js@1.0.4
  - @cpp.js/plugin-metro@1.0.2

## 1.0.0

### Major Changes

- 🚀 first stable release

### Patch Changes

- Updated dependencies
  - cpp.js@1.0.0
  - @cpp.js/core-embind-jsi@1.0.0
  - @cpp.js/plugin-metro@1.0.0

## 1.0.0-beta.43

### Patch Changes

- chore: add initial version of CHANGELOGS files
- Updated dependencies
  - cpp.js@1.0.0-beta.33
  - @cpp.js/core-embind-jsi@1.0.0-beta.28
  - @cpp.js/plugin-metro@1.0.0-beta.38

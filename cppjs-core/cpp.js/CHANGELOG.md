# cpp.js

## 2.0.0-beta.26

**Potentially breaking — `VectorUChar`.** The shared runtime (`commonBridges.cpp`) now
registers `std::vector<unsigned char>` as `VectorUChar` for every target (wasm and the
native JSI runtimes). If your own code — or a wrapped library such as gdal3.js —
already registers `VectorUChar` locally, remove that registration before upgrading:
embind aborts initialisation when the same vector name is registered twice.

## 2.0.0-beta

The 2.0.0 line is a ground-up rework — native iOS/Android via JSI, multi-bundler
plugins (Vite, Rollup, Webpack, Metro), an MCP server, and per-library
`@cpp.js/package-*` families — published on the `beta` dist-tag. Per-release
notes for the beta line are tracked in the git history and on npm until 2.0
stabilises; the entries below cover the 1.x line.

## 1.0.4

### Patch Changes

- fix: workaround for race condition with turbomodule in android.

## 1.0.1

### Patch Changes

- fix: include prebuilt/_/_config.general.name_/_.h in dependency header search paths

## 1.0.0

### Major Changes

- 🚀 first stable release

## 1.0.0-beta.33

### Patch Changes

- chore: add initial version of CHANGELOGS files

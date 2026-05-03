# Override mechanisms catalog

> cpp.js picks sane defaults for every build flag, env var, path, and toolchain. When a default doesn't fit your case, there are **20 documented override points**. This doc lists them in order of preference: **start with the least invasive that solves your problem**.

## Why "least invasive first"

Every override point exists for a reason — but each adds a layer of "this build differs from the default in a non-obvious way". Reaching for `extensions[]` to override what `targetSpecs[].specs.emccFlags` could do makes the project harder to maintain and harder for AI agents (or future-you) to reason about.

Order of preference, from least to most invasive:

1. Don't override — restate the constraint as a target filter.
2. `targetSpecs[].specs.*` for declarative per-target tweaks.
3. `cppjs.config.js` `env: {}` for runtime env vars.
4. `cppjs.build.js` hooks (package authors only) for source-acquisition / build-step logic.
5. `extensions[]` for cross-cutting plugin behavior.
6. `~/.cppjs.json` for system-wide environment defaults.

## The 20 override points

### Layer 1 — Target filter (narrow the build matrix)

#### 1. `cppjs.config.js` `target.{platform,arch,runtime,buildType,runtimeEnv}`

Restrict which of the 20 built-in targets actually build. Doesn't *change* defaults — just skips targets you don't need.

```js
target: { platform: 'wasm', runtime: 'st' }   // skip android, ios, all mt builds
```

When to reach for this **first**: shipping faster (don't build iOS for an internal Node tool), or constraining a per-package build (a wasm-only package has no reason to define ios/android variants).

### Layer 2 — Per-target declarative overrides

#### 2. `targetSpecs[].specs.cmake`

Append `-D` flags to cmake configure for matching targets.

```js
targetSpecs: [{
    platform: 'ios',
    specs: { cmake: ['-DBUILD_WITHOUT_64BIT_ATOMICS=ON'] },
}]
```

#### 3. `targetSpecs[].specs.emccFlags`

Append `-s` / `-O` flags to emcc command. Wasm only.

```js
targetSpecs: [{
    platform: 'wasm',
    specs: { emccFlags: ['-sINITIAL_MEMORY=64MB', '-sJSPI'] },
}]
```

#### 4. `targetSpecs[].specs.env`

Inject env vars into the running Wasm process (and into compiler env at build).

```js
targetSpecs: [{
    runtime: 'st',
    specs: { env: { GDAL_NUM_THREADS: '0' } },
}]
```

#### 5. `targetSpecs[].specs.data`

Bundle data files into the `.data` preload.

```js
targetSpecs: [{
    platform: 'wasm',
    specs: { data: { 'share/myapp': 'myapp/data' } },  // copy share/myapp/* → /<datapath>/myapp/data/
}]
```

#### 6. `targetSpecs[].specs.ignoreLibName`

Suppress specific `.a` names from the link line. Use when an upstream lib clashes with another transitive dep.

```js
targetSpecs: [{
    platform: 'wasm',
    specs: { ignoreLibName: ['libtiff_legacy'] },
}]
```

### Layer 3 — `cppjs.config.js` global

#### 7. `env: { KEY: 'value' | ((state, target) => string) }`

Env vars passed to Wasm at runtime. Function values resolved lazily — see [ADR-0003](../adr/0003-function-typed-env-values.md).

```js
env: {
    APP_MODE: 'production',
    DATA_DIR: (state, target) => `${state.config.paths.build}/data`,
    CERT_PATH: '_CPPJS_DATA_PATH_/certs/cacert.pem',  // _CPPJS_DATA_PATH_ replaced at runtime
}
```

#### 8. `functions.isEnabled: (target) => boolean`

Override the default "is this target buildable?" check (default: returns true if the target's output binary already exists). Useful for skipping heavy targets in CI subsets.

```js
functions: {
    isEnabled: (target) => target.runtime === 'st' || process.env.CI_FULL === '1',
}
```

#### 9. `dependencies: [...]`

Each entry is another resolved cpp.js config. Affects build order (pnpm topological per ADR-0002), and the dep's `target.runtime: 'mt'` auto-promotes you to `mt`.

#### 10. `paths.cmake`

Point at a custom `CMakeLists.txt` instead of the project default. Rare — cpp.js's bundled CMakeLists works for almost every project.

### Layer 4 — `cppjs.build.js` hooks (package authors only)

> These are for `cppjs-package-*` authors wrapping an upstream library. Consumer apps don't write `cppjs.build.js`.

#### 11. `getURL: (version) => string` or `getSource: async (state) => void`

Custom source acquisition. URL is simplest; `getSource` for `git clone`, monorepo dep copy, generated source.

#### 12. `getBuildParams: (state, target) => string[]`

Returns flags appended to `cmake configure` (or `./configure` if `buildType: 'configure'`). Receives full `state` and current `target`.

#### 13. `getExtraLibs: (target) => string[]`

Returns extra libs to add to the link line beyond what `dependencies` already wires up.

#### 14. `env: ((target) => string[]) | string[]`

Build-time env vars (CFLAGS, CXXFLAGS, LDFLAGS as string literals). Different from `cppjs.config.js` `env` which is runtime.

```js
env: (target) => [
    'CFLAGS="-fPIC -DSQLITE_ENABLE_FTS5"',
    'LDFLAGS="-Wl,--no-undefined"',
]
```

#### 15. `replaceList: [{regex, replacement, paths}]` or `sourceReplaceList: (target, depPaths) => Array<...>`

Patch upstream source via regex. Use when the upstream lib has CPU intrinsics, raw pointers, or platform-specific assembly that doesn't compile for your target.

```js
replaceList: [{
    regex: /CPL_CPUID\(1, cpuinfo\);/g,
    replacement: '#ifdef __wasm__\ncpuinfo[0]=0;\n#else\nCPL_CPUID(1, cpuinfo);\n#endif',
    paths: ['port/cpl_cpu_features.cpp'],
}]
```

Real example: gdal-wasm uses this to gate CPU intrinsics; curl-wasm uses it to swap socket calls for `emscripten_fetch`.

#### 16. `prepare: async (state) => void`

Pre-configure step. Generate headers, write extra source files, fetch sub-deps.

#### 17. `build: async (state) => void`

Replace the entire build step. Use only when neither cmake nor configure can run the upstream's build system.

#### 18. `beforeRun: (cmakeDir) => Array<{program, parameters}>`

Run shell commands before cmake configure (e.g. `autoreconf -fi` for autotools projects).

#### 19. `copyToSource` / `copyToDist: { 'src': ['dest', ...] }`

`copyToSource` injects files into the build dir before configure (gdal's empty.cpp linker hint). `copyToDist` ships extra files alongside artifacts (openssl's cacert.pem).

```js
copyToDist: { 'assets/cacert.pem': ['ssl/certs/cacert.pem'] }
```

### Layer 5 — Cross-cutting plugin

#### 20. `extensions: [Extension]`

Plugin objects with hooks at config-load and build-step boundaries:

```js
extensions: [{
    loadConfig: { after: (config) => { /* mutate */ } },
    buildWasm: { beforeBuild: (emccFlags) => { emccFlags.push('-sFOO=1') } },
    createLib: { setFlagWithBuildConfig: (env, cFlags, ldFlags) => { /* mutate */ } },
}]
```

Use when you need to share an override across **multiple cpp.js packages**. Inside a single package, prefer `targetSpecs` or `cppjs.build.js` hooks. The OpenSSL Android cert-injection extension is a real example.

### Layer 6 — System (machine-wide)

#### `~/.cppjs.json` — three keys, host-wide

| Key | Default | Notes |
|-----|---------|-------|
| `XCODE_DEVELOPMENT_TEAM` | `''` | Required for iOS device (not simulator) builds |
| `RUNNER` | `'DOCKER_RUN'` | `'DOCKER_EXEC'` keeps a long-lived container; `'LOCAL'` skips Docker entirely (only works if you have all toolchains installed) |
| `LOG_LEVEL` | `'INFO'` | `'DEBUG'` for verbose tracing during build issues |

These apply to every cpp.js project on the machine. Use sparingly — they don't travel with the project.

## Decision flowchart

```
Want to change something for ALL builds?
└── Probably you don't — reach for targetSpecs with a precise filter instead.

Want to change something for ONE platform / runtime / buildType?
└── targetSpecs[] with the right filter. (Layer 2)

Need an env var passed to the running Wasm?
└── env: {} in cppjs.config.js. Use function form if it depends on state. (Layer 3)

Are you wrapping an upstream library that needs source patching?
└── cppjs.build.js replaceList (Layer 4 #15) or prepare hook (#16).

Need to share an override across packages?
└── extensions[] (Layer 5 #20).

Need to set XCODE team or pick a non-Docker runner?
└── ~/.cppjs.json (Layer 6).
```

## Anti-patterns

1. **Reaching for `build: async (state)` when `getBuildParams` would do.** Replacing the build runner means you re-implement what cpp.js already does. Override flags first.
2. **Copying patterns from `extensions[]` into a single package's config.** If only one package needs the override, `targetSpecs` or `cppjs.build.js` keeps it local.
3. **Using `~/.cppjs.json` for project-specific things.** It's machine-wide; CI won't have your overrides. Project-specific config goes in `cppjs.config.js`.
4. **Stacking emccFlags / cmake flags in `targetSpecs` AND in `getBuildParams`.** Confusing. Pick one location.
5. **Editing the upstream source directly in `getSource` instead of `replaceList`.** `replaceList` patches are reproducible across version bumps; manual edits aren't.

## See also

- [`build-state.md`](./build-state.md) — `state` and `target` shapes that hooks receive.
- [`cppjs-config.md`](./cppjs-config.md) — full `cppjs.config.js` field reference.
- [`cppjs-build.md`](./cppjs-build.md) — full `cppjs.build.js` hook reference.
- [`troubleshooting.md`](./troubleshooting.md) — common errors that map to one of these overrides.
- [`performance.md`](./performance.md) — which Emscripten/CMake defaults are safe to override.
- ADR-0003 — function-typed env values.

# Build Hooks (`cppjs.build.js`)

:::warning Package authors only
Apps and libraries consuming `@cpp.js/package-*` do **not** write this file. It lives only inside `cppjs-packages/cppjs-package-<name>/cppjs-package-<name>-{wasm,android,ios}/`.
:::

`cppjs.build.js` describes how to fetch and build the upstream C++ library that this package wraps. The CLI auto-merges its exports into `config.build` of the sibling `cppjs.config.js` at build time.

## Full shape

```js
export default {
    // ─────────────────────────────────────────────────────────────
    // Source acquisition (pick ONE)
    // ─────────────────────────────────────────────────────────────
    getURL: (version) => `https://example.com/upstream-${version}.tar.gz`,
        // Simplest path: return a tarball URL. The CLI fetches +
        // extracts into state.config.paths.build automatically.
        // `version` is the nativeVersion field from package.json.

    // OR

    getSource: async (state) => {
        // Custom: clone, copy from another dep, generate, etc.
        // state.config.paths.build is your staging dir.
    },

    // ─────────────────────────────────────────────────────────────
    // Build system selector
    // ─────────────────────────────────────────────────────────────
    buildType: 'cmake',
        // 'cmake'     — default; cmake configure + build.
        // 'configure' — runs `./configure && make` for autotools.

    // ─────────────────────────────────────────────────────────────
    // Configure-step parameters
    // ─────────────────────────────────────────────────────────────
    getBuildParams: (state, target) => [
        '-DBUILD_SHARED_LIBS=OFF',
        '-DBUILD_TESTING=OFF',
    ],
        // Extra cmake -D flags (or autotools args). Receives:
        //   state  — full resolved config + state object
        //   target — current build target ({ platform, arch, runtime, … })

    // ─────────────────────────────────────────────────────────────
    // Build-time env vars
    // ─────────────────────────────────────────────────────────────
    env: (target) => [
        'CFLAGS="-fPIC -DSQLITE_ENABLE_FTS5"',
        'LDFLAGS="-Wl,--no-undefined"',
    ],
        // Function form receives target; can also be a plain string array.
        // DIFFERENT from cppjs.config.js `env: {}` which is RUNTIME env.

    // ─────────────────────────────────────────────────────────────
    // Extra link libraries
    // ─────────────────────────────────────────────────────────────
    getExtraLibs: (target) => ['-lpthread', '-lm'],

    // ─────────────────────────────────────────────────────────────
    // Upstream source patching (regex)
    // ─────────────────────────────────────────────────────────────
    replaceList: [
        {
            regex: /CPL_CPUID\(1, cpuinfo\);/g,
            replacement: '#ifdef __wasm__\ncpuinfo[0]=0;\n#else\nCPL_CPUID(1, cpuinfo);\n#endif',
            paths: ['port/cpl_cpu_features.cpp'],
        },
    ],
        // Patch the extracted upstream source before configure. Each entry:
        //   regex       — matched against file contents
        //   replacement — substitution
        //   paths       — file globs (relative to state.config.paths.build)

    // ─────────────────────────────────────────────────────────────
    // Asset copying
    // ─────────────────────────────────────────────────────────────
    copyToSource: {
        'assets/empty.cpp': ['src/empty.cpp'],
    },
        // Inject files into the build dir BEFORE configure.

    copyToDist: {
        'assets/cacert.pem': ['ssl/certs/cacert.pem'],
    },
        // Ship extra files alongside the built artifacts.

    // ─────────────────────────────────────────────────────────────
    // Lifecycle overrides (advanced)
    // ─────────────────────────────────────────────────────────────
    beforeRun: (cmakeDir) => [
        { program: 'autoreconf', parameters: ['-fi'] },
    ],
        // Run shell commands before cmake configure.
        // Returns array of {program, parameters}.

    prepare: async (state) => {
        // Pre-configure step (after extract, before configure).
        // Patch source, generate headers, fetch sub-deps.
    },

    build: async (state) => {
        // Override the entire build step.
        // Only override when neither cmake nor configure can run
        // the upstream's build system. Heavy lift; rare.
    },
};
```

## How the CLI uses these hooks

For each architecture sub-package (`-wasm`, `-android`, `-ios`), the CLI:

1. Reads the package's `nativeVersion` from `package.json`.
2. Calls `getURL(version)` (or `getSource(state)`) to populate `state.config.paths.build`.
3. Runs `prepare(state)` if defined.
4. Calls `build(state)` if defined; otherwise:
   - `buildType: 'cmake'` → `cmake -S <build> -B <build/build> [getBuildParams flags] && cmake --build`
   - `buildType: 'configure'` → `./configure [getBuildParams flags] && make && make install`
5. Collects artifacts (`.a`, `include/`, …) into `state.config.paths.output`.

## Example: zlib (canonical small example)

```js
// cppjs-packages/cppjs-package-zlib/cppjs-package-zlib-wasm/cppjs.build.js
export default {
    getURL: (version) => `https://zlib.net/zlib-${version}.tar.gz`,
    buildType: 'cmake',
    getBuildParams: () => ['-DZLIB_BUILD_SHARED=OFF', '-DZLIB_BUILD_TESTING=OFF'],
};
```

## Example: autotools (OpenSSL)

```js
export default {
    getURL: (version) => `https://www.openssl.org/source/openssl-${version}.tar.gz`,
    buildType: 'configure',
    getBuildParams: (state, target) => {
        const flags = ['no-shared', 'no-tests', 'no-docs'];
        if (target.platform === 'wasm') flags.push('linux-generic32');
        if (target.platform === 'ios') flags.push('iphoneos-cross');
        return flags;
    },
};
```

## Example: per-target source patching (proj)

```js
export default {
    getURL: (version) => `https://github.com/upstream/proj/archive/refs/tags/${version}.tar.gz`,
    buildType: 'cmake',
    prepare: async (state) => {
        if (state.target.platform === 'ios') {
            const fs = await import('node:fs/promises');
            const file = `${state.config.paths.build}/src/proj_internal.h`;
            let content = await fs.readFile(file, 'utf8');
            content = content.replace('#define HAVE_LOCALECONV 1', '');
            await fs.writeFile(file, content);
        }
    },
    getBuildParams: () => ['-DBUILD_TESTING=OFF', '-DENABLE_CURL=OFF'],
};
```

## When to choose which hook

| You need to | Use |
|-------------|-----|
| Download an upstream tarball | `getURL` |
| Use a git checkout, monorepo dep, or generated source | `getSource` |
| Inject CMake / configure flags | `getBuildParams` |
| Patch source files between fetch and build | `replaceList` (simple) or `prepare` (complex) |
| Replace the build runner entirely | `build` |
| Run autoreconf / autotools setup | `beforeRun` |
| Ship extra files alongside artifacts | `copyToDist` |
| Inject files into the build tree | `copyToSource` |

Start with the simplest hook that works. Most packages need only `getURL` + `buildType` + `getBuildParams`.

## Canonical examples

| Package | Pattern |
|---------|---------|
| [`cppjs-package-zlib`](https://github.com/bugra9/cpp.js/tree/main/cppjs-packages/cppjs-package-zlib) | Smallest CMake example |
| [`cppjs-package-openssl`](https://github.com/bugra9/cpp.js/tree/main/cppjs-packages/cppjs-package-openssl) | autotools (`buildType: 'configure'`) |
| [`cppjs-package-curl`](https://github.com/bugra9/cpp.js/tree/main/cppjs-packages/cppjs-package-curl) | `_CURL_PREFILL` cache pattern (iOS) + Emscripten Fetch swap (Wasm) |
| [`cppjs-package-gdal`](https://github.com/bugra9/cpp.js/tree/main/cppjs-packages/cppjs-package-gdal) | Largest aggregator; CPU intrinsic gating + iconv collision handling |

## See also

- [Override mechanisms](/docs/api/configuration/overrides) — the `cppjs.build.js` hooks are Layer 4 of the override hierarchy.
- [Configuration overview](/docs/api/configuration/overview) — sibling `cppjs.config.js` reference.
- [Writing a package](/docs/contribute/package/writing-a-package) — full walkthrough of authoring a new `cppjs-package-*`.

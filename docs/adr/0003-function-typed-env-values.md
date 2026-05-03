# ADR-0003: Allow env values in `cppjs.config.js` to be functions of `(state, target)`

- **Status:** Accepted
- **Date:** 2026-05-03
- **Affects:** `cppjs-core/cpp.js/src/state/index.js`, every `cppjs.config.js` in `cppjs-packages/*/*/` and `cppjs-samples/*/`, plugin authors.

## Context

A package's `cppjs.config.js` declares `env` values that flow into the build (CMake variables, Emscripten flags, NDK toolchain hints, etc.). These were previously **scalar only** — strings, numbers, booleans:

```js
env: {
    CFLAGS: '-O3 -fPIC',
    WITH_OPENSSL: 'YES',
}
```

This works for static values but breaks when an env value depends on:

- The current build target (wasm vs ios vs android — different toolchains, different CFLAGS).
- Other env values resolved earlier in the cascade (e.g. `OPENSSL_ROOT_DIR` is a function of where the OpenSSL prebuilt was extracted, which depends on the current `state.config.paths.build`).
- Per-arch path arithmetic that the user shouldn't have to compute by hand.

We had three options:

1. Add a parallel `dynamicEnv` field that takes functions, leaving `env` scalar.
2. Add per-target overrides (`envByTarget: { wasm: {...}, ios: {...} }`).
3. Accept either scalars **or** functions in the same `env` field, resolved at use site.

## Decision

`env` values can be either a scalar or a function with the signature `(state, target) => string | number | boolean | null`. The state loader resolves functions lazily — on read, not on config load — so that `state` is fully populated by the time the function runs.

```js
env: {
    OPENSSL_ROOT_DIR: (state, target) => path.join(state.config.paths.build, 'openssl', target),
    CFLAGS: (state, target) => target === 'wasm' ? '-O3 -msimd128' : '-O3',
}
```

## Consequences

**Positive:**

- One field, two shapes — package authors don't need to learn a second mechanism for the dynamic case.
- Computation happens once, at the point of use, with the full state in scope. No phase-ordering bugs.
- Backwards compatible — existing scalar-only configs work unchanged.

**Negative:**

- Functions can do anything (including I/O, throwing, side effects). We document "pure, fast, deterministic" as the contract but can't enforce it.
- Stack traces from inside an env function don't always point clearly at the originating config. Debugging is one extra step.
- Serializing the resolved env (for caching or logging) requires invoking each function — can't just `JSON.stringify(env)`.

## Alternatives considered

- **Parallel `dynamicEnv` field** — clean separation, but two fields to remember and document. Authors would inevitably put dynamic values in the wrong one. Rejected.
- **Per-target overrides** (`envByTarget`) — solves the target-axis case but not the cross-env-value case (where one env value derives from another). Rejected as too narrow.
- **Templated strings** (e.g. `"${state.paths.build}/openssl"`) — readable but limited; no conditionals, no path arithmetic, no array reduction. Functions are strictly more powerful with the same authoring surface. Rejected.

## See also

- `cppjs-core/cpp.js/src/state/index.js` — the resolver that calls functions lazily.
- Any `cppjs-packages/cppjs-package-gdal/cppjs-package-gdal-wasm/cppjs.config.js` — concrete example using both scalar and function env values.

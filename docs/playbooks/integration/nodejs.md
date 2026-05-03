# Integration — Node.js (no bundler)

> Persona 2 sub-playbook. The user's project is a plain Node.js application or library — no Vite, Webpack, Rollup, RN, etc. Detection: cppjs build script targets `-e node`, or the project's `package.json` declares `main`/`module`/`bin` without bundler deps.

## Goal

Build cpp.js artifacts for the Node runtime (`-e node`) and `require`/`import` the loader from any Node script. No bundler integration; the build is invoked directly via `cppjs build`.

## When to use

- Backend service, CLI, script, or Node-native library.
- No browser, no React Native, no edge runtime.
- Multithread (`runtime: 'mt'`) is supported via Node's `worker_threads` (Node 22+ recommended).

## Files involved

| File | Role |
|------|------|
| `package.json` | + `cpp.js`, optional `@cpp.js/package-<name>`; declare a `build` script that runs `cppjs build -e node` |
| `cppjs.config.{js,mjs}` *(new at root)* | Project-level cpp.js config (deps to consume, paths) |
| `src/native/` *(if user wraps own C++)* | `.h` + `.cpp` source |
| `<entry>.js` (e.g. `index.js`) | `require`/`import` the built loader |
| `dist/<name>-<target>.node.{js,wasm}` | Build output |

## Commands

```bash
pnpm add cpp.js
pnpm add @cpp.js/package-<name>     # optional

# Single-thread build
pnpm cppjs build -p wasm -a wasm32 -r st -e node -b release

# Multithread build (Node worker_threads)
pnpm cppjs build -p wasm -a wasm32 -r mt -e node -b release

# Run
node index.js
```

## Reference setup

Mirror `cppjs-samples/cppjs-sample-backend-nodejs-wasm/` (single-thread) or `cppjs-samples/cppjs-playground-backend-nodejs-multithread/` (multithread).

`package.json`:

```jsonc
{
  "scripts": {
    "build": "cppjs build -p wasm -a wasm32 -r st -e node -b release",
    "start": "node src/index.js"
  },
  "dependencies": {
    "cpp.js": "^2.0.0",
    "@cpp.js/package-<name>": "^x.y.z"
  }
}
```

`cppjs.config.mjs`:

```js
// If consuming prebuilt packages:
import Matrix from '@cpp.js/sample-lib-prebuilt-matrix/cppjs.config.js';

export default {
    general: { name: 'my-node-service' },
    dependencies: [
        Matrix,
    ],
    paths: {
        config: import.meta.url,
        output: 'dist',
    },
};
```

Entry script `src/index.js` (CommonJS):

```js
const initCppJs = require('../dist/my-node-service-wasm-wasm32-st-release.node.js');

initCppJs().then(({ Native }) => {
    console.log(`Result: ${Native.sample()}`);
});
```

ESM equivalent:

```js
import initCppJs from './dist/my-node-service-wasm-wasm32-st-release.node.js';

const { Native } = await initCppJs();
console.log(`Result: ${Native.sample()}`);
```

The exact output filename is `<general.name>-<target.path>.<runtimeEnv>.{js,wasm}`. For st-release: `<name>-wasm-wasm32-st-release.node.js`. For mt-release: `<name>-wasm-wasm32-mt-release.node.js`.

## Multithread

Node multithread (`runtime: 'mt'`) uses `worker_threads`. **No COOP/COEP needed** — that's a browser concern. Just build with `-r mt`. The loader fans out work across worker threads transparently.

Caveats:

- Node 22+ recommended (older versions have rough edges with `worker_threads` + WASM SharedArrayBuffer).
- Worker threads warm up; expect ~50-200ms cold-start overhead the first time you `init`.
- If you have CPU-bound code, `mt` is a meaningful speedup. For I/O-bound services, stick with `st`.

## Validation

- [ ] `pnpm install` succeeds.
- [ ] `pnpm build` produces `dist/<name>-<target>.node.{js,wasm}`.
- [ ] `node <entry>.js` runs and calls into C++ without error.
- [ ] If multithread: workers spin up, computation finishes (use Node's `--inspect` if you suspect threading issues).
- [ ] No `Module not found: 'fs'` or `'crypto'` warnings — cpp.js's node bundle imports them legitimately, but if a different bundler later mishandles the script, those warnings appear.

## Common pitfalls

- **Targeting `-e browser` in a Node app.** The browser bundle uses `fetch()` for wasm — fails on Node without polyfill. Use `-e node`.
- **Targeting `-e edge` in a Node app.** Trims Node-specific helpers (`require('fs')`, etc.); some features won't work.
- **Hardcoded `dist/cpp.js` path.** The actual filename includes the target tuple (e.g. `<name>-wasm-wasm32-st-release.node.js`). Use the exact path or read from the build output log.
- **Async at module top-level (CJS).** CommonJS doesn't allow it. Use `.then()` or wrap in an `async` function.
- **Forgetting to rebuild after editing `.cpp`.** No bundler watcher here. Re-run `pnpm build` (or wire `chokidar`/`nodemon` to do so).
- **Running on Node < 20.** cpp.js requires Node ≥ 20 (see `engines` in `cppjs-core/cpp.js/package.json`).

## Reference samples

- `cppjs-samples/cppjs-sample-backend-nodejs-wasm/` — minimal Node + cpp.js (single-thread), canonical
- `cppjs-samples/cppjs-playground-backend-nodejs/` — playground with prebuilt packages
- `cppjs-samples/cppjs-playground-backend-nodejs-multithread/` — multithread reference (`-r mt`)

Node runtime adapter: `cppjs-core/cpp.js/src/assets/js-runtime/node.js`.

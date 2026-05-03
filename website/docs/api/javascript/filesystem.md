# File System

cpp.js gives your C++ code a virtual file system. Where the files actually live depends on the runtime (browser / Node / edge) and your `initCppJs` options. This page maps every combination, then walks through the helper API.

## The decision tree

```
Are you on the browser?
├── No (Node.js)
│   └── m.FS reads/writes the host filesystem via the fs-node adapter.
│       No /opfs vs /memfs distinction; paths are real filesystem paths.
│
├── No (Cloudflare Worker / Deno Deploy / Vercel Edge)
│   └── m.FS is in-memory only.
│       No persistence across invocations.
│       No useWorker available (edge runtimes don't have Web Workers).
│       No OPFS available (browser-only API).
│
└── Yes (browser)
    │
    ├── Need persistence across page reloads?
    │   ├── No  → fs: { opfs: false }  → mount under /memfs/<app>/
    │   │
    │   └── Yes → REQUIRES useWorker: true  → mount under /opfs/<app>/
    │             ├── Browser supports OPFS? (Chrome 86+, FF 111+, Safari 15.2+)
    │             │   ├── Yes → real persistence
    │             │   └── No  → cpp.js logs an error + redirects to /memfs/<app>/
    │             │
    │             └── Mounted from main thread (no useWorker)?
    │                 → throws: "OPFS is only available inside a Worker scope"
    │
    └── Need to mount user-provided files?
        → Use m.autoMountFiles(files, parentPath?) with File[] from <input type=file>
```

## The two virtual roots in browser

cpp.js mounts two namespaces under the Wasm filesystem root:

| Mount | Backed by | Persistence | Available when |
|-------|-----------|-------------|----------------|
| `/opfs/<app>/` | Browser's Origin Private File System | Survives page reloads, browser restarts | `useWorker: true` + `fs.opfs !== false` + browser support |
| `/memfs/<app>/` | In-memory (Emscripten MEMFS) | Tab session only | Always |

`<app>` is `general.name` from `cppjs.config.js` (the same name the CLI uses for `lib<name>.a`).

## Per-runtime cheat sheet

| Runtime | `useWorker` | `/opfs/...` | `/memfs/...` | Notes |
|---------|-------------|-------------|--------------|-------|
| Browser (no worker) | n/a | ❌ throws | ✅ | Tab-session memory only |
| Browser + `useWorker: true` | ✅ | ✅ if browser supports OPFS, else fallback to `/memfs/` | ✅ | Persistent option |
| Node.js | n/a | n/a | n/a (uses host fs) | `m.FS` reads real disk via the fs-node adapter |
| Cloudflare Worker / edge | ❌ unavailable | ❌ unavailable | ✅ in-memory equivalent | No persistence; per-invocation memory |
| React Native (CLI / Expo) | n/a (uses JSI bridge) | n/a | n/a | App's sandbox storage via React Native APIs |

## Helper functions on the Module object

| Function | Platform | Input | Output | Description |
| -------- | -------- | ----- | ------ | ----------- |
| `getDefaultPath()` | browser | — | string | Returns `/opfs` or `/memfs` depending on config. |
| `getFinalPath(path)` | browser | string | string | Validates the path; auto-falls back to `/memfs/` if OPFS unavailable. |
| `getRandomPath(startPath?)` | browser | string? | string | Creates `<startPath>/<app>/automounted/<random>` and returns it. |
| `autoMountFiles(files, parentPath?)` | browser | File[] | Promise\<string[]\> | Streams each `File` into the Wasm fs and returns the resolved mount paths. |
| `getFileBytes(path)` | browser, node | string | Uint8Array | Reads the file at the given path. |
| `getFileList(startPath?)` | browser, node | string? | [\{ path, size }] | Lists files recursively. |

## Examples

### Mount a single file from `<input type=file>`

```js
function onFileChange({ target }) {
    const paths = await Module.autoMountFiles([target.files[0]]);
    // paths[0] is e.g. '/opfs/myapp/automounted/123456/photo.jpg'
}
```

### Mount multiple files

```js
function onFileChange({ target }) {
    const paths = await Module.autoMountFiles(Array.from(target.files));
    for (const p of paths) {
        Module.processImage(p);   // call into your C++
    }
}
```

### Mount a file fetched from the network

```js
const data = await fetch('test/polygon.geojson');
const file = new File([await data.blob()], 'polygon.geojson');
const paths = await Module.autoMountFiles([file]);
```

### Pick a known location instead of a random one

```js
await Module.autoMountFiles(files, '/opfs/myapp/uploads');
```

### Read processed bytes back out (Wasm → JS)

```js
Module.processImage('/opfs/myapp/uploads/photo.jpg');
// C++ writes /opfs/myapp/uploads/photo.processed.jpg

const bytes = Module.getFileBytes('/opfs/myapp/uploads/photo.processed.jpg');
const blob = new Blob([bytes], { type: 'image/jpeg' });
imgEl.src = URL.createObjectURL(blob);
```

### Download a file generated inside Wasm

```js
const filePath = '/virtual/test.json';
const fileBytes = Module.getFileBytes(filePath);
const fileName = filePath.split('/').pop();

const blob = new Blob([fileBytes]);
const link = document.createElement('a');
link.href = URL.createObjectURL(blob);
link.download = fileName;
link.click();
```

### List files

```js
const files = Module.getFileList();
files.forEach(({ path, size }) => {
    console.log(`${path} — ${size} bytes`);
});
```

## Writing your own files

Use `Module.FS` directly (Emscripten's standard API):

```js
Module.FS.mkdirTree('/memfs/myapp/cache');
Module.FS.writeFile('/memfs/myapp/cache/data.bin', new Uint8Array([1, 2, 3]));
const bytes = Module.FS.readFile('/memfs/myapp/cache/data.bin');
```

Writing to `/opfs/...` without `useWorker: true` throws. If OPFS isn't supported by the browser, the path is auto-redirected to `/memfs/...` (with a `console.error`).

## Common pitfalls

1. **Mounting `/opfs` from main thread without `useWorker: true`** → throws synchronously inside `Module.getFinalPath()`. The error message tells you to enable `useWorker` or mount under `/memfs/` instead.
2. **Forgetting the `<app>` prefix** → cpp.js auto-creates `/memfs/<app>/automounted` at startup. If you write to `/memfs/foo` (no `<app>`) it works but won't be cleaned up on `terminate`.
3. **Assuming OPFS persists across origins** — it doesn't. Files written from `app.example.com` are invisible to `other.example.com`. Standard origin isolation.
4. **Using `Module.FS` before init completes** — `Module.FS` is undefined until `await initCppJs(...)` resolves. Use the `onRuntimeInitialized: (m) => { … }` hook or await the promise first.
5. **Calling `fs: { opfs: false }` and then mounting `/opfs/...`** → throws: "OPFS is disabled. Enable fs.opfs in config to mount under /opfs/."

## See also

- [Threading guide](/docs/api/configuration/threading) — `useWorker` is independent of threading.
- [Troubleshooting](/docs/guide/troubleshooting) — OPFS / memfs runtime errors mapped to fixes.

:::info
**Browser source:** [cpp.js fs-browser adapter](https://github.com/bugra9/cpp.js/blob/main/cppjs-core/cpp.js/src/assets/js-runtime/browser.js) (the OPFS guards and helpers).
**Node.js source:** [cpp.js fs-node adapter](https://github.com/bugra9/cpp.js/blob/main/cppjs-core/cpp.js/src/assets/js-runtime/node.js).
:::

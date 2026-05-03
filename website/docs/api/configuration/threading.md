# Threading

cpp.js threading has two independent axes: **`runtime: 'st' | 'mt'`** (single vs multi-threaded Wasm) and **`useWorker: true | false`** (whether the Wasm module runs in a Web Worker). These are often confused — they solve different problems.

## The two axes

|                       | `runtime: 'st'`                                     | `runtime: 'mt'`                                                                          |
| --------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **`useWorker: false`** | Default. Main-thread Wasm. Smallest setup.          | Wasm runs main-thread; pthreads via `SharedArrayBuffer`. Needs COOP/COEP.                 |
| **`useWorker: true`**  | Wasm in 1 Web Worker. Comlink bridge. Required for OPFS persistence. | Wasm in 1 Web Worker; pthreads spawn additional workers from there. Needs COOP/COEP. |

## Pick the right combination

| What you want | Pick |
|----------|------|
| Quickest path to "C++ in browser" | `runtime: 'st'`, no `useWorker` |
| Persistent storage in browser (OPFS) | `runtime: 'st'`, `useWorker: true` |
| CPU-bound parallelism (image / geo / crypto) | `runtime: 'mt'` |
| Both: persistent storage AND parallelism | `runtime: 'mt'`, `useWorker: true` |
| Cloudflare Worker / Deno Deploy / Vercel Edge | `runtime: 'st'` only — `mt` and `useWorker` not supported |
| React Native | `runtime: 'mt'` if perf-sensitive (pthreads via JSI; no COOP/COEP needed) |

## Setting `runtime: 'mt'`

In `cppjs.config.js`:

```js
export default {
    general: { name: 'myapp' },
    paths: { config: import.meta.url },
    target: { runtime: 'mt' },
};
```

Two things happen at build time:

1. The Wasm is compiled with `-pthread` (Emscripten flag).
2. If any transitive dependency is `mt`, the project auto-promotes to `mt`. You can't downgrade an `mt` dep back to `st`.

## The COOP/COEP requirement

Multi-threaded Wasm uses `SharedArrayBuffer`, which browsers gate behind **cross-origin isolation**. Your hosting layer must send these response headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Without them, `SharedArrayBuffer` is `undefined` and Wasm init silently fails. To verify in the browser console:

```js
console.log(crossOriginIsolated)        // must be true for `mt`
console.log(typeof SharedArrayBuffer)   // must be 'function'
```

### Per-host configuration

| Host | Config |
|------|--------|
| Vite dev / preview | Auto-injected by `@cpp.js/plugin-vite` |
| Webpack / Rspack dev server | Auto-injected by `@cpp.js/plugin-webpack` |
| Vercel | `vercel.json` headers entry (see snippet below) |
| Netlify | `_headers` file (see snippet below) |
| Cloudflare Pages | `_headers` file (same syntax as Netlify) |
| nginx | `add_header` directives (see snippet below) |
| Express / Next.js custom server | Set headers via middleware on every response |

**Vercel** (`vercel.json`):

```json
{
    "headers": [{
        "source": "/(.*)",
        "headers": [
            { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" },
            { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" }
        ]
    }]
}
```

**Netlify / Cloudflare Pages** (`_headers`):

```
/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
```

**nginx**:

```
add_header Cross-Origin-Opener-Policy same-origin;
add_header Cross-Origin-Embedder-Policy require-corp;
```

### COEP gotcha — third-party assets

`require-corp` blocks cross-origin resources unless they explicitly opt in (`Cross-Origin-Resource-Policy: cross-origin` on the response, or a `crossorigin` attribute on `<img>` / `<script>` tags). If your page loads third-party images / fonts / scripts, you have two options:

- Switch to `Cross-Origin-Embedder-Policy: credentialless` (more permissive; supported in Chrome 96+, Firefox 110+).
- Proxy third-party assets through your own origin.

## `useWorker: true` (independent of threading)

Wasm runs in a single dedicated Web Worker; the main thread receives a Comlink-bridged proxy.

```js
const m = await initCppJs({ useWorker: true });
// `m` looks identical, but every call is async.
const result = await m.add(2, 3);
```

Reach for `useWorker: true` when:

- You need OPFS persistent storage (mandatory; OPFS is Worker-scope-only).
- Your C++ is slow and you don't want to block the main thread.
- You're using `runtime: 'mt'` and want pthread workers spawned from a non-main scope (cleaner architecture).

You don't need it when:

- The C++ is fast (sub-frame) and main-thread blocking doesn't matter.
- You're already using `mt` for parallelism (pthread workers are separate from `useWorker`).

### What changes when `useWorker: true`

| Aspect | Without worker | With worker |
|--------|----------------|-------------|
| `m.add(2, 3)` returns | `5` | `Promise<5>` |
| `m.FS.writeFile(...)` returns | `undefined` | `Promise<undefined>` |
| Synchronous callbacks from C++ to JS | Work | Don't work — design as a promise round-trip |
| OPFS storage | Throws | Works (if browser supports) |
| Termination | n/a | `initCppJs.terminate()` kills the worker |

Embind objects (vectors, structs) are auto-proxied via cpp.js's custom Comlink transfer handlers. `m.toArray(vec)` and `m.toVector(cls, arr)` work transparently across the boundary.

## Edge runtime limits (Cloudflare Workers, Deno Deploy, Vercel Edge)

These platforms run JavaScript in V8 isolates that **don't expose the Web Worker API**. So:

- `useWorker: true` — fails (no `Worker` constructor).
- `runtime: 'mt'` — fails (pthreads need workers + `SharedArrayBuffer`).
- OPFS — fails (browser-only API anyway).
- `runtime: 'st'` + memory fs — works.

If your use case demands persistence on edge, you need an external service (R2, KV, S3) — call it from JS and feed bytes into Wasm via `m.FS.writeFile(...)`.

## React Native

Pthreads are routed through JSI (no `SharedArrayBuffer`, no COOP/COEP). `runtime: 'mt'` works without any host configuration. `useWorker` is a no-op (no Web Worker API in RN).

## Common pitfalls

1. **`mt` works in dev but not in prod** — the bundler plugin injects COOP/COEP for dev/preview, but production hosting needs explicit configuration. Look at `crossOriginIsolated` in console; if `false`, the headers are missing.
2. **Mixing `mt` and `st` artifacts in one bundle** — they have incompatible memory layouts. The CLI prevents this at build time, but if you manually copy `.wasm` files between projects you'll see "wasm streaming compile failed" errors.
3. **Calling sync callbacks across `useWorker: true`** — Comlink can't invoke main-thread sync code from a worker. If your C++ needs a JS callback, design it as a promise round-trip.
4. **Assuming `runtime: 'mt'` enables `useWorker`** — they're independent. `runtime: 'mt'` without `useWorker` runs pthreads on the main thread; `useWorker: true` without `runtime: 'mt'` runs single-thread Wasm in a worker.
5. **Loading third-party scripts on a COEP page** — `require-corp` blocks them unless they send `Cross-Origin-Resource-Policy: cross-origin`. Switch to `credentialless` or proxy.

## See also

- [Filesystem guide](/docs/api/javascript/filesystem) — why OPFS depends on `useWorker`.
- [Target Specs](/docs/api/configuration/platform) — `targetSpecs[]` per-target filters by `runtime`.
- [Troubleshooting](/docs/guide/troubleshooting) — `crossOriginIsolated is false`, `SharedArrayBuffer is not defined`.

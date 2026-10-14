# ADR-0016: Make WASI HTTP components with `-e http` and one C++ handler

- **Status:** Proposed
- **Date:** 2026-10-14
- **Affects:** `core/crossbind/src/utils/{targets,wasiHttp}.js`, `src/actions/{buildWasiCommand,createLib}.js`, `src/assets/wasi-runtime/http/`, `scripts/release/workspace-release.mjs`, `e2e/cloud-wasi-http`

## Context

WASI 0.3.0 (June 2026) defines the `wasi:http/service` world: a component exports
`wasi:http/handler`, an async function the host calls once per request. Spin 4, wasmCloud 2.5+ and
`wasmtime serve` run such components as their unit of HTTP work. ADR-0005 gave crossbind WASI
commands only, entered through `main()`, which no HTTP host runs.

wit-bindgen's C generator implements the export through the Component Model's callback ABI, and
three facts about the toolchain and the hosts decide how a C++ app can sit behind it:

- wasi-sdk 34 keeps the shadow stack pointer in context slot 0, and wasmtime, Spin and wash reject a
  component that uses slot 1, so per-task state cannot ride the context slots wit-bindgen offers.
- The hosts reuse one instance for many requests at a time (`wasmtime serve`: up to 16), so the
  state of each request must be found, and freed, per request.
- wasmtime cannot cancel a guest task yet (wasmtime#11833). When it can, the cancellation reaches a
  task that has not returned, in an event that names no waitable to find the task by.

## Decision

`crossbind build -p wasi -e http` links the archives of the command into
`<name>-wasi-wasm32-st-<buildType>.http.wasm`, a reactor whose export is crossbind's handler glue.
The app defines one function, `crossbind::http::Response crossbind::http::handle(Request)`,
declared in `<crossbind/http.h>`; the glue speaks the async ABI. The rules:

- `Request` is method, authority, path, query, headers with lowercase names and the whole body;
  `Response` is status, headers and body. Bodies are buffered; there are no outgoing requests yet.
- The `http` package of the WASI 0.3.0 WIT is vendored unchanged, with the bindings wit-bindgen
  0.62 generates from it, its component-type object included. Builds need no wit-bindgen.
- The glue reads the request body with synchronous waits before `task.return`, so no cancellation
  can arrive while it cannot tell whose it is, and writes the response asynchronously after it,
  finding the task by the waitable each event names.
- A body that does not fit in memory, or does not arrive whole, answers an error and never traps
  the instance. Each request runs on a 1 MiB stack.
- `http` is not a binary of a library package: release builds of `-wasi` packages leave it out.

## Consequences

- **Positive** — C++ and the `-wasi` libraries without data files run on Spin, wasmCloud and
  `wasmtime serve` behind one plain C++ function, with no WIT tooling on the build machine. The
  header has no WASI in it, so a handler compiles and tests on any platform.
- **Negative** — wasi-libc adds `wasi:cli` environment, exit and terminal imports beyond the service
  world, so a host that offers only the world's imports rejects the component. While a body is still
  arriving, its instance starts no other request: a slow upload held a request to the same
  `wasmtime serve` instance for about 4 s before the host moved on. Bodies sit in memory whole. A
  dependency's `data` and `env` reach no component. A new WASI release or wit-bindgen means
  regenerating the vendored files (`assets/wasi-runtime/http/README.md`).

## Alternatives considered

- **Generate the bindings at build time** — needs wit-bindgen on every build machine and in the
  image, for files that change only with WASI. Rejected.
- **Link with `--component-type` and the WIT instead of the object file** — wit-bindgen's C output
  still references the object's anchor symbol, which crossbind would have to define by hand. Rejected.
- **Read the body asynchronously too** — frees the instance during slow uploads, but a future
  cancellation could only trap the instance or strand its task. Rejected until hosts cancel tasks
  and the ABI lets a callback tell which task an event is for.
- **One request per instance (backpressure)** — makes the one live task identifiable, but throttles
  the concurrency `wasmtime serve` and Spin rely on. Rejected.
- **Hand apps the raw bindings** — every app would write the async glue itself. Rejected.

## See also

- Related ADRs: ADR-0005
- Related code: `core/crossbind/src/assets/wasi-runtime/http/handler.cpp`, `e2e/cloud-wasi-http/`
- External references: https://github.com/WebAssembly/WASI/releases/tag/v0.3.0,
  https://github.com/bytecodealliance/wasmtime/issues/11833

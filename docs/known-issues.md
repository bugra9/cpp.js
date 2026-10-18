# Known issues

Defects and gaps that are real but not yet fixed, so a later session does not rediscover them.

Every entry carries the command that proves it is still real. Run the check before acting on an
entry, and delete the entry when the check comes back clean — an entry nobody can verify is worse
than no entry. Scope each check so it cannot match this file, which quotes what the checks look for.

Fixing something here is not a prerequisite for anything else; this is a list, not a queue.

## fsync in a Node.js wasm build does not reach the disk

Emscripten's WasmFS Node backend has no `NodeFile::flush`, so an `fsync` or `fdatasync` on a host file used to
trap and abort the module; SQLite's unix VFS calls one on every commit. `core/crossbind/src/assets/cpp-runtime/node.cpp`
answers both for host files without the backend, as NODERAWFS does: the data has reached the operating system, but
nothing forces it to disk.

- Seen: 2026-10-15
- Check: `docker run --rm --entrypoint grep "ghcr.io/crossbind/web@$(node -p "require('./core/crossbind/src/assets/toolchain-digests.json').images.web.index")" -c 'implement NodeFile::flush' /emsdk/upstream/emscripten/system/lib/wasmfs/backends/node_backend.cpp` prints 1.
- Remove when the pinned emsdk implements `NodeFile::flush`; then drop the `--wrap` pair from `buildWasm.js` and `node.cpp`.

## Two JavaScript-only examples work around fixes that are not released yet

`landing/demos/lib-*/direct` builds against the published `beta` (2.0.0-beta.63), which predates two fixes in this
tree: a macro alias takes a JavaScript callback, and a constant whose value has a cast binds. Until a release carries
them, iconv's `04-encodings` calls `libiconvlist` instead of `iconvlist`, and Expat's `01-tree` passes 1 for
`XML_TRUE`. Both notes say why.

- Seen: 2026-10-15
- Check: `grep -c libiconvlist landing/demos/lib-iconv/direct/examples/04-encodings.js` prints 4.
- Remove when the demos build against a release with these fixes and the two examples use `iconvlist` and `XML_TRUE`.

## A Rust panic ends the process when the app has Rust of its own

An app's own Rust (`cargo:` imports and `.rs` sources) builds into one super crate with `panic = "abort"`
(`core/crossbind/src/utils/appRustCrates.js`), while a package's bridge builds with `panic = "unwind"` so its
shims can raise a panic as a JavaScript exception. The super archive links whole on every platform but Windows, so
its abort runtime is the one in the binary: a panic in the app's crates or in a package's ends the process instead
of throwing. With the macOS Node addon of `e2e/backend-nodejs-native`, `confRsSetLen({})`, a JSON read that panics
on anything but a set, exits with 134. Windows and wasm are not checked.

- Seen: 2026-10-18
- Check: `grep -c 'panic = "abort"' core/crossbind/src/utils/appRustCrates.js` prints 1.
- Remove when a panic in an app with Rust of its own reaches JavaScript as an exception, as `confRsSetLen({})` then does.

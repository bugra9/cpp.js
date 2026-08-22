# @crossbind/port-zstd-wasm

The **WebAssembly** build of the precompiled **zstd** library, built with [crossbind](https://crossbind.dev).

> For installation and usage, see the main package: **[@crossbind/port-zstd](https://www.npmjs.com/package/@crossbind/port-zstd)**.

## Supported targets
- WebAssembly (`wasm32`) — single-threaded
- WebAssembly (`wasm32`) — multi-threaded (needs `SharedArrayBuffer`; serve with COOP + COEP headers)

## License
This project includes the precompiled zstd library, distributed under the [zstd License](https://github.com/facebook/zstd/blob/dev/LICENSE).

# @crossbind/port-curl-wasm

The **WebAssembly** build of the precompiled **libcurl** library, built with [crossbind](https://crossbind.dev).

> For installation and usage, see the main package: **[@crossbind/port-curl](https://www.npmjs.com/package/@crossbind/port-curl)**.

## Supported targets
- WebAssembly (`wasm32`) — single-threaded
- WebAssembly (`wasm32`) — multi-threaded (needs `SharedArrayBuffer`; serve with COOP + COEP headers)

## License
This project includes the precompiled libcurl library, distributed under the [curl License](https://github.com/curl/curl/blob/master/COPYING).

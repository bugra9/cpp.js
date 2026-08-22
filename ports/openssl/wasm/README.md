# @crossbind/port-openssl-wasm

The **WebAssembly** build of the precompiled **OpenSSL** library, built with [crossbind](https://crossbind.dev).

> For installation and usage, see the main package: **[@crossbind/port-openssl](https://www.npmjs.com/package/@crossbind/port-openssl)**.

## Supported targets
- WebAssembly (`wasm32`) — single-threaded
- WebAssembly (`wasm32`) — multi-threaded (needs `SharedArrayBuffer`; serve with COOP + COEP headers)

## License
This project includes the precompiled OpenSSL library, distributed under the [Apache License 2.0](https://github.com/openssl/openssl/blob/master/LICENSE.txt).

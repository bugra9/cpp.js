# @cpp.js/package-gdal-wasi

The **WASI** build of the precompiled **GDAL** library, built with [cpp.js](https://cpp.js.org).

> For installation and usage, see the main package: **[@cpp.js/package-gdal](https://www.npmjs.com/package/@cpp.js/package-gdal)**.

## Supported targets
- WASI (`wasm32-wasip3`) — single-threaded command modules; run with `wasmtime` (47+)

This build links `@cpp.js/package-curl-wasi` (TLS via `-openssl-wasi`), so the network VSI layer — `/vsicurl`, `/vsis3`-style handlers, WMS/WCS — is compiled in. Networking needs the `wasi:sockets` grants (`wasmtime -S inherit-network=y -S allow-ip-name-lookup=y -S tcp=y`), a CA bundle for verified https (`CURL_CA_BUNDLE=` pointing at the `certs/cacert.pem` the dependency data ships), and — until wasmtime implements mid-connect socket introspection — the two-function `getsockname`/`getpeername` shim documented in the curl-wasi package.

## License
This project includes the precompiled GDAL library, distributed under the [MIT License](https://github.com/OSGeo/gdal/blob/master/LICENSE.TXT).

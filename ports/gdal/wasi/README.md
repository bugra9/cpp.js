# @crossbind/port-gdal-wasi

The **WASI** build of the precompiled **GDAL** library, built with [crossbind](https://crossbind.dev).

> For installation and usage, see the main package: **[@crossbind/port-gdal](https://www.npmjs.com/package/@crossbind/port-gdal)**.

## Supported targets
- WASI (`wasm32-wasip3`) — single-threaded command modules; run with `wasmtime` (47+)

This build links `@crossbind/port-curl-wasi` (TLS via `-openssl-wasi`), so the network VSI layer — `/vsicurl`, `/vsis3`-style handlers, WMS/WCS — is compiled in. Networking needs the `wasi:sockets` grants (`wasmtime -S inherit-network=y -S allow-ip-name-lookup=y -S tcp=y`), a CA bundle for verified https (`CURL_CA_BUNDLE=` pointing at the `certs/cacert.pem` the dependency data ships), and — until wasmtime implements mid-connect socket introspection — the two-function `getsockname`/`getpeername` shim documented in the curl-wasi package.

## License
This project includes the precompiled GDAL library, distributed under the [MIT License](https://github.com/OSGeo/gdal/blob/master/LICENSE.TXT).

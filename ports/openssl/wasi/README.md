# @crossbind/port-openssl-wasi

The **WASI** build of the precompiled **OpenSSL** library, built with [crossbind](https://crossbind.dev).

> For installation and usage, see the main package: **[@crossbind/port-openssl](https://www.npmjs.com/package/@crossbind/port-openssl)**.

## Supported targets
- WASI (`wasm32-wasip3`) — single-threaded command modules; run with `wasmtime` (47+)

Networking (`wasi:sockets`) additionally needs `wasmtime -S inherit-network=y -S allow-ip-name-lookup=y -S tcp=y`. The build is static-only, thread-less and engine-less (`no-dso no-threads no-asm no-quic`); UNIX domain sockets are compiled out (`OPENSSL_NO_UNIX_SOCK`). A CA bundle ships under `ssl/certs/cacert.pem` in the prebuilt — preopen it and point `SSL_CERT_FILE` (or your app's CA option) at it for verified TLS.

## License
This project includes the precompiled OpenSSL library, distributed under the [Apache License 2.0](https://github.com/openssl/openssl/blob/master/LICENSE.txt).

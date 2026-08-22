# @crossbind/port-curl-wasi

The **WASI** build of the precompiled **libcurl (CURL)** library, built with [crossbind](https://crossbind.dev).

> For installation and usage, see the main package: **[@crossbind/port-curl](https://www.npmjs.com/package/@crossbind/port-curl)**.

## Supported targets
- WASI (`wasm32-wasip3`) — single-threaded command modules; run with `wasmtime` (47+)

Networking uses `wasi:sockets`, so the runtime must grant it: `wasmtime -S inherit-network=y -S allow-ip-name-lookup=y -S tcp=y`. The build is HTTP(S)-only (`HTTP_ONLY`, TLS via `@crossbind/port-openssl-wasi`), with the threaded resolver, `socketpair()`, UNIX sockets and IPv6 compiled out — none of them exist on WASI. No CA path is baked in: pass `CURLOPT_CAINFO` (the openssl-wasi prebuilt ships `ssl/certs/cacert.pem`) or run with `-k` for unverified test traffic.

Note: wasmtime's wasip3 sockets (checked on 46 and 47) still trap while libcurl inspects a socket it is connecting — wasi-libc aborts inside `getsockname`/`getpeername` in that state, even though a plain call on an established socket works. Until the runtime catches up, statically link a two-function shim that shadows them (see `e2e/main.c` here for the exact shape); without it every transfer dies in `curl_multi_perform`.

## License
This project includes the precompiled curl library, distributed under the [curl License](https://curl.se/docs/copyright.html).

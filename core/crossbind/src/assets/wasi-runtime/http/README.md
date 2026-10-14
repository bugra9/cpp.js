# HTTP component runtime

What an http build (`crossbind build -p wasi -e http`) links besides the app: `handler.cpp`, the
`wasi:http/handler` export that calls the app's `crossbind::http::handle` (`include/crossbind/http.h`),
and `bindings/`, which `wit-bindgen c` generated from `wit/`.

`wit/deps/` holds the `http` package of the WASI 0.3.0 release, unchanged: `wasi-wit-0.3.0.tar.gz` from
https://github.com/WebAssembly/WASI/releases/tag/v0.3.0 (sha256
`596182ecd79311c8d010389b78b0253d54bee596254002df504ea5cf0124b894`), licensed as `wit/deps/LICENSE.md` says.

After changing `wit/`, regenerate the bindings with wit-bindgen 0.62.0; with `--check` it confirms instead
that the committed ones, the `.o` included, are what it generates:

```bash
wit-bindgen c wit --world crossbind-http --out-dir bindings
wit-bindgen c wit --world crossbind-http --out-dir bindings --check
```

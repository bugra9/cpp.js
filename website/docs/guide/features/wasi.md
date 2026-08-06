# WASI Builds & CLI Tools

Besides browser/Node wasm, Cpp.js can compile a project into a single **WASI
command component** (`wasm32-wasip3`) that runs under any WASI 0.3 runtime
with Wasm 3.0 exception support, such as wasmtime 47+ — no JavaScript host
involved.

## Build a WASI command

Your `src/native` provides `main(int, char**)`; the output is one `.wasm`
file:

```sh
cppjs build -p wasi -b release
wasmtime run --dir=. dist/<name>-wasi-wasm32-st-release.wasm arg1
```

Zero configuration: with no local wasi-sdk configured, the build runs inside
the Cpp.js docker image, which ships the sdk. For native-speed builds, point
Cpp.js at a local wasi-sdk (>= 34, with the wasm32-wasip3 sysroot):

```jsonc title="~/.cppjs.json"
{ "WASI_SDK_PATH": "/opt/wasi-sdk" }
```

Data files declared by your dependency graph land in a real `dist/data/`
folder to preopen with `--dir`; sockets work through `wasi:sockets` when the
runtime grants them (`-S inherit-network=y -S allow-ip-name-lookup=y -S tcp=y`).

## Prebuilt `-wasi` library packages

Library packages ship a dedicated wasi platform variant —
`@cpp.js/package-<name>-wasi` — next to their `-wasm`/`-android`/`-ios`
siblings. Depend on the `-wasi` variant when targeting wasi; everything else
(recipes, patches, data) travels inside the package.

## CLI tools from npm (`-bin-wasi` packages)

Where the upstream project ships command-line tools, a
`@cpp.js/package-<name>-bin-wasi` package publishes them prebuilt. Install
and run — no compiler involved, only wasmtime on your PATH:

```sh
npm i -g @cpp.js/package-gdal-bin-wasi
gdalinfo-wasi --version
ogr2ogr-wasi out.gpkg in.geojson
```

Every tool is exposed as a `<tool>-wasi` command (the suffix keeps a native
install unshadowed). The launcher resolves mounts and guest environment
automatically from the package's configuration — for example the gdal family
mounts its `GDAL_DATA`/`PROJ_DATA` folders and openssl provides the CA
bundle for https. Tools that are part of the map but not published print the
exact from-source build command instead of failing silently.

Each `-bin-wasi` package ships its third-party notices (`THIRD-PARTY-LICENSES.md`),
a CycloneDX SBOM and a machine-readable `cppjs.provenance` block in
package.json documenting exactly which sources, toolchain and build
environment produced the shipped binaries; the npm `license` field is the
derived compound expression of everything statically linked inside.

## Limits

No processes, no dynamic loading, single-threaded for now. Anything
unsupported fails cleanly at runtime instead of trapping at instantiation.

# @cpp.js/package-gdal-bin-wasi

The upstream **`gdal` CLI**, built by GDAL's own build system (`BUILD_APPS=ON` - nothing vendored, nothing copied), shipped as a single **WASI command component** (`wasm32-wasip3`) with [cpp.js](https://cpp.js.org). The `lib`/`bin` split mirrors Debian's `libgdal-dev` vs `gdal-bin`: link against [`@cpp.js/package-gdal-wasi`](https://www.npmjs.com/package/@cpp.js/package-gdal-wasi) when you build your own tool, install this package when you just want to run GDAL.

## Run

No compiler, no build step - every tool installs as a `<tool>-wasi` command (generated shims that run wasmtime with the right flags; GDAL/PROJ data and the CA bundle are discovered and mounted from the config graph automatically, so relative paths and `/vsicurl` just work):

```bash
npm i -g @cpp.js/package-gdal-bin-wasi

gdal-wasi --version
gdal-wasi raster convert input.tif output.png
ogr2ogr-wasi out.gpkg in.geojson
gdalinfo-wasi /vsicurl/https://raw.githubusercontent.com/OSGeo/gdal/master/autotest/gcore/data/byte.tif
```

One-off use without installing globally: `npx -p @cpp.js/package-gdal-bin-wasi gdal-wasi --version`. Requires a WASI 0.3 runtime with Wasm 3.0 exception support (wasmtime 47+).

### Calling wasmtime yourself

Full control over preopens, permissions and env:

```bash
npm i @cpp.js/package-gdal-bin-wasi

M=node_modules/@cpp.js/package
T=wasi-wasm32-st-release
alias gdalw='wasmtime run \
  -S inherit-network=y -S allow-ip-name-lookup=y -S tcp=y \
  --dir=.::/work \
  --dir=$M-gdal-bin-wasi/dist/prebuilt/$T/share/gdal::/gdal \
  --dir=$M-proj-wasi/dist/prebuilt/$T/share/proj::/proj \
  --dir=$M-openssl-wasi/dist/prebuilt/$T/ssl/certs::/certs \
  --env GDAL_DATA=/gdal --env PROJ_DATA=/proj --env GDAL_CACHEMAX=64 \
  --env CURL_CA_BUNDLE=/certs/cacert.pem \
  $M-gdal-bin-wasi/dist/prebuilt/$T/bin/gdal'

gdalw --version
gdalw raster convert /work/input.tif /work/output.png
gdalw raster info /vsicurl/https://raw.githubusercontent.com/OSGeo/gdal/master/autotest/gcore/data/byte.tif
```

GDAL's share files ship in this package; `proj.db` and the CA bundle are mounted straight from the dependency packages npm installs alongside (`@cpp.js/package-proj-wasi`, `@cpp.js/package-openssl-wasi`) - nothing is duplicated; the shims discover the same paths automatically. The `-S` socket grants and `CURL_CA_BUNDLE` are only needed for network access (`/vsicurl` & friends over `wasi:sockets`, verified https) - drop them for purely local runs.

## What's inside

`bin/gdal` exactly as GDAL's build produces it, statically linked against the `-wasi` prebuilts of geotiff, proj, tiff, sqlite3, zlib, curl and openssl (TLS). Raster: GTiff/PNG/JPEG/GIF and friends; vector: GeoJSON, GPKG, SQLite and more; `gdal pipeline ... external` steps are stubbed (no processes on WASI). Single-threaded. cpp.js's wasi runtime stubs (the dlopen family, `tmpfile`, plus `getsockname`/`getpeername` shadows covering wasmtime's current mid-connect introspection gap) ride along in every executable link.

The classic utilities ship too - as **multicall entries inside the same binary**: `bin/gdal` carries all 29 tools (gdalinfo, gdalwarp, ogr2ogr, gdal_translate, sozip, ...) and the first argument picks one (`gdalw gdalinfo --version`, `gdalw ogr2ogr ...`). An unrecognized first argument falls through to the unified `gdal` CLI, so it stays a drop-in replacement. That costs ~240 KB over the single-tool binary instead of 29 separate ~43 MB components. The machine-readable tool map ships as `dist/prebuilt/<target>/cppjs-bin.json` (`kind: "multicall-entry"` marks the dispatched tools).

## License

GDAL is distributed under the [MIT License](https://github.com/OSGeo/gdal/blob/master/LICENSE.TXT). This package ships a statically linked aggregate: the effective license expression of everything inside is derived into the package.json `license` field, and the root `LICENSE` file carries the full text of every bundled component. The same sections ship as `THIRD-PARTY-LICENSES.md` with a CycloneDX `sbom.cdx.json` next to the prebuilt, and the reproducible build recipe is recorded in `cppjs.provenance`. You determine what your use requires - this is not legal advice.

# @crossbind/port-gdal-wasm

The **WebAssembly** build of the precompiled **GDAL** library, built with [crossbind](https://crossbind.dev).

> For installation and usage, see the main package: **[@crossbind/port-gdal](https://www.npmjs.com/package/@crossbind/port-gdal)**.

## Supported targets
- WebAssembly (`wasm32`) — single-threaded
- WebAssembly (`wasm32`) — multi-threaded (needs `SharedArrayBuffer`; serve with COOP + COEP headers)

## License
This project includes the precompiled GDAL library, distributed under the [MIT License](https://github.com/OSGeo/gdal/blob/master/LICENSE.TXT).

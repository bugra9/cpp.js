# @crossbind/port-geotiff-wasm

The **WebAssembly** build of the precompiled **libgeotiff** library, built with [crossbind](https://crossbind.dev).

> For installation and usage, see the main package: **[@crossbind/port-geotiff](https://www.npmjs.com/package/@crossbind/port-geotiff)**.

## Supported targets
- WebAssembly (`wasm32`) — single-threaded
- WebAssembly (`wasm32`) — multi-threaded (needs `SharedArrayBuffer`; serve with COOP + COEP headers)

## License
This project includes the precompiled libgeotiff library, distributed under the [MIT License](https://github.com/OSGeo/libgeotiff/blob/master/libgeotiff/LICENSE).

# Third-Party Notices — @cpp.js/package-gdal

This package distributes a precompiled build that statically links the
open-source libraries listed below. Each library keeps its own license; the
distribution obligations of an application that bundles this package are
determined by the combined set. The full license text of each component ships
in its own `@cpp.js/package-*` package.

| Component | Version | License (as declared by its package) |
|-----------|---------|----------------------------------------|
| GDAL (`@cpp.js/package-gdal`) | 3.13.1 | MIT |
| cURL (`@cpp.js/package-curl`) | 8.20.0 | curl |
| Expat (`@cpp.js/package-expat`) | 2.8.1 | MIT |
| GEOS (`@cpp.js/package-geos`) | 3.14.1 | LGPL-2.1-or-later |
| libgeotiff (`@cpp.js/package-geotiff`) | 1.7.4 | MIT |
| libiconv (`@cpp.js/package-iconv`) | 1.19 | LGPL-2.1-or-later |
| libjpeg-turbo (`@cpp.js/package-jpegturbo`) | 3.1.4.1 | (IJG AND BSD-3-Clause AND Zlib) |
| PROJ (`@cpp.js/package-proj`) | 9.8.1 | MIT |
| SpatiaLite (`@cpp.js/package-spatialite`) | 5.1.0 | MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later |
| SQLite (`@cpp.js/package-sqlite3`) | 3.53.2 | blessing |
| libtiff (`@cpp.js/package-tiff`) | 4.7.1 | libtiff |
| libwebp (`@cpp.js/package-webp`) | 1.6.0 | BSD-3-Clause |
| zlib (`@cpp.js/package-zlib`) | 1.3.2 | Zlib |
| Zstandard (`@cpp.js/package-zstd`) | 1.5.7 | BSD-3-Clause |
| LERC (`@cpp.js/package-lerc`) | 4.1.0 | Apache-2.0 |

## Copyleft components

This bundle statically links copyleft-licensed code: GEOS (LGPL-2.1-or-later); libiconv (LGPL-2.1-or-later); SpatiaLite (MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later).
If you depend on these under their (L)GPL terms, your application may incur
relinking / source-availability obligations. Because cpp.js links the final
binary in *your* project, you can satisfy the LGPL relink requirement by
rebuilding against your own object files. Consult each component's license and
your own legal counsel before distributing.

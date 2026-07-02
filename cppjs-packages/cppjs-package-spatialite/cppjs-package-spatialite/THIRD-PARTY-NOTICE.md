# Third-Party Notices — @cpp.js/package-spatialite

This package distributes a precompiled build that statically links the
open-source libraries listed below. Each library keeps its own license; the
distribution obligations of an application that bundles this package are
determined by the combined set. The full license text of each component ships
in its own `@cpp.js/package-*` package.

| Component | Version | License (as declared by its package) |
|-----------|---------|----------------------------------------|
| SpatiaLite (`@cpp.js/package-spatialite`) | 5.1.0 | MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later |
| GEOS (`@cpp.js/package-geos`) | 3.14.1 | LGPL-2.1-or-later |
| PROJ (`@cpp.js/package-proj`) | 9.8.1 | MIT |
| SQLite (`@cpp.js/package-sqlite3`) | 3.53.2 | blessing |
| zlib (`@cpp.js/package-zlib`) | 1.3.2 | Zlib |
| libiconv (`@cpp.js/package-iconv`) | 1.19 | LGPL-2.1-or-later |

## Copyleft components

This bundle statically links copyleft-licensed code: SpatiaLite (MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later); GEOS (LGPL-2.1-or-later); libiconv (LGPL-2.1-or-later).
If you depend on these under their (L)GPL terms, your application may incur
relinking / source-availability obligations. Because cpp.js links the final
binary in *your* project, you can satisfy the LGPL relink requirement by
rebuilding against your own object files. Consult each component's license and
your own legal counsel before distributing.

import { z } from 'zod';

export const name = 'cppjs_list_packages';

export const config = {
    title: 'List prebuilt cpp.js packages',
    description: 'Return the catalog of @cpp.js/package-* libraries shipped by cpp.js, with library name, category, supported architectures (wasm/android/ios), and what they enable. Use this BEFORE suggesting the user write their own bindings — many common libraries already have prebuilt packages.',
    inputSchema: {
        category: z
            .enum(['all', 'geo', 'crypto', 'compression', 'image', 'text', 'database', 'network'])
            .optional()
            .describe('Filter by category. Defaults to "all".'),
    },
};

const CATALOG = [
    { lib: 'curl', npm: '@cpp.js/package-curl', category: 'network', supports: ['wasm', 'android', 'ios'], description: 'HTTP/HTTPS/FTP client library.' },
    { lib: 'expat', npm: '@cpp.js/package-expat', category: 'text', supports: ['wasm', 'android', 'ios'], description: 'Stream-oriented XML parser.' },
    { lib: 'gdal', npm: '@cpp.js/package-gdal', category: 'geo', supports: ['wasm', 'android', 'ios'], description: 'Geospatial data abstraction library — read/write 200+ raster and vector formats.' },
    { lib: 'geos', npm: '@cpp.js/package-geos', category: 'geo', supports: ['wasm', 'android', 'ios'], description: 'Geometry engine for 2D spatial predicates and operations (port of JTS).' },
    { lib: 'geotiff', npm: '@cpp.js/package-geotiff', category: 'geo', supports: ['wasm', 'android', 'ios'], description: 'GeoTIFF reader / writer (libgeotiff).' },
    { lib: 'iconv', npm: '@cpp.js/package-iconv', category: 'text', supports: ['wasm', 'android', 'ios'], description: 'Character set conversion (libiconv).' },
    { lib: 'jpegturbo', npm: '@cpp.js/package-jpegturbo', category: 'image', supports: ['wasm', 'android', 'ios'], description: 'SIMD-accelerated JPEG codec.' },
    { lib: 'lerc', npm: '@cpp.js/package-lerc', category: 'image', supports: ['wasm', 'android', 'ios'], description: 'Limited Error Raster Compression for elevation / scientific raster data.' },
    { lib: 'openssl', npm: '@cpp.js/package-openssl', category: 'crypto', supports: ['wasm', 'android', 'ios'], description: 'TLS / cryptography library.' },
    { lib: 'proj', npm: '@cpp.js/package-proj', category: 'geo', supports: ['wasm', 'android', 'ios'], description: 'Coordinate transformation library.' },
    { lib: 'spatialite', npm: '@cpp.js/package-spatialite', category: 'database', supports: ['wasm', 'android', 'ios'], description: 'SQLite extension adding spatial SQL.' },
    { lib: 'sqlite3', npm: '@cpp.js/package-sqlite3', category: 'database', supports: ['wasm', 'android', 'ios'], description: 'Embedded SQL database engine.' },
    { lib: 'tiff', npm: '@cpp.js/package-tiff', category: 'image', supports: ['wasm', 'android', 'ios'], description: 'TIFF image format (libtiff).' },
    { lib: 'webp', npm: '@cpp.js/package-webp', category: 'image', supports: ['wasm', 'android', 'ios'], description: 'WebP image codec.' },
    { lib: 'zlib', npm: '@cpp.js/package-zlib', category: 'compression', supports: ['wasm', 'android', 'ios'], description: 'DEFLATE compression library.' },
    { lib: 'zstd', npm: '@cpp.js/package-zstd', category: 'compression', supports: ['wasm', 'android', 'ios'], description: 'Zstandard compression library.' },
];

export async function handler({ category = 'all' } = {}) {
    const filtered = category === 'all' ? CATALOG : CATALOG.filter((p) => p.category === category);
    const payload = {
        total: filtered.length,
        catalogUrl: 'https://github.com/bugra9/cpp.js/tree/main/cppjs-packages',
        packages: filtered,
    };
    return {
        content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    };
}

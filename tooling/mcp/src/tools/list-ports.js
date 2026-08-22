import { z } from 'zod';

export const name = 'crossbind_list_ports';

export const config = {
    title: 'List prebuilt crossbind packages',
    description: 'Return the catalog of @crossbind/port-* libraries shipped by crossbind, with library name, category, supported architectures (wasm/android/ios), and what they enable. Use this BEFORE suggesting the user write their own bindings — many common libraries already have prebuilt packages.',
    inputSchema: {
        category: z
            .enum(['all', 'geo', 'crypto', 'compression', 'image', 'text', 'database', 'network'])
            .optional()
            .describe('Filter by category. Defaults to "all".'),
    },
};

const CATALOG = [
    { lib: 'curl', npm: '@crossbind/port-curl', category: 'network', supports: ['wasm', 'android', 'ios'], description: 'HTTP/HTTPS/FTP client library.' },
    { lib: 'expat', npm: '@crossbind/port-expat', category: 'text', supports: ['wasm', 'android', 'ios'], description: 'Stream-oriented XML parser.' },
    { lib: 'gdal', npm: '@crossbind/port-gdal', category: 'geo', supports: ['wasm', 'android', 'ios'], description: 'Geospatial data abstraction library — read/write 200+ raster and vector formats.' },
    { lib: 'geos', npm: '@crossbind/port-geos', category: 'geo', supports: ['wasm', 'android', 'ios'], description: 'Geometry engine for 2D spatial predicates and operations (port of JTS).' },
    { lib: 'geotiff', npm: '@crossbind/port-geotiff', category: 'geo', supports: ['wasm', 'android', 'ios'], description: 'GeoTIFF reader / writer (libgeotiff).' },
    { lib: 'iconv', npm: '@crossbind/port-iconv', category: 'text', supports: ['wasm', 'android', 'ios'], description: 'Character set conversion (libiconv).' },
    { lib: 'jpegturbo', npm: '@crossbind/port-jpegturbo', category: 'image', supports: ['wasm', 'android', 'ios'], description: 'SIMD-accelerated JPEG codec.' },
    { lib: 'lerc', npm: '@crossbind/port-lerc', category: 'image', supports: ['wasm', 'android', 'ios'], description: 'Limited Error Raster Compression for elevation / scientific raster data.' },
    { lib: 'openssl', npm: '@crossbind/port-openssl', category: 'crypto', supports: ['wasm', 'android', 'ios'], description: 'TLS / cryptography library.' },
    { lib: 'proj', npm: '@crossbind/port-proj', category: 'geo', supports: ['wasm', 'android', 'ios'], description: 'Coordinate transformation library.' },
    { lib: 'spatialite', npm: '@crossbind/port-spatialite', category: 'database', supports: ['wasm', 'android', 'ios'], description: 'SQLite extension adding spatial SQL.' },
    { lib: 'sqlite3', npm: '@crossbind/port-sqlite3', category: 'database', supports: ['wasm', 'android', 'ios'], description: 'Embedded SQL database engine.' },
    { lib: 'tiff', npm: '@crossbind/port-tiff', category: 'image', supports: ['wasm', 'android', 'ios'], description: 'TIFF image format (libtiff).' },
    { lib: 'webp', npm: '@crossbind/port-webp', category: 'image', supports: ['wasm', 'android', 'ios'], description: 'WebP image codec.' },
    { lib: 'zlib', npm: '@crossbind/port-zlib', category: 'compression', supports: ['wasm', 'android', 'ios'], description: 'DEFLATE compression library.' },
    { lib: 'zstd', npm: '@crossbind/port-zstd', category: 'compression', supports: ['wasm', 'android', 'ios'], description: 'Zstandard compression library.' },
];

export async function handler({ category = 'all' } = {}) {
    const filtered = category === 'all' ? CATALOG : CATALOG.filter((p) => p.category === category);
    const payload = {
        total: filtered.length,
        catalogUrl: 'https://github.com/crossbind/crossbind/tree/main/ports',
        packages: filtered,
    };
    return {
        content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }],
    };
}

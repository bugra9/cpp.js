// Every library app, in the order its library's page shows them: the id its card and its anchor on that page carry,
// the port family it runs and its title. Plain data, so Node reads it too: llms.txt, the capture of the Examples
// page's previews and the deploy check.
export const APP_LIST = Object.freeze([
    { id: 'curl-filter', family: 'curl', title: "Test a URL allowlist against libcurl's own parser" },
    { id: 'curl-url-lab', family: 'curl', title: 'Take a URL apart the way libcurl does, beside your browser' },
    { id: 'curl-dates', family: 'curl', title: 'Read HTTP dates the way curl does' },
    { id: 'expat-firehose', family: 'expat', title: 'Parse a gigabyte of XML without holding it' },
    { id: 'expat-attacks', family: 'expat', title: 'Billion laughs, blocked at a line and column' },
    { id: 'expat-gpx', family: 'expat', title: 'Read a GPS track, heart rate and all' },
    { id: 'gdal-converter', family: 'gdal', title: 'Open twenty vector formats and write seventeen, reprojected, in the page' },
    { id: 'gdal-terrain', family: 'gdal', title: 'A terrain studio: hillshade, slope, contour lines and what is seen from where you click' },
    { id: 'gdal-polygons', family: 'gdal', title: 'Pixels to polygons: paint, and GDAL traces the shapes' },
    { id: 'geos-lab', family: 'geos', title: 'Fifteen geometry operations on shapes you can edit' },
    { id: 'geos-doctor', family: 'geos', title: 'Find out why a polygon is invalid, then repair it two ways' },
    { id: 'geos-coverage', family: 'geos', title: 'Simplify a map without opening gaps between regions' },
    { id: 'geotiff-inspector', family: 'geotiff', title: 'Where is this GeoTIFF?' },
    { id: 'geotiff-georeferencer', family: 'geotiff', title: 'Georeference any picture' },
    { id: 'geotiff-elevation', family: 'geotiff', title: 'Read heights and degrees off an elevation model' },
    { id: 'iconv-mojibake', family: 'iconv', title: 'Repair text that was opened with the wrong encoding' },
    { id: 'iconv-export', family: 'iconv', title: 'Write the exact bytes a legacy system imports' },
    { id: 'iconv-decode', family: 'iconv', title: 'Read the encodings TextDecoder refuses' },
    { id: 'jpegturbo-privacy', family: 'jpegturbo', title: 'See what a photo gives away, then remove it without re-encoding' },
    { id: 'jpegturbo-lab', family: 'jpegturbo', title: 'The JPEG settings canvas.toBlob does not give you' },
    { id: 'jpegturbo-thumbnails', family: 'jpegturbo', title: 'Decode a 12 MP photo straight to a thumbnail' },
    { id: 'lerc-squeeze', family: 'lerc', title: 'Shrink an elevation model to the error you can accept' },
    { id: 'lerc-inspector', family: 'lerc', title: 'Look inside a LERC tile before you decode it' },
    { id: 'lerc-vs-gzip', family: 'lerc', title: 'Where LERC beats gzip, and where it does not' },
    { id: 'openssl-studio', family: 'openssl', title: 'Make a key and a certificate, or read any PEM' },
    { id: 'openssl-tls', family: 'openssl', title: 'A TLS handshake between two OpenSSL endpoints, in this tab' },
    { id: 'openssl-pfx', family: 'openssl', title: 'Open a .p12 or .pfx file, and make one' },
    { id: 'proj-atlas', family: 'proj', title: 'See what a map projection stretches' },
    { id: 'proj-detective', family: 'proj', title: 'Find out what a .prj is, and every way PROJ can transform it' },
    { id: 'proj-flights', family: 'proj', title: 'Why flights curve on a map' },
    { id: 'spatialite-playground', family: 'spatialite', title: 'Spatial SQL, with the answer drawn as a map' },
    { id: 'spatialite-routing', family: 'spatialite', title: 'Shortest paths in SQL, around the streets you close' },
    { id: 'spatialite-geopackage', family: 'spatialite', title: 'A GeoPackage that QGIS and GDAL open, written in this tab' },
    { id: 'sqlite3-search', family: 'sqlite3', title: 'Search this site as you type' },
    { id: 'sqlite3-rtree', family: 'sqlite3', title: 'Ask 50,000 points what is inside a box' },
    { id: 'sqlite3-explorer', family: 'sqlite3', title: 'Open any SQLite file, privately' },
    { id: 'tiff-viewer', family: 'tiff', title: 'Open any TIFF, in any browser' },
    { id: 'tiff-scans', family: 'tiff', title: 'Turn page photos into one archival TIFF' },
    { id: 'tiff-lab', family: 'tiff', title: 'Compare every codec on 16-bit and float rasters' },
    { id: 'webp-studio', family: 'webp', title: 'See what each WebP quality costs, and what it gives away' },
    { id: 'webp-sticker', family: 'webp', title: 'Turn any picture into a sticker that fits the limit' },
    { id: 'webp-stream', family: 'webp', title: 'Watch a WebP arrive, row by row' },
    { id: 'zlib-seek', family: 'zlib', title: 'Jump into the middle of a big .gz without unzipping it' },
    { id: 'zlib-png', family: 'zlib', title: 'Make a PNG smaller without changing a pixel' },
    { id: 'zlib-zip', family: 'zlib', title: 'Look inside a .zip, .docx or .xlsx without unpacking it' },
    { id: 'zstd-dictionary', family: 'zstd', title: 'Teach zstd your data, then watch small messages shrink' },
    { id: 'zstd-delta', family: 'zstd', title: 'Send a 1 MB update in about 1 KB' },
    { id: 'zstd-opener', family: 'zstd', title: 'Look inside a .tar.zst without unpacking it' },
].map((app) => Object.freeze(app)));

// Where the Examples page finds an app's picture in each theme; scripts/site/capture-app-previews.mjs writes them.
export const PREVIEW_THEMES = Object.freeze(['light', 'dark']);
export const PREVIEW_WIDTH = 760;
export const PREVIEW_HEIGHT = 475;
export const previewOf = (id, theme) => `/examples/apps/${id}-${theme}.webp`;

const BY_ID = new Map(APP_LIST.map((app) => [app.id, app]));

export function appOf(id) {
    const app = BY_ID.get(id);
    if (!app) throw new Error(`There is no app ${id}.`);
    return app;
}

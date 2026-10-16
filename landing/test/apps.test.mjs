import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PORTS, versionOf } from '../src/ports/catalog.js';

// The library apps name the versions they run through versionOf, so a port's release reaches every sentence that
// names it. Written out by hand, OpenSSL's and SQLite's went stale.
const APPS = new URL('../src/apps/', import.meta.url);
const VERSIONED_NAME = /\b(?:libcurl|curl|Expat|GDAL|GEOS|libgeotiff|GeoTIFF|libiconv|iconv|libjpeg-turbo|LERC|OpenSSL|PROJ|SpatiaLite|SQLite|libtiff|libTIFF|libwebp|WebP|zlib|libzstd|zstd|Zstandard) v?\d+\.\d+(?:\.\d+)?\b/g;
// A version a sentence names on purpose: not one the apps run.
const PAST_VERSIONS = new Set(['OpenSSL 1.1.1']);

const sourcesUnder = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) return sourcesUnder(new URL(`${entry.name}/`, dir));
    return /\.jsx?$/.test(entry.name) ? [new URL(entry.name, dir)] : [];
});
// Comments, and the source excerpts' comments with them, say which builds computed a check's reference values:
// history, not what the page runs.
const withoutComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

test('the library apps take the versions they name from the catalog', () => {
    const written = sourcesUnder(APPS).flatMap((file) => [...withoutComments(readFileSync(file, 'utf8')).matchAll(VERSIONED_NAME)]
        .map(([name]) => name)
        .filter((name) => !PAST_VERSIONS.has(name))
        .map((name) => `${file.pathname.split('/src/apps/')[1]}: ${name}`));
    assert.deepEqual(written, []);
});

test('every library has a version to name, and an unknown one is an error', () => {
    PORTS.forEach(({ family }) => assert.match(versionOf(family), /^\d+\.\d+/, family));
    assert.throws(() => versionOf('nope'), /nope/);
});

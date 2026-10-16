import catalog from '../../generated/ports-catalog.js';

// The Libraries catalog, generated before every build by scripts/site/build-ports-catalog.mjs
// from ports/catalog.json, the port manifests and what npm serves on the release channel's
// dist-tag. Only a published variant counts as supported.
export const PORTS = [...catalog.ports].sort((left, right) => left.name.localeCompare(right.name, 'en'));

function portOf(family) {
    const port = PORTS.find((entry) => entry.family === family);
    if (!port) throw new Error(`There is no port ${family}.`);
    return port;
}

// The version of the library a port carries, for a sentence that names it: written out by hand, it went stale.
export const versionOf = (family) => portOf(family).nativeVersion;

// The license text the library's packages ship, for every link to its license.
export const licenseUrlOf = (family) => portOf(family).licenseUrl;

export const BIN_TARGET = 'standalone-wasi';
export const NAPI_TARGET = 'standalone-napi';

export const CATEGORY_LABELS = {
    geo: 'Geospatial',
    image: 'Imaging',
    database: 'Database',
    crypto: 'Crypto and TLS',
    network: 'Networking',
    text: 'Text',
    compression: 'Compression',
};

export const TARGET_LABELS = {
    wasm: 'Web and Node.js',
    wasi: 'WASI library',
    android: 'Android',
    ios: 'iOS',
    darwin: 'macOS',
    linux: 'Linux',
    linuxmusl: 'Linux (musl)',
    win32: 'Windows',
    'standalone-wasi': 'WASI commands',
};

export const publishedTarget = (port, target) => port.targets.find((entry) => entry.target === target && entry.published) ?? null;

export const publishedLibraryTargets = (port) => port.targets.filter((entry) => entry.target !== BIN_TARGET && entry.target !== NAPI_TARGET && entry.published);

// Command tools are the published -standalone-wasi packages only; a web or library build never counts.
export const WASI_TOOL_PORTS = PORTS.filter((port) => port.binCommands.length > 0 && publishedTarget(port, BIN_TARGET));

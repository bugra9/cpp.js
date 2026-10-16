import { PACKAGES } from './packages.js';

export const MAX_SOURCE_BYTES = 64 * 1024;
export const MAX_FILES = 16;
export const MAX_PACKAGES = 8;
// For the Worker and the compiler alike, so the compiler takes whatever the Worker passes on: JSON escaping can
// double the sources, and the browser check's token rides along.
export const MAX_BODY_BYTES = 2 * MAX_SOURCE_BYTES + 4 * 1024;

// main.js, read for its imports and never run here, and native sources one folder deep, named like C identifiers: no
// name can climb out of the workspace or be read by the build as anything but a source.
const FILE_NAME = /^(?:main\.js|native\/[A-Za-z_][A-Za-z0-9_]{0,47}\.(?:h|hpp|cpp|cc|rs))$/;
// The first playground's two names.
const LEGACY_NAMES = new Map([['native.h', 'native/native.h'], ['native.cpp', 'native/native.cpp']]);
const BINDS = /\.(?:h|hpp|rs)$/;
const KNOWN_PACKAGES = new Set(PACKAGES.map(({ id }) => id));
const IMPORTED_PACKAGES = new Set(PACKAGES.filter(({ use }) => use.import).map(({ id }) => id));

export class InvalidRequest extends Error {}

// Shared by the compiler (Node) and the Worker in front, which has no Buffer.
const utf8 = new TextEncoder();

const isPlainObject = (value) => typeof value === 'object' && value !== null && !Array.isArray(value);
const shown = (text) => JSON.stringify(String(text).slice(0, 40));

function validateFiles(given) {
    if (!isPlainObject(given)) {
        throw new InvalidRequest('Send {"files": {"main.js": "...", "native/<name>.h": "..."}, "packages": ["..."]}.');
    }
    const files = new Map();
    for (const sent of Object.keys(given)) {
        const name = LEGACY_NAMES.get(sent) ?? sent;
        if (!FILE_NAME.test(name)) {
            throw new InvalidRequest(`${shown(sent)} does not compile: send main.js and sources under native/, named like a C identifier, ending in .h, .hpp, .cpp, .cc or .rs.`);
        }
        if (files.has(name)) throw new InvalidRequest(`${name} is there twice.`);
        files.set(name, given[sent]);
    }
    if (files.size > MAX_FILES) throw new InvalidRequest(`The project has ${files.size} files; the limit is ${MAX_FILES}.`);
    const texts = [...files.values()];
    if (texts.some((text) => typeof text !== 'string' || text.includes('\0'))) {
        throw new InvalidRequest('Each file must be text.');
    }
    const bytes = texts.reduce((sum, text) => sum + utf8.encode(text).byteLength, 0);
    if (bytes > MAX_SOURCE_BYTES) {
        throw new InvalidRequest(`The files hold ${bytes} bytes; the limit is ${MAX_SOURCE_BYTES}.`);
    }
    return files;
}

function validatePackages(given) {
    if (given === undefined) return [];
    if (!Array.isArray(given) || given.some((id) => typeof id !== 'string')) {
        throw new InvalidRequest('Send "packages" as a list of package ids.');
    }
    if (given.length > MAX_PACKAGES) throw new InvalidRequest(`The project uses ${given.length} packages; the limit is ${MAX_PACKAGES}.`);
    const unknown = given.find((id) => !KNOWN_PACKAGES.has(id));
    if (unknown !== undefined) throw new InvalidRequest(`The playground has no package ${shown(unknown)}.`);
    const twice = given.find((id, i) => given.indexOf(id) !== i);
    if (twice !== undefined) throw new InvalidRequest(`${twice} is there twice.`);
    return given;
}

export function validateRequest(body) {
    if (!isPlainObject(body) || Object.keys(body).some((key) => key !== 'files' && key !== 'packages')) {
        throw new InvalidRequest('Send {"files": {...}, "packages": [...]} and nothing else.');
    }
    const files = validateFiles(body.files);
    const packages = validatePackages(body.packages);
    const binds = [...files.keys()].some((name) => BINDS.test(name)) || packages.some((id) => IMPORTED_PACKAGES.has(id));
    if (!binds) {
        throw new InvalidRequest('Nothing to bind: add a header or a Rust file under native/, or a package main.js imports.');
    }
    const sortedFiles = [...files.keys()].sort().map((name) => [name, files.get(name)]);
    return Object.freeze({ files: Object.freeze(Object.fromEntries(sortedFiles)), packages: Object.freeze([...packages].sort()) });
}

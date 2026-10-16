import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    validateRequest, InvalidRequest, MAX_FILES, MAX_PACKAGES, MAX_SOURCE_BYTES,
} from '../compiler/validate.js';

test('returns the files by name and the chosen packages, both sorted', () => {
    const request = validateRequest({
        files: { 'native/math.rs': 'pub fn f() {}', 'main.js': "import { f } from './native/math.rs';", 'native/greet.h': 'int g();' },
        packages: ['port:sqlite3', 'crate:uuid'],
    });

    assert.deepEqual(request, {
        files: { 'main.js': "import { f } from './native/math.rs';", 'native/greet.h': 'int g();', 'native/math.rs': 'pub fn f() {}' },
        packages: ['crate:uuid', 'port:sqlite3'],
    });
    assert.deepEqual(Object.keys(request.files), ['main.js', 'native/greet.h', 'native/math.rs']);
});

test('reads the first playground\'s two files as native/native.h and native/native.cpp', () => {
    assert.deepEqual(validateRequest({ files: { 'native.h': 'int f();', 'native.cpp': 'int f() { return 1; }' } }), {
        files: { 'native/native.cpp': 'int f() { return 1; }', 'native/native.h': 'int f();' },
        packages: [],
    });
});

test('takes C and C++ sources and Rust under native/, and main.js', () => {
    ['native/a.h', 'native/a.hpp', 'native/a.cpp', 'native/a.cc', 'native/a.rs', 'native/A_b9.h', 'main.js'].forEach((name) => {
        assert.doesNotThrow(() => validateRequest({ files: { 'native/keep.h': '', [name]: '' } }), name);
    });
});

test('refuses every other file name, so nothing else reaches the workspace', () => {
    [
        '../native.h', 'native/../x.h', 'native/sub/x.h', 'native/.h', 'native/x.H', 'native/x.i', 'native/x.c',
        'native/9x.h', 'native/a-b.h', 'native/a.b.h', 'CMakeLists.txt', 'crossbind.config.js', 'src/main.js', 'main.mjs',
        'Cargo.toml', '__proto__', 'native/__proto__', '',
    ].forEach((name) => {
        assert.throws(() => validateRequest({ files: { 'native/keep.h': '', [name]: '' } }), InvalidRequest, JSON.stringify(name));
    });
});

test('refuses one file under two names', () => {
    assert.throws(() => validateRequest({ files: { 'native.h': '', 'native/native.h': '' } }), /twice/);
});

test('needs something to bind: a header, a Rust file or a package main.js can import', () => {
    assert.throws(() => validateRequest({ files: { 'native/a.cpp': 'int f() { return 1; }', 'main.js': '' } }), /Nothing to bind/);
    assert.throws(() => validateRequest({ files: { 'main.js': '' }, packages: ['conan:fmt'] }), /Nothing to bind/);
    assert.doesNotThrow(() => validateRequest({ files: { 'main.js': '' }, packages: ['port:sqlite3'] }));
    assert.doesNotThrow(() => validateRequest({ files: { 'native/m.rs': 'pub fn f() {}' } }));
});

test('refuses anything but an object that holds files and packages alone', () => {
    [null, [], 'files', { files: [] }, { files: null }, { files: { 'native/a.h': '' }, flags: ['-O3'] }].forEach((body) => {
        assert.throws(() => validateRequest(body), InvalidRequest, JSON.stringify(body));
    });
});

test('refuses a file that is not text', () => {
    assert.throws(() => validateRequest({ files: { 'native/a.h': 1 } }), /must be text/);
    assert.throws(() => validateRequest({ files: { 'native/a.h': 'int\0f();' } }), /must be text/);
});

test('counts the size limit in UTF-8 bytes over every file', () => {
    const half = 'ğ'.repeat(MAX_SOURCE_BYTES / 4);

    assert.doesNotThrow(() => validateRequest({ files: { 'native/a.h': half, 'main.js': half } }));
    assert.throws(() => validateRequest({ files: { 'native/a.h': half, 'main.js': `${half}x` } }), new RegExp(`limit is ${MAX_SOURCE_BYTES}`));
});

test('limits the number of files', () => {
    const files = Object.fromEntries(Array.from({ length: MAX_FILES + 1 }, (_, i) => [`native/f${i}.h`, '']));
    assert.throws(() => validateRequest({ files }), /files/);
});

test('takes only packages the image carries, each once and not too many', () => {
    assert.throws(() => validateRequest({ files: { 'native/a.h': '' }, packages: ['port:gdal'] }), /port:gdal/);
    assert.throws(() => validateRequest({ files: { 'native/a.h': '' }, packages: ['crate:uuid', 'crate:uuid'] }), /twice/);
    assert.throws(() => validateRequest({ files: { 'native/a.h': '' }, packages: 'crate:uuid' }), InvalidRequest);
    assert.throws(() => validateRequest({ files: { 'native/a.h': '' }, packages: [1] }), InvalidRequest);
    assert.ok(MAX_PACKAGES >= 3);
    assert.deepEqual(validateRequest({ files: { 'native/a.h': '' }, packages: undefined }).packages, []);
});

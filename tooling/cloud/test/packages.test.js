import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PACKAGES, configSource, packagesFor } from '../compiler/packages.js';

test('every package has a unique id, a source and one way to be used', () => {
    const ids = PACKAGES.map(({ id }) => id);
    assert.equal(new Set(ids).size, ids.length);
    PACKAGES.forEach((pkg) => {
        assert.match(pkg.id, /^(port|crate|conan):[a-z0-9_-]+$/, pkg.id);
        assert.equal(pkg.id, `${pkg.source}:${pkg.name}`);
        assert.ok(Boolean(pkg.use.import) !== Boolean(pkg.use.include), `${pkg.id} is imported from JavaScript or included from C++`);
        assert.ok(pkg.version && pkg.summary, pkg.id);
    });
});

test('every port names the tarballs the image packs, its own among them, each pinned by integrity', () => {
    PACKAGES.filter(({ source }) => source === 'port').forEach((pkg) => {
        assert.ok(pkg.tarballs.some(({ name }) => name === pkg.package), pkg.id);
        pkg.tarballs.forEach(({ name, integrity }) => assert.match(integrity, /^sha512-[A-Za-z0-9+/]{86}==$/, name));
    });
});

test('looks packages up by id and refuses one the image does not carry', () => {
    assert.deepEqual(packagesFor(['crate:uuid', 'port:sqlite3']).map(({ id }) => id), ['crate:uuid', 'port:sqlite3']);
    assert.throws(() => packagesFor(['port:gdal']), /port:gdal/);
});

test('the config declares the chosen packages only: ports through their own config, crates and Conan pinned', () => {
    const source = configSource(['port:sqlite3', 'crate:uuid', 'conan:zlib']);

    assert.match(source, /^import port0 from '@crossbind\/port-sqlite3-wasm\/crossbind\.config\.js';$/m);
    assert.match(source, /dependencies: \[port0\]/);
    assert.match(source, /cargoDependencies: \{"uuid":"\{ version = \\"=1\.28\.0\\", features = \[\\"v4\\"\] \}"\}/);
    assert.match(source, /conanDependencies: \{"zlib":"1\.3\.2"\}/);
    assert.match(source, /paths: \{ config: import\.meta\.url \}/);
    assert.doesNotMatch(source, /semver|regex|cjson/);
});

test('the config of a project without packages declares none', () => {
    const source = configSource([]);

    assert.doesNotMatch(source, /^import /m);
    assert.match(source, /dependencies: \[\]/);
    assert.match(source, /cargoDependencies: \{\}/);
    assert.match(source, /conanDependencies: \{\}/);
});

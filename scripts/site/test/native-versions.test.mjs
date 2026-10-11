import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { readNativeVersions, repoNativeVersions, resolveExpected, siteNativeVersions } from '../native-versions.mjs';

function tempDir(t) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'native-versions-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    return directory;
}

function writePackage(directory, manifest) {
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify(manifest));
}

test('an installed project reports the native version of each port family it pulled in', (t) => {
    const project = tempDir(t);
    const scope = path.join(project, 'node_modules', '@crossbind');
    writePackage(path.join(scope, 'port-expat'), { name: '@crossbind/port-expat', nativeVersion: '2.9.0', crossbind: { upstream: {} } });
    writePackage(path.join(scope, 'port-expat-wasm'), { name: '@crossbind/port-expat-wasm', nativeVersion: '2.9.0' });
    writePackage(path.join(scope, 'port-sqlite3'), { name: '@crossbind/port-sqlite3', nativeVersion: '3.54.0', crossbind: { upstream: {} } });
    writePackage(path.join(scope, 'plugin-vite'), { name: '@crossbind/plugin-vite', version: '2.0.0-beta.63' });

    assert.deepEqual(readNativeVersions(project), { expat: '2.9.0', sqlite3: '3.54.0' });
});

test('a project without installed packages reports no versions', (t) => {
    assert.deepEqual(readNativeVersions(tempDir(t)), {});
});

test('expected output written as a function receives the versions, and a list stays as it is', () => {
    const versions = { expat: '2.9.0' };

    assert.deepEqual(
        resolveExpected(({ expat }) => [`Expat ${expat}`], versions),
        ['Expat 2.9.0'],
    );
    assert.deepEqual(resolveExpected(['true'], versions), ['true']);
});

test('the site takes the versions the live demos installed and the repository ports for the rest', (t) => {
    const root = tempDir(t);
    writePackage(path.join(root, 'ports', 'expat', 'base'), { name: '@crossbind/port-expat', nativeVersion: '2.10.0' });
    writePackage(path.join(root, 'ports', 'zlib', 'base'), { name: '@crossbind/port-zlib', nativeVersion: '1.3.2' });
    const manifest = { demos: [{ id: 'web-vanilla' }, { id: 'lib-expat', nativeVersions: { expat: '2.9.0' } }] };

    assert.deepEqual(repoNativeVersions(root), { expat: '2.10.0', zlib: '1.3.2' });
    assert.deepEqual(siteNativeVersions(manifest, root), { expat: '2.9.0', zlib: '1.3.2' });
});

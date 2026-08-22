import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import calculateDependencyParameters from '../src/state/calculateDependencyParameters.js';

const target = { path: 'android-arm64-v8a-mt-debug', releasePath: 'android-arm64-v8a-mt-release', platform: 'android' };

const dep = (name, type, { enabled, cmakeDir }) => ({
    general: { name },
    export: { type },
    paths: { cmake: `/virtual/${name}/CMakeLists.txt`, cmakeDir, header: `/virtual/${name}/include`, native: `/virtual/${name}/src` },
    dependencies: [],
    functions: { isEnabled: () => enabled },
});

const app = (dependencies) => ({
    export: { type: 'source' },
    ext: { header: ['h'], source: ['cpp'] },
    paths: {
        cmake: '/virtual/app/CMakeLists.txt',
        cmakeDir: '/virtual/app',
        cliCMakeListsTxt: '/cli/CMakeLists.txt',
        header: '/virtual/app/src',
        native: '/virtual/app/src',
    },
    dependencies,
});

let tmpDir;

beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-depparams-'));
});

afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('getCmakeDependsPathAndName', () => {
    test('returns path and name for every dependency enabled on the target', () => {
        const zlib = dep('zlib', 'cmake', { enabled: true, cmakeDir: '/virtual/zlib/dist/prebuilt' });

        const { pathsOfCmakeDepends, nameOfCmakeDepends } = calculateDependencyParameters(app([zlib]))
            .getCmakeDependsPathAndName(target);

        expect(nameOfCmakeDepends).toEqual(['zlib']);
        expect(pathsOfCmakeDepends).toEqual(['/virtual/zlib/dist/prebuilt']);
    });

    test('throws when a cargo dependency has no prebuilt for the target', () => {
        // One cargo package carries every target, so a missing one was never built - linking
        // without it yields a binary that builds clean and dies at init.
        const demo = dep('demo', 'cargo', { enabled: false, cmakeDir: '/virtual/demo/dist/prebuilt' });

        const params = calculateDependencyParameters(app([demo]));

        expect(() => params.getCmakeDependsPathAndName(target))
            .toThrow(/dependency "demo" has no prebuilt for android-arm64-v8a-mt-debug/);
    });

    test('skips a platform-split cmake dependency that does not serve this target', () => {
        // A port's -ios sibling during an android build: it ships prebuilts, just not for here.
        const iosSibling = dep('gdal', 'cmake', { enabled: false, cmakeDir: tmpDir });

        const { nameOfCmakeDepends } = calculateDependencyParameters(app([iosSibling]))
            .getCmakeDependsPathAndName(target);

        expect(nameOfCmakeDepends).toEqual([]);
    });

    test('deduplicates a dependency reached through more than one path', () => {
        const zlib = dep('zlib', 'cmake', { enabled: true, cmakeDir: '/virtual/zlib/dist/prebuilt' });
        const tiff = dep('tiff', 'cmake', { enabled: true, cmakeDir: '/virtual/tiff/dist/prebuilt' });
        tiff.dependencies = [zlib];

        const { nameOfCmakeDepends } = calculateDependencyParameters(app([tiff, zlib]))
            .getCmakeDependsPathAndName(target);

        expect(nameOfCmakeDepends).toEqual(['tiff', 'zlib']);
    });
});

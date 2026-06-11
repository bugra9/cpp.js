import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
    orderByDependencies, getRebuildDeps, isCached, computeDependenciesStamp, cleanDepsCache,
} from '../src/utils/dependencyRebuild.js';
import { getOverrideKey } from '../src/utils/overrideDependency.js';

const dep = (name, extra = {}) => ({
    general: { name },
    package: { name: `@cpp.js/package-${name}`, nativeVersion: '1.0.0' },
    export: { libName: [name] },
    paths: { project: `/virtual/${name}` },
    allDependencies: [],
    ...extra,
});

describe('orderByDependencies', () => {
    test('orders a dependency before its dependent', () => {
        const proj = dep('proj');
        const gdal = dep('gdal', { allDependencies: [proj] });

        const result = orderByDependencies([gdal, proj]);

        expect(result.map((d) => d.general.name)).toEqual(['proj', 'gdal']);
    });

    test('keeps order for independent deps and ignores subdeps outside the set', () => {
        const outside = dep('outside');
        const a = dep('a', { allDependencies: [outside] });
        const b = dep('b');

        const result = orderByDependencies([a, b]);

        expect(result.map((d) => d.general.name)).toEqual(['a', 'b']);
    });

    test('tolerates cycles without infinite loop', () => {
        const a = dep('a');
        const b = dep('b', { allDependencies: [a] });
        a.allDependencies = [b];

        const result = orderByDependencies([a, b]);

        expect(result).toHaveLength(2);
    });
});

describe('getRebuildDeps', () => {
    const savedEnv = process.env.CPPJS_REBUILD_DEPS;

    afterEach(() => {
        if (savedEnv === undefined) delete process.env.CPPJS_REBUILD_DEPS;
        else process.env.CPPJS_REBUILD_DEPS = savedEnv;
    });

    test('returns deps flagged via rebuild or overrideBuild without a selector', () => {
        const flagged = dep('gdal', { rebuild: true });
        const overridden = dep('proj', { overrideBuild: { nativeVersion: '2.0.0' } });
        const plain = dep('zlib');

        const result = getRebuildDeps([flagged, overridden, plain], undefined);

        expect(result.map((d) => d.general.name).sort()).toEqual(['gdal', 'proj']);
    });

    test('selector "all" selects every dependency', () => {
        const deps = [dep('a'), dep('b')];

        expect(getRebuildDeps(deps, 'all')).toHaveLength(2);
        expect(getRebuildDeps(deps, true)).toHaveLength(2);
        expect(getRebuildDeps(deps, '1')).toHaveLength(2);
    });

    test('comma list matches general.name, package.name and alias.package', () => {
        const byGeneral = dep('gdal');
        const byPackage = dep('proj');
        const byAlias = dep('zlib', { general: { name: 'zlib', alias: { package: '@cpp.js/package-z' } } });
        const unmatched = dep('tiff');

        const result = getRebuildDeps(
            [byGeneral, byPackage, byAlias, unmatched],
            'gdal, @cpp.js/package-proj, @cpp.js/package-z',
        );

        expect(result.map((d) => d.general.name).sort()).toEqual(['gdal', 'proj', 'zlib']);
    });

    test('returns empty when nothing is flagged and no selector given', () => {
        expect(getRebuildDeps([dep('a')], undefined)).toEqual([]);
    });

    test('falls back to CPPJS_REBUILD_DEPS env when rebuildOption is undefined', () => {
        process.env.CPPJS_REBUILD_DEPS = 'gdal';

        expect(getRebuildDeps([dep('gdal'), dep('proj')], undefined).map((d) => d.general.name)).toEqual(['gdal']);
    });

    test('explicit empty rebuildOption disables the env fallback', () => {
        process.env.CPPJS_REBUILD_DEPS = 'gdal';

        expect(getRebuildDeps([dep('gdal')], '')).toEqual([]);
    });
});

describe('isCached / computeDependenciesStamp (fs-backed)', () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cppjs-rebuild-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    const writeMarker = (depsDir, key) => {
        fs.mkdirSync(depsDir, { recursive: true });
        fs.writeFileSync(`${depsDir}/.cppjs-rebuild.json`, JSON.stringify({ key }));
    };

    const writeDist = (depsDir, targetPath) => {
        fs.mkdirSync(`${depsDir}/dist/prebuilt/${targetPath}/lib`, { recursive: true });
        fs.writeFileSync(`${depsDir}/dist/prebuilt/CMakeLists.txt`, '');
    };

    describe('isCached', () => {
        const target = { path: 'android-arm64-v8a-mt-release', platform: 'android' };

        test('true when marker key matches and the dist is complete', () => {
            const d = dep('gdal');
            const depsDir = path.join(tmpDir, 'gdal');
            writeMarker(depsDir, 'k1');
            writeDist(depsDir, target.path);

            expect(isCached(depsDir, [target], 'k1', d, false)).toBe(true);
        });

        test('false when the marker key differs', () => {
            const d = dep('gdal');
            const depsDir = path.join(tmpDir, 'gdal');
            writeMarker(depsDir, 'other');
            writeDist(depsDir, target.path);

            expect(isCached(depsDir, [target], 'k1', d, false)).toBe(false);
        });

        test('false when a target lib dir is missing', () => {
            const d = dep('gdal');
            const depsDir = path.join(tmpDir, 'gdal');
            writeMarker(depsDir, 'k1');
            fs.mkdirSync(`${depsDir}/dist/prebuilt`, { recursive: true });
            fs.writeFileSync(`${depsDir}/dist/prebuilt/CMakeLists.txt`, '');

            expect(isCached(depsDir, [target], 'k1', d, false)).toBe(false);
        });

        test('false when dist CMakeLists.txt is missing even if libs exist', () => {
            const d = dep('gdal');
            const depsDir = path.join(tmpDir, 'gdal');
            writeMarker(depsDir, 'k1');
            fs.mkdirSync(`${depsDir}/dist/prebuilt/${target.path}/lib`, { recursive: true });

            expect(isCached(depsDir, [target], 'k1', d, false)).toBe(false);
        });

        test('iOS additionally requires the xcframework per libName', () => {
            const d = dep('gdal');
            const depsDir = path.join(tmpDir, 'gdal');
            writeMarker(depsDir, 'k1');
            writeDist(depsDir, target.path);

            expect(isCached(depsDir, [target], 'k1', d, true)).toBe(false);

            fs.mkdirSync(`${depsDir}/gdal.xcframework`, { recursive: true });
            expect(isCached(depsDir, [target], 'k1', d, true)).toBe(true);
        });
    });

    describe('cleanDepsCache', () => {
        test('removes the whole deps cache and returns removed names', () => {
            fs.mkdirSync(path.join(tmpDir, 'deps/z/dist'), { recursive: true });
            fs.mkdirSync(path.join(tmpDir, 'deps/gdal'), { recursive: true });
            fs.writeFileSync(path.join(tmpDir, 'deps/z.lock'), '1');

            const removed = cleanDepsCache(tmpDir);

            expect(removed.sort()).toEqual(['gdal', 'z']);
            expect(fs.existsSync(path.join(tmpDir, 'deps'))).toBe(false);
        });

        test('removes only the named deps with their locks, keeps the rest', () => {
            fs.mkdirSync(path.join(tmpDir, 'deps/z'), { recursive: true });
            fs.mkdirSync(path.join(tmpDir, 'deps/gdal'), { recursive: true });
            fs.writeFileSync(path.join(tmpDir, 'deps/z.lock'), '1');

            const removed = cleanDepsCache(tmpDir, ['z']);

            expect(removed).toEqual(['z']);
            expect(fs.existsSync(path.join(tmpDir, 'deps/z'))).toBe(false);
            expect(fs.existsSync(path.join(tmpDir, 'deps/z.lock'))).toBe(false);
            expect(fs.existsSync(path.join(tmpDir, 'deps/gdal'))).toBe(true);
        });

        test('returns empty when there is no deps cache', () => {
            expect(cleanDepsCache(path.join(tmpDir, 'missing'))).toEqual([]);
        });
    });

    describe('computeDependenciesStamp', () => {
        test('returns "none" without any marker', () => {
            expect(computeDependenciesStamp([dep('gdal')], tmpDir)).toBe('none');
        });

        test('returns "none" when the marker no longer matches the current override key', () => {
            const d = dep('gdal', { overrideBuild: { nativeVersion: '2.0.0' } });
            writeMarker(path.join(tmpDir, 'deps/gdal'), 'stale-key');

            expect(computeDependenciesStamp([d], tmpDir)).toBe('none');
        });

        test('hashes consumed markers and is independent of dependency order', () => {
            const a = dep('gdal', { rebuild: true });
            const b = dep('proj', { overrideBuild: { nativeVersion: '9.0.0' } });
            writeMarker(path.join(tmpDir, 'deps/gdal'), getOverrideKey(a));
            writeMarker(path.join(tmpDir, 'deps/proj'), getOverrideKey(b));

            const stamp = computeDependenciesStamp([a, b], tmpDir);

            expect(stamp).not.toBe('none');
            expect(computeDependenciesStamp([b, a], tmpDir)).toBe(stamp);
        });

        test('changes when a consumed dependency override changes', () => {
            const before = dep('gdal', { overrideBuild: { nativeVersion: '1.0.0' } });
            writeMarker(path.join(tmpDir, 'deps/gdal'), getOverrideKey(before));
            const stampBefore = computeDependenciesStamp([before], tmpDir);

            const after = { ...before, overrideBuild: { nativeVersion: '2.0.0' } };
            writeMarker(path.join(tmpDir, 'deps/gdal'), getOverrideKey(after));
            const stampAfter = computeDependenciesStamp([after], tmpDir);

            expect(stampBefore).not.toBe('none');
            expect(stampAfter).not.toBe('none');
            expect(stampAfter).not.toBe(stampBefore);
        });
    });
});

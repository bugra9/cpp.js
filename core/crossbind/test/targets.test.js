import { describe, test, expect } from 'vitest';
import { TARGETS, targetPathOf, filterTargetSpecs } from '../src/utils/targets.js';

describe('TARGETS', () => {
    test('covers every supported platform', () => {
        expect([...new Set(TARGETS.map((t) => t.platform))].sort()).toEqual(['android', 'ios', 'wasi', 'wasm']);
    });

    test('every entry carries the four fields the target path is built from', () => {
        for (const target of TARGETS) {
            expect(target.platform).toBeTruthy();
            expect(target.arch).toBeTruthy();
            expect(target.runtime).toBeTruthy();
            expect(target.buildType).toBeTruthy();
        }
    });

    test('target paths are unique per runtime environment', () => {
        const keys = TARGETS.map((t) => `${targetPathOf(t)}-${t.runtimeEnv ?? ''}`);
        expect(new Set(keys).size).toBe(keys.length);
    });

    test('wasi builds single-threaded wasm32 only', () => {
        const wasi = TARGETS.filter((t) => t.platform === 'wasi');
        expect(wasi.length).toBeGreaterThan(0);
        for (const target of wasi) {
            expect(target.arch).toBe('wasm32');
            expect(target.runtime).toBe('st');
        }
    });
});

describe('targetPathOf', () => {
    test('joins platform, arch, runtime and build type', () => {
        expect(targetPathOf({
            platform: 'wasi', arch: 'wasm32', runtime: 'st', buildType: 'release',
        })).toBe('wasi-wasm32-st-release');
    });
});

describe('filterTargetSpecs', () => {
    const target = {
        platform: 'wasm', arch: 'wasm32', runtime: 'mt', buildType: 'release', runtimeEnv: 'browser',
    };

    test('keeps specs whose declared fields all match', () => {
        const specs = filterTargetSpecs([
            { platform: 'wasm', specs: 'a' },
            { platform: 'wasm', runtime: 'mt', specs: 'b' },
            { runtimeEnv: 'browser', specs: 'c' },
        ], target);
        expect(specs).toEqual(['a', 'b', 'c']);
    });

    test('drops specs that disagree on any declared field', () => {
        const specs = filterTargetSpecs([
            { platform: 'wasi', specs: 'a' },
            { runtime: 'st', specs: 'b' },
            { runtimeEnv: 'node', specs: 'c' },
            { buildType: 'debug', specs: 'd' },
            { arch: 'wasm64', specs: 'e' },
        ], target);
        expect(specs).toEqual([]);
    });

    test('an undeclared field matches everything, and entries without specs are dropped', () => {
        expect(filterTargetSpecs([{ specs: 'always' }, { platform: 'wasm' }], target)).toEqual(['always']);
    });

    test('returns an empty list when nothing is declared', () => {
        expect(filterTargetSpecs(undefined, target)).toEqual([]);
        expect(filterTargetSpecs([], target)).toEqual([]);
    });
});

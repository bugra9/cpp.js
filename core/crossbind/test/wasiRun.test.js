import { describe, test, expect } from 'vitest';
import { mergeSpecs } from '../src/runtime/wasiRun.mjs';

// Shaped like the gdal recipe: the data and the bulk of the environment are declared once for
// every platform, and each platform adds its own knob on top.
const TARGET_SPECS = [
    {
        specs: {
            data: { 'share/gdal': 'gdal' },
            env: { GDAL_DATA: '_CROSSBIND_DATA_PATH_/gdal', CPL_LOG_ERRORS: 'ON' },
        },
    },
    { platform: 'wasm', specs: { env: { GDAL_NUM_THREADS: 'ALL_CPUS' } } },
    { platform: 'wasi', specs: { data: { 'share/extra': 'extra' }, env: { GDAL_CACHEMAX: '64' } } },
];

const WASI = {
    platform: 'wasi', arch: 'wasm32', runtime: 'st', buildType: 'release',
};
const WASM = {
    platform: 'wasm', arch: 'wasm32', runtime: 'st', buildType: 'release', runtimeEnv: 'node',
};

describe('mergeSpecs', () => {
    test('a platform block adds to the shared environment instead of replacing it', () => {
        expect(mergeSpecs(TARGET_SPECS, WASI).env).toEqual({
            GDAL_DATA: '_CROSSBIND_DATA_PATH_/gdal',
            CPL_LOG_ERRORS: 'ON',
            GDAL_CACHEMAX: '64',
        });
    });

    test('another platform gets its own knob and none of the wasi one', () => {
        expect(mergeSpecs(TARGET_SPECS, WASM).env).toEqual({
            GDAL_DATA: '_CROSSBIND_DATA_PATH_/gdal',
            CPL_LOG_ERRORS: 'ON',
            GDAL_NUM_THREADS: 'ALL_CPUS',
        });
    });

    test('data mounts merge the same way', () => {
        expect(mergeSpecs(TARGET_SPECS, WASI).data).toEqual({ 'share/gdal': 'gdal', 'share/extra': 'extra' });
        expect(mergeSpecs(TARGET_SPECS, WASM).data).toEqual({ 'share/gdal': 'gdal' });
    });

    test('a later block still wins on a key it redefines', () => {
        const specs = [
            { specs: { env: { GDAL_CACHEMAX: '64' } } },
            { platform: 'wasi', specs: { env: { GDAL_CACHEMAX: '128' } } },
        ];
        expect(mergeSpecs(specs, WASI).env.GDAL_CACHEMAX).toBe('128');
    });

    test('scalar fields keep last-wins, which is what the build relies on', () => {
        const specs = [
            { specs: { libType: 'static' } },
            { platform: 'android', specs: { libType: 'shared' } },
        ];
        const android = {
            platform: 'android', arch: 'arm64-v8a', runtime: 'mt', buildType: 'release',
        };
        expect(mergeSpecs(specs, android).libType).toBe('shared');
    });

    test('no declarations yields empty maps rather than undefined', () => {
        expect(mergeSpecs(undefined, WASI)).toMatchObject({ data: {}, env: {} });
        expect(mergeSpecs([], WASI)).toMatchObject({ data: {}, env: {} });
    });
});

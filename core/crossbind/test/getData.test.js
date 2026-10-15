import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const holder = { config: null };
vi.mock('../src/state/index.js', () => ({ default: { get config() { return holder.config; } } }));
vi.mock('../src/actions/target.js', () => ({
    getFilteredTargetSpec: (specs) => (specs ?? []).map((spec) => spec.specs),
    getBuildTargets: () => [],
}));

const { default: getData } = await import('../src/actions/getData.js');

const target = {
    path: 'wasm-wasm32-st-release', platform: 'wasm', arch: 'wasm32', runtime: 'st', runtimeEnv: 'browser',
};

let work;

// A PROJ platform package with the data spec of the port; only one built for the target has a prebuilt for it.
function projPackage(name, { servesTarget }) {
    const output = path.join(work, name, 'dist');
    if (servesTarget) fs.mkdirSync(path.join(output, 'prebuilt', target.path, 'share', 'proj'), { recursive: true });
    return {
        paths: { output },
        targetSpecs: [{ specs: { data: { 'share/proj': 'proj' } } }],
        functions: { isEnabled: () => servesTarget },
        dependencies: [],
    };
}

beforeEach(() => {
    work = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-getdata-'));
});

afterEach(() => {
    fs.rmSync(work, { recursive: true, force: true });
});

describe('getData', () => {
    // The port READMEs have an app import a port's wasm, Android and iOS packages together.
    test('takes data only from the packages that serve the target', () => {
        const wasm = projPackage('proj-wasm', { servesTarget: true });
        holder.config = {
            dependencies: [wasm, projPackage('proj-android', { servesTarget: false }), projPackage('proj-ios', { servesTarget: false })],
        };

        expect(getData('data', target)).toEqual({ [`${wasm.paths.output}/prebuilt/${target.path}/share/proj`]: 'proj' });
    });

    // @crossbind/port-openssl points CURL_CA_BUNDLE at its own bundle; an app that sets another has to keep it.
    test('keeps the app\'s env value over a dependency\'s, and a package\'s over its own dependency\'s', () => {
        const openssl = { targetSpecs: [{ specs: { env: { CURL_CA_BUNDLE: 'openssl', SSL_DIR: 'openssl' } } }], dependencies: [] };
        const curl = { targetSpecs: [{ specs: { env: { SSL_DIR: 'curl' } } }], dependencies: [openssl] };
        holder.config = { targetSpecs: [{ specs: { env: { CURL_CA_BUNDLE: 'app' } } }], dependencies: [curl] };

        expect(getData('env', target)).toEqual({ CURL_CA_BUNDLE: 'app', SSL_DIR: 'curl' });
    });

    test('adds up flags, the app\'s first', () => {
        const port = { targetSpecs: [{ specs: { binary: { emccFlags: ['-sPORT=1'] } } }], dependencies: [] };
        holder.config = { targetSpecs: [{ specs: { binary: { emccFlags: ['-sAPP=1'] } } }], dependencies: [port] };

        expect(getData('binary', target)).toEqual({ emccFlags: ['-sAPP=1', '-sPORT=1'] });
    });
});

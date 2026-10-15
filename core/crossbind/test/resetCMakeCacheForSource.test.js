import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { state } = vi.hoisted(() => ({ state: { config: {} } }));

vi.mock('../src/state/index.js', () => ({ default: state }));

const { default: resetCMakeCacheForSource } = await import('../src/utils/resetCMakeCacheForSource.js');

const WASM = { platform: 'wasm' };
const DARWIN = { platform: 'darwin' };

describe('resetCMakeCacheForSource', () => {
    let build;

    const configureFrom = (source) => {
        fs.mkdirSync(path.join(build, 'CMakeFiles'), { recursive: true });
        fs.writeFileSync(path.join(build, 'CMakeCache.txt'), `CMAKE_HOME_DIRECTORY:INTERNAL=${source}\n`);
        fs.writeFileSync(path.join(build, 'libapp.a'), '');
    };
    const hasCache = () => fs.existsSync(path.join(build, 'CMakeCache.txt')) && fs.existsSync(path.join(build, 'CMakeFiles'));

    beforeEach(() => {
        build = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-cmake-cache-'));
        state.config = { paths: { base: '/repo' }, system: {} };
    });

    afterEach(() => {
        fs.rmSync(build, { recursive: true, force: true });
    });

    // A container has the project at /tmp/crossbind/live, which is the path its CMake recorded.
    test('keeps a cache a container configured from the same source', () => {
        configureFrom('/tmp/crossbind/live/node_modules/crossbind/src/assets/cmake');

        resetCMakeCacheForSource(build, '/repo/node_modules/crossbind/src/assets/cmake', WASM);

        expect(hasCache()).toBe(true);
    });

    test('keeps a cache this machine configured from the same source', () => {
        configureFrom('/repo/node_modules/@crossbind/core-embind-napi/cpp');

        resetCMakeCacheForSource(build, '/repo/node_modules/@crossbind/core-embind-napi/cpp/', DARWIN);

        expect(hasCache()).toBe(true);
    });

    test('compares Windows paths of the LOCAL runner by their separators', () => {
        state.config.system = { RUNNER: 'LOCAL' };
        configureFrom('C:/repo/cmake');

        resetCMakeCacheForSource(build, 'C:\\repo\\cmake', WASM);

        expect(hasCache()).toBe(true);
    });

    // An upgrade moves the bundled CMakeLists (node_modules/.pnpm/crossbind@<version>/...), which CMake refuses.
    test('starts afresh a cache configured from another source and keeps what the build made', () => {
        configureFrom('/tmp/crossbind/live/node_modules/.pnpm/crossbind@2.0.0-beta.53/node_modules/crossbind/src/assets/cmake');

        resetCMakeCacheForSource(build, '/repo/node_modules/.pnpm/crossbind@2.0.0-beta.63/node_modules/crossbind/src/assets/cmake', WASM);

        expect(hasCache()).toBe(false);
        expect(fs.existsSync(path.join(build, 'libapp.a'))).toBe(true);
    });

    test('leaves a tree without a cache alone', () => {
        resetCMakeCacheForSource(build, '/repo/cmake', WASM);

        expect(fs.readdirSync(build)).toEqual([]);
    });
});

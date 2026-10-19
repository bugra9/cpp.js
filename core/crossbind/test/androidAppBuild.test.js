import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// What an Android app's build asks of the steps it shares with React Native's Android build.
vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }));

const holder = { config: {} };
vi.mock('../src/state/index.js', () => ({
    default: {
        get config() {
            return holder.config;
        },
        targets: [],
    },
}));

const target = (runtimeEnv) => ({
    platform: 'android', arch: 'x86_64', runtime: 'mt', buildType: 'release', path: 'android-x86_64-mt-release', releasePath: 'android-x86_64-mt-release', runtimeEnv,
});

let work;

beforeEach(() => {
    work = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-android-app-'));
    holder.config = {
        general: { name: 'demo' },
        paths: {
            base: work, build: path.join(work, 'build'), project: work, cli: work,
        },
        system: { RUNNER: 'DOCKER_RUN' },
        dependencies: [],
        targetSpecs: [],
        dependencyParameters: {
            headerPathWithDepends: [],
            getCmakeDependsPathAndName: () => ({ pathsOfCmakeDepends: [], nameOfCmakeDepends: [] }),
            getCmakeDepends: () => [],
        },
    };
});

afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(work, { recursive: true, force: true });
});

describe('an Android app build', () => {
    test("configures CMake with the NDK's toolchain, and builds without it", async () => {
        vi.resetModules();
        const { execFileSync } = await import('node:child_process');
        execFileSync.mockReset();
        execFileSync.mockReturnValue('');
        const run = (await import('../src/actions/run.js')).default;

        run(null, ['cmake', '/src'], null, target('app'));
        const configure = execFileSync.mock.calls.at(-1)[1];
        run(null, ['cmake', '--build', '.', '-j', '4'], null, target('app'));
        const build = execFileSync.mock.calls.at(-1)[1];

        expect(configure).toContain('-DANDROID_ABI=x86_64');
        expect(build.slice(build.indexOf('cmake'))).toEqual(['cmake', '--build', '.', '-j', '4']);
    });

    test("builds the project's own code as archives an app links, where React Native takes a shared library", async () => {
        const { default: getCmakeParameters } = await import('../src/actions/getCmakeParameters.js');

        expect(getCmakeParameters(target('app'))).toContain('-DBUILD_TYPE=STATIC');
        expect(getCmakeParameters(target(undefined))).toContain('-DBUILD_TYPE=SHARED');
    });

    test("links a package's shared library on Android, its archive where it has one, and archives alone elsewhere", async () => {
        const { default: getDependLibs } = await import('../src/actions/getDependLibs.js');
        const lib = (dir, file) => {
            fs.mkdirSync(path.join(work, 'dep', 'prebuilt', dir, 'lib'), { recursive: true });
            fs.writeFileSync(path.join(work, 'dep', 'prebuilt', dir, 'lib', file), '');
            return path.join(work, 'dep', 'prebuilt', dir, 'lib', file);
        };
        const dependency = { export: { libName: ['dep'] }, paths: { output: path.join(work, 'dep'), project: work }, targetSpecs: [] };
        holder.config.dependencyParameters.getCmakeDepends = () => [dependency];
        const shared = lib('android-x86_64-mt-release', 'libdep.so');
        lib('linux-x64-mt-release', 'libdep.so');

        expect(getDependLibs(target('app'))).toEqual([shared]);
        expect(getDependLibs({ ...target('app'), platform: 'linux', path: 'linux-x64-mt-release', releasePath: 'linux-x64-mt-release' })).toEqual([]);
        const archive = lib('android-x86_64-mt-release', 'libdep.a');
        expect(getDependLibs(target('app'))).toEqual([archive]);
    });
});

import { describe, test, expect } from 'vitest';
import {
    TARGETS, OPT_IN_PLATFORMS, RUNTIME_ENVS, runtimeEnvsOf, selectRuntimeEnvs, targetPathOf, filterTargetSpecs, nodeAddonNamesOf,
    nativeCommandNamesOf, wasiNamesOf, appNamesOf,
} from '../src/utils/targets.js';

describe('TARGETS', () => {
    test('covers every supported platform', () => {
        expect([...new Set(TARGETS.map((t) => t.platform))].sort()).toEqual(['android', 'darwin', 'ios', 'linux', 'linuxmusl', 'wasi', 'wasm', 'win32']);
    });

    test.each(['darwin', 'linux', 'linuxmusl', 'win32'])('%s builds Node-API addons for x64 and arm64', (platform) => {
        const desktop = TARGETS.filter((t) => t.platform === platform && t.runtimeEnv === 'node');
        expect(desktop.map((t) => `${t.arch}-${t.buildType}`).sort()).toEqual(['arm64-debug', 'arm64-release', 'x64-debug', 'x64-release']);
        for (const target of desktop) {
            expect(target.runtime).toBe('mt');
        }
    });

    // Same paths, so an executable links the very archives the addon of its platform links.
    test.each(['darwin', 'linux', 'linuxmusl', 'win32'])('%s builds native executables from the addon targets', (platform) => {
        const pathsOf = (runtimeEnv) => TARGETS
            .filter((t) => t.platform === platform && t.runtimeEnv === runtimeEnv).map(targetPathOf).sort();
        expect(pathsOf('native')).toEqual(pathsOf('node'));
        expect(pathsOf('native')).toHaveLength(4);
    });

    test('macOS, glibc Linux and Windows build app hosts from the addon targets, and iOS and Android from their SDK and ABI targets', () => {
        const app = TARGETS.filter((t) => t.runtimeEnv === 'app');
        const hosts = TARGETS.filter((t) => (['darwin', 'linux', 'win32'].includes(t.platform) && t.runtimeEnv === 'node')
            || (['ios', 'android'].includes(t.platform) && !t.runtimeEnv));
        expect(app.map(targetPathOf).sort()).toEqual(hosts.map(targetPathOf).sort());
        expect([...new Set(app.map((t) => t.platform))].sort()).toEqual(['android', 'darwin', 'ios', 'linux', 'win32']);
    });

    test('Node-API addon platforms build only when named, so a plain build keeps its output', () => {
        const platforms = new Set(TARGETS.map((t) => t.platform));
        expect(OPT_IN_PLATFORMS).toEqual(['darwin', 'linux', 'linuxmusl', 'win32']);
        for (const platform of OPT_IN_PLATFORMS) {
            expect(platforms.has(platform)).toBe(true);
        }
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

    // The runtime environment names the binary a build makes: a command, or an HTTP component, of the same archives.
    test('a wasi build makes a command or an http component', () => {
        const pathsOf = (runtimeEnv) => TARGETS
            .filter((t) => t.platform === 'wasi' && t.runtimeEnv === runtimeEnv).map(targetPathOf).sort();
        expect(pathsOf('wasi')).toEqual(['wasi-wasm32-st-debug', 'wasi-wasm32-st-release']);
        expect(pathsOf('http')).toEqual(pathsOf('wasi'));
        expect(TARGETS.filter((t) => t.platform === 'wasi').every((t) => ['wasi', 'http'].includes(t.runtimeEnv))).toBe(true);
    });
});

describe('runtime environments', () => {
    test('RUNTIME_ENVS lists every binary a build can make', () => {
        expect([...RUNTIME_ENVS].sort()).toEqual(['app', 'browser', 'edge', 'http', 'native', 'node', 'wasi']);
    });

    test('selectRuntimeEnvs takes -e first, then target.runtimeEnv, then nothing', () => {
        expect(selectRuntimeEnvs(['node', 'wasi'], 'browser')).toEqual(['node', 'wasi']);
        expect(selectRuntimeEnvs(undefined, 'edge')).toEqual(['edge']);
        expect(selectRuntimeEnvs(undefined, undefined)).toEqual([]);
    });

    test('runtimeEnvsOf lists the binaries of one platform', () => {
        expect(runtimeEnvsOf('wasm').sort()).toEqual(['browser', 'edge', 'node']);
        expect(runtimeEnvsOf('wasi')).toEqual(['wasi', 'http']);
        expect(runtimeEnvsOf('linux')).toEqual(['node', 'native', 'app']);
        expect(runtimeEnvsOf('linuxmusl')).toEqual(['node', 'native']);
        expect(runtimeEnvsOf('darwin')).toEqual(['node', 'native', 'app']);
        expect(runtimeEnvsOf('android')).toEqual(['app']);
        expect(runtimeEnvsOf('ios')).toEqual(['app']);
    });
});

describe('wasiNamesOf', () => {
    const wasi = (runtimeEnv) => TARGETS.find((t) => t.platform === 'wasi' && t.runtimeEnv === runtimeEnv && t.buildType === 'release');

    test('names the command after the project and target, and the http component apart from it', () => {
        expect(wasiNamesOf(wasi('wasi'), 'demo')).toEqual({ wasmName: 'demo-wasi-wasm32-st-release.wasm' });
        expect(wasiNamesOf(wasi('http'), 'demo')).toEqual({ wasmName: 'demo-wasi-wasm32-st-release.http.wasm' });
    });
});

describe('appNamesOf', () => {
    const app = (arch, buildType, platform = 'darwin') => ({
        platform, arch, runtime: 'mt', buildType, runtimeEnv: 'app',
    });

    test('names the app after the project, platform and arch, and the page runtime after the build type alone', () => {
        expect(appNamesOf(app('arm64', 'release'), 'demo')).toEqual({ appName: 'demo.darwin-arm64.app', appJsName: 'demo.app.js' });
        expect(appNamesOf(app('x64', 'debug'), 'demo')).toEqual({ appName: 'demo.darwin-x64.debug.app', appJsName: 'demo.app.debug.js' });
    });

    test('names a Linux app as a directory, without the bundle suffix', () => {
        expect(appNamesOf(app('x64', 'release', 'linux'), 'demo')).toEqual({ appName: 'demo.linux-x64', appJsName: 'demo.app.js' });
        expect(appNamesOf(app('arm64', 'debug', 'linux'), 'demo')).toEqual({ appName: 'demo.linux-arm64.debug', appJsName: 'demo.app.debug.js' });
    });

    test('names what an iOS SDK brings to the app after the SDK', () => {
        expect(appNamesOf(app('iphonesimulator', 'debug', 'ios'), 'demo')).toEqual({
            appName: 'demo.ios-iphonesimulator.debug', appJsName: 'demo.app.debug.js',
        });
    });
});

describe('nativeCommandNamesOf', () => {
    const native = (platform, buildType) => ({
        platform, arch: 'x64', runtime: 'mt', buildType, runtimeEnv: 'native',
    });

    test('names the executable after the project, platform and arch', () => {
        expect(nativeCommandNamesOf(native('linux', 'release'), 'demo')).toEqual({ commandName: 'demo.linux-x64' });
    });

    test('gives Windows executables their extension and keeps debug builds apart', () => {
        expect(nativeCommandNamesOf(native('win32', 'release'), 'demo').commandName).toBe('demo.win32-x64.exe');
        expect(nativeCommandNamesOf(native('linuxmusl', 'debug'), 'demo').commandName).toBe('demo.linuxmusl-x64.debug');
    });
});

describe('targetPathOf', () => {
    test('joins platform, arch, runtime and build type', () => {
        expect(targetPathOf({
            platform: 'wasi', arch: 'wasm32', runtime: 'st', buildType: 'release',
        })).toBe('wasi-wasm32-st-release');
    });
});

describe('nodeAddonNamesOf', () => {
    const darwin = (arch, buildType) => TARGETS.find((t) => (
        t.platform === 'darwin' && t.arch === arch && t.buildType === buildType));

    test('names one binary per platform and arch next to one loader per build type', () => {
        expect(nodeAddonNamesOf(darwin('arm64', 'release'), 'matrix')).toEqual({
            addonPattern: 'matrix.{platform}-{arch}.node',
            addonName: 'matrix.darwin-arm64.node',
            jsName: 'matrix.native.cjs',
        });
    });

    test('keeps debug output apart from release output', () => {
        expect(nodeAddonNamesOf(darwin('x64', 'debug'), 'matrix')).toEqual({
            addonPattern: 'matrix.{platform}-{arch}.debug.node',
            addonName: 'matrix.darwin-x64.debug.node',
            jsName: 'matrix.native.debug.cjs',
        });
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

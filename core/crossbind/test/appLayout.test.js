import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, test, vi } from 'vitest';

const state = { config: { general: { name: 'demo' }, target: {} }, targets: [] };
vi.mock('../src/state/index.js', () => ({ default: state }));
// The emulator a dev session runs an Android app on.
vi.mock('../src/actions/androidDevice.js', () => ({ attachedDevice: () => ({ serial: 'emulator-5554', abi: 'x86_64' }) }));
// tar, which archives a Linux app.
const spawnSync = vi.fn(() => ({ status: 0, stdout: '', stderr: '' }));
vi.mock('node:child_process', async (importOriginal) => ({ ...await importOriginal(), spawnSync }));
// The windows image, which zips a Windows app.
const run = vi.fn();
vi.mock('../src/actions/run.js', () => ({ default: run }));

const { appLayout, appOutputName, appTargetParams, publishApp } = await import('../src/actions/buildApp.js');

describe('an app on disk', () => {
    test('keeps its executable and its files in a bundle on macOS, and in a directory on Linux and Windows', () => {
        expect(appLayout({ platform: 'darwin', arch: 'arm64' })).toEqual({ executable: 'Contents/MacOS/demo', resources: 'Contents/Resources' });
        expect(appLayout({ platform: 'linux', arch: 'x64' })).toEqual({ executable: 'demo', resources: 'resources' });
        expect(appLayout({ platform: 'win32', arch: 'x64' })).toEqual({ executable: 'demo.exe', resources: 'resources' });
    });

    test('keeps an iOS app\'s files in the app folder of its Xcode project, which links the executable', () => {
        expect(appLayout({ platform: 'ios', arch: 'iphonesimulator' })).toEqual({ executable: null, resources: 'app' });
    });

    test('keeps an Android app\'s files in the assets of its Gradle project', () => {
        expect(appLayout({ platform: 'android', arch: 'x86_64' })).toEqual({ executable: null, resources: 'app/src/main/assets/app' });
    });

    test('is named beside the page as a bundle, a directory after its platform and arch, or one Xcode or Gradle project', () => {
        expect(appOutputName({ platform: 'darwin', arch: 'arm64' })).toBe('demo.app');
        expect(appOutputName({ platform: 'linux', arch: 'x64' })).toBe('demo-linux-x64');
        expect(appOutputName({ platform: 'win32', arch: 'arm64' })).toBe('demo-win32-arm64');
        expect(appOutputName({ platform: 'ios', arch: 'iphoneos' })).toBe('demo-ios');
        expect(appOutputName({ platform: 'ios', arch: 'iphonesimulator' })).toBe('demo-ios');
        expect(appOutputName({ platform: 'android', arch: 'arm64-v8a' })).toBe('demo-android');
        expect(appOutputName({ platform: 'android', arch: 'x86_64' })).toBe('demo-android');
    });
});

describe('the app a bundler builds', () => {
    test('is this machine\'s desktop app without CROSSBIND_APP_PLATFORM', () => {
        expect(appTargetParams({}, {})).toMatchObject({ platform: [process.platform], arch: [process.arch], runtimeEnv: ['app'] });
    });

    test('refuses a platform no app builds for', () => {
        expect(() => appTargetParams({}, { CROSSBIND_APP_PLATFORM: 'tvos' })).toThrow('CROSSBIND_APP_PLATFORM=tvos');
    });

    test.runIf(process.platform === 'darwin')('is an iOS app for both SDKs, or for the Simulator alone during development', () => {
        expect(appTargetParams({}, { CROSSBIND_APP_PLATFORM: 'ios' })).toMatchObject({ platform: ['ios'], arch: ['iphoneos', 'iphonesimulator'] });
        expect(appTargetParams({ dev: true }, { CROSSBIND_APP_PLATFORM: 'ios' })).toMatchObject({ arch: ['iphonesimulator'] });
    });

    test('is an Android app for both ABIs, or for the attached device\'s alone during development', () => {
        expect(appTargetParams({}, { CROSSBIND_APP_PLATFORM: 'android' })).toMatchObject({ platform: ['android'], arch: ['arm64-v8a', 'x86_64'] });
        expect(appTargetParams({ dev: true }, { CROSSBIND_APP_PLATFORM: 'android' })).toMatchObject({ arch: ['x86_64'] });
    });

    test.runIf(process.platform !== 'darwin')('is no iOS app off macOS', () => {
        expect(() => appTargetParams({}, { CROSSBIND_APP_PLATFORM: 'ios' })).toThrow('iOS apps build on macOS');
    });

    test('is a Linux app for both arches, which builds in Docker on any machine', () => {
        expect(appTargetParams({}, { CROSSBIND_APP_PLATFORM: 'linux' })).toMatchObject({ platform: ['linux'], arch: ['x64', 'arm64'] });
    });

    test.runIf(process.platform !== 'linux')('opens no Linux app for development off Linux', () => {
        expect(() => appTargetParams({ dev: true }, { CROSSBIND_APP_PLATFORM: 'linux' })).toThrow('a Linux app runs on Linux');
    });

    test('is a Windows app for both arches, which builds in Docker on any machine', () => {
        expect(appTargetParams({}, { CROSSBIND_APP_PLATFORM: 'windows' })).toMatchObject({ platform: ['win32'], arch: ['x64', 'arm64'] });
    });

    test.runIf(process.platform !== 'win32')('opens no Windows app for development off Windows', () => {
        expect(() => appTargetParams({ dev: true }, { CROSSBIND_APP_PLATFORM: 'windows' })).toThrow('a Windows app runs on Windows');
    });

    test.runIf(process.platform === 'darwin')("is this Mac's app for macOS", () => {
        expect(appTargetParams({}, { CROSSBIND_APP_PLATFORM: 'macos' })).toMatchObject({ platform: ['darwin'], arch: [process.arch] });
    });

    test.runIf(process.platform !== 'darwin')('is no macOS app off macOS', () => {
        expect(() => appTargetParams({}, { CROSSBIND_APP_PLATFORM: 'macos' })).toThrow('macOS apps build on macOS');
    });

    test("is no Android, Linux or Windows app under a runner without crossbind's images, before any step runs", () => {
        state.config.system = { RUNNER: 'LOCAL' };
        try {
            expect(() => appTargetParams({}, { CROSSBIND_APP_PLATFORM: 'android' }))
                .toThrow("an Android app builds in crossbind's android-app image, which RUNNER=LOCAL does not use");
            expect(() => appTargetParams({}, { CROSSBIND_APP_PLATFORM: 'linux' }))
                .toThrow("a Linux app builds in crossbind's linux image, which RUNNER=LOCAL does not use");
            expect(() => appTargetParams({}, { CROSSBIND_APP_PLATFORM: 'windows' }))
                .toThrow("a Windows app builds in crossbind's windows image, which RUNNER=LOCAL does not use");
        } finally {
            delete state.config.system;
        }
    });
});

describe("a desktop app's page", () => {
    test('is the bundle beside the app, without the apps built there and the files that package them', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-page-'));
        const dist = path.join(root, 'dist');
        const arm64 = { platform: 'linux', arch: 'arm64', runtimeEnv: 'app', appName: 'demo.linux-arm64' };
        state.config.paths = { build: path.join(root, 'build') };
        state.targets = [
            arm64, { platform: 'linux', arch: 'x64', runtimeEnv: 'app' }, { platform: 'android', arch: 'x86_64', runtimeEnv: 'app' },
            { platform: 'win32', arch: 'x64', runtimeEnv: 'app' },
        ];
        fs.mkdirSync(path.join(root, 'build', arm64.appName, 'resources'), { recursive: true });
        ['index.html', 'crossbind.js', 'assets/index.js', 'demo-linux-x64/demo', 'demo-linux-x64.tar.gz', 'demo-android.apk', 'demo-android.aab',
            'demo-win32-x64.zip'].forEach((file) => {
            fs.mkdirSync(path.dirname(path.join(dist, file)), { recursive: true });
            fs.writeFileSync(path.join(dist, file), file);
        });
        try {
            publishApp(arm64, { to: path.join(dist, 'demo-linux-arm64'), page: dist });
            // An app given a name of its own leaves itself out too.
            publishApp(arm64, { to: path.join(dist, 'renamed'), page: dist });

            ['demo-linux-arm64', 'renamed'].forEach((app) => {
                expect(fs.readdirSync(path.join(dist, app, 'resources', 'page')).sort()).toEqual(['assets', 'crossbind.js', 'index.html']);
            });
            expect(spawnSync).toHaveBeenCalledWith('tar', expect.arrayContaining([`${path.join(dist, 'demo-linux-arm64')}.tar.gz`]), expect.anything());
        } finally {
            state.targets = [];
            fs.rmSync(root, { recursive: true, force: true });
        }
    });

    test('is in a Windows app, which ships as a zip made beside it in the windows image', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-page-'));
        const dist = path.join(root, 'dist');
        const x64 = { platform: 'win32', arch: 'x64', runtimeEnv: 'app', appName: 'demo.win32-x64' };
        state.config.paths = { base: root, build: path.join(root, 'build') };
        state.targets = [x64];
        fs.mkdirSync(path.join(root, 'build', x64.appName, 'resources'), { recursive: true });
        fs.mkdirSync(dist, { recursive: true });
        fs.writeFileSync(path.join(dist, 'index.html'), 'index.html');
        try {
            publishApp(x64, { to: path.join(dist, 'demo-win32-x64'), page: dist });

            expect(fs.readdirSync(path.join(dist, 'demo-win32-x64', 'resources', 'page'))).toEqual(['index.html']);
            expect(run).toHaveBeenCalledWith(null, ['zip', '-q', '-r', '-X', 'demo-win32-x64.zip', 'demo-win32-x64'], null, x64, { workdir: dist });
        } finally {
            state.targets = [];
            fs.rmSync(root, { recursive: true, force: true });
        }
    });

    test("is refused for a Windows app outside the project's base, which is all the windows image sees", () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-page-'));
        const base = path.join(root, 'project');
        const elsewhere = path.join(root, 'elsewhere', 'demo-win32-x64');
        const x64 = { platform: 'win32', arch: 'x64', runtimeEnv: 'app', appName: 'demo.win32-x64' };
        state.config.paths = { base, build: path.join(base, 'build') };
        fs.mkdirSync(path.join(base, 'build', x64.appName), { recursive: true });
        try {
            expect(() => publishApp(x64, { to: elsewhere })).toThrow(`the Windows app ${elsewhere} is outside ${base}`);
        } finally {
            fs.rmSync(root, { recursive: true, force: true });
        }
    });
});

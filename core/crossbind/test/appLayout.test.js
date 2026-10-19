import { describe, expect, test, vi } from 'vitest';

const state = { config: { general: { name: 'demo' }, target: {} }, targets: [] };
vi.mock('../src/state/index.js', () => ({ default: state }));
// The emulator a dev session runs an Android app on.
vi.mock('../src/actions/androidDevice.js', () => ({ attachedDevice: () => ({ serial: 'emulator-5554', abi: 'x86_64' }) }));

const { appLayout, appOutputName, appTargetParams } = await import('../src/actions/buildApp.js');

describe('an app on disk', () => {
    test('keeps its executable and its files in a bundle on macOS, and in a directory on Linux', () => {
        expect(appLayout({ platform: 'darwin', arch: 'arm64' })).toEqual({ executable: 'Contents/MacOS/demo', resources: 'Contents/Resources' });
        expect(appLayout({ platform: 'linux', arch: 'x64' })).toEqual({ executable: 'demo', resources: 'resources' });
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
        expect(() => appTargetParams({}, { CROSSBIND_APP_PLATFORM: 'windows' })).toThrow('CROSSBIND_APP_PLATFORM=windows');
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
});

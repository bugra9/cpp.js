import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, test, vi } from 'vitest';

const state = { config: { general: { name: 'demo-app' }, target: {}, app: {}, paths: {} }, targets: [] };
vi.mock('../src/state/index.js', () => ({ default: state }));

const { default: writeGradleProject } = await import('../src/actions/gradleProject.js');
const { publishApp } = await import('../src/actions/buildApp.js');

function part(root, arch) {
    const dir = path.join(root, `demo-app.android-${arch}`);
    fs.mkdirSync(path.join(dir, 'lib'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'app', 'page'), { recursive: true });
    ['libcrossbind_app.so', 'libjsi.so', 'libc++_shared.so'].forEach((lib) => fs.writeFileSync(path.join(dir, 'lib', lib), `${arch} ${lib}`));
    fs.writeFileSync(path.join(dir, 'app', 'host.hbc'), 'bytecode');
    return { arch, dir };
}

describe("an Android app's Gradle project", () => {
    test("packages each ABI's libraries and the app's files, under the app's id and version", () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-gradle-'));
        const to = path.join(root, 'with space', 'demo-app-android');

        writeGradleProject(to, {
            parts: [part(root, 'arm64-v8a'), part(root, 'x86_64')], id: 'com.example.demo', version: { name: '1.2.3-beta.1', code: 1002003 },
        });

        const main = path.join(to, 'app', 'src', 'main');
        const gradle = fs.readFileSync(path.join(to, 'app', 'build.gradle'), 'utf8');
        expect(fs.readFileSync(path.join(main, 'jniLibs', 'x86_64', 'libcrossbind_app.so'), 'utf8')).toBe('x86_64 libcrossbind_app.so');
        expect(fs.readFileSync(path.join(main, 'jniLibs', 'arm64-v8a', 'libc++_shared.so'), 'utf8')).toBe('arm64-v8a libc++_shared.so');
        expect(fs.readFileSync(path.join(main, 'assets', 'app', 'host.hbc'), 'utf8')).toBe('bytecode');
        expect(fs.existsSync(path.join(main, 'java', 'dev', 'crossbind', 'app', 'CrossbindActivity.java'))).toBe(true);
        expect(gradle).toContain("applicationId 'com.example.demo'");
        expect(gradle).toContain('versionCode 1002003');
        expect(gradle).toContain("versionName '1.2.3-beta.1'");
        expect(gradle).toContain("abiFilters 'arm64-v8a', 'x86_64'");
        expect(gradle).toContain("manifestPlaceholders = [appName: 'demo-app']");
        expect(gradle).toMatch(/implementation 'com\.facebook\.hermes:hermes-android:\d+\.\d+\.\d+'/);
        // Android's default pattern would leave out the page's _app and .well-known directories.
        expect(gradle).toContain("ignoreAssetsPattern = '!.svn:!.git:!.ds_store:!*.scc:!CVS:!thumbs.db:!picasa.ini:!*~'");
        if (process.platform !== 'win32') expect(fs.statSync(path.join(to, 'gradlew')).mode & 0o111).not.toBe(0);
        fs.rmSync(root, { recursive: true, force: true });
    });

    test('is not written from no part at all', () => {
        expect(() => writeGradleProject(path.join(os.tmpdir(), 'crossbind-none'), { parts: [], id: 'a.b', version: { name: '1', code: 1 } }))
            .toThrow('no part of the Android app demo-app is built');
    });

    test("takes only an Android application id, which it makes from the project's name without app.id", () => {
        const android = { platform: 'android', arch: 'x86_64', buildType: 'release' };
        const to = path.join(os.tmpdir(), 'crossbind-android-id');
        state.config.app = { id: 'com.example.my-app' };
        expect(() => publishApp(android, { to })).toThrow('"com.example.my-app" (app.id, else made from the project\'s name) is no Android application id');
        state.config.app = {};
        // dev.crossbind.demo_app passes, and only the missing parts stop the project.
        expect(() => publishApp(android, { to })).toThrow('no part of the Android app demo-app is built');
        state.config.general.name = '3d-viewer';
        expect(() => publishApp(android, { to })).toThrow('"dev.crossbind.3d_viewer" (app.id, else made');
        state.config.general.name = 'demo-app';
    });
});

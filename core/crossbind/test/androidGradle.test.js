import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// docker answers as it would; each Gradle run leaves the outputs its tasks make.
const calls = [];
const spawnSync = vi.fn((program, args) => {
    calls.push(args);
    const tasks = args.slice(args.indexOf('gradle'));
    const project = args[args.indexOf('-w') + 1]?.replace('/tmp/crossbind/live', base);
    const write = (file) => {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, file);
    };
    if (tasks.includes('assembleRelease')) write(`${project}/app/build/outputs/apk/release/app-release.apk`);
    if (tasks.includes('bundleRelease')) write(`${project}/app/build/outputs/bundle/release/app-release.aab`);
    return { status: 0, stdout: '', stderr: '' };
});
vi.mock('node:child_process', async (importOriginal) => ({ ...await importOriginal(), spawnSync }));
vi.mock('../src/utils/pullDockerImage.js', () => ({ default: vi.fn(), getDockerImage: () => 'android-app-image' }));
vi.mock('../src/utils/getOsUserAndGroupId.js', () => ({ default: () => '1000:1000' }));

let base;
let home;
const state = { config: { paths: {} } };
vi.mock('../src/state/index.js', () => ({ default: state }));
vi.mock('node:os', async (importOriginal) => {
    const real = await importOriginal();
    return { ...real, default: { ...real, homedir: () => home } };
});

const { SIGNING, buildApk, packageAndroidRelease, releaseSigning } = await import('../src/actions/androidGradle.js');
const { getContentHash } = await import('../src/utils/hash.js');

let keystore;

beforeEach(() => {
    base = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-gradle-base-'));
    home = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-gradle-home-'));
    keystore = path.join(home, 'upload.jks');
    fs.writeFileSync(keystore, 'key');
    state.config.paths.base = base;
    state.config.paths.project = path.join(base, 'apps', 'demo');
    calls.length = 0;
    Object.values(SIGNING).forEach((name) => vi.stubEnv(name, ''));
});

afterEach(() => {
    vi.unstubAllEnvs();
    fs.rmSync(base, { recursive: true, force: true });
    fs.rmSync(home, { recursive: true, force: true });
});

const sign = () => {
    vi.stubEnv(SIGNING.keystore, keystore);
    vi.stubEnv(SIGNING.alias, 'upload');
    vi.stubEnv(SIGNING.password, 'secret-4711');
};

describe("an Android release's upload key", () => {
    test('is none without a keystore, and the debug key signs', () => {
        expect(releaseSigning({})).toBeNull();
    });

    test('is all of the keystore, its alias and its password, or an error naming what is missing', () => {
        expect(() => releaseSigning({ [SIGNING.alias]: 'upload' })).toThrow(`${SIGNING.alias} is set without ${SIGNING.keystore}`);
        expect(() => releaseSigning({ [SIGNING.keystore]: keystore })).toThrow(`${SIGNING.alias} and ${SIGNING.password} are not`);
        expect(() => releaseSigning({ [SIGNING.keystore]: path.join(home, 'none.jks'), [SIGNING.alias]: 'a', [SIGNING.password]: 'p' }))
            .toThrow('which is no file');
        expect(releaseSigning({ [SIGNING.keystore]: keystore, [SIGNING.alias]: 'a', [SIGNING.password]: 'p', [SIGNING.keyPassword]: 'k' }))
            .toEqual({ file: keystore, names: [SIGNING.alias, SIGNING.password, SIGNING.keyPassword] });
    });
});

describe('an Android release packaged in the android-app image', () => {
    test('signed with the upload key is an APK and a bundle, and no password reaches the command line', () => {
        sign();
        const project = path.join(base, 'dist', 'demo-android');

        packageAndroidRelease(project);

        const [args] = calls;
        expect(args.slice(0, 2)).toEqual(['run', '--rm']);
        expect(args).toEqual(expect.arrayContaining(['--network', 'none', '--platform', 'linux/amd64', '-w', '/tmp/crossbind/live/dist/demo-android']));
        expect(args).toContain(`${keystore}:/tmp/crossbind/keystore:ro`);
        expect(args).toContain(`${SIGNING.keystore}=/tmp/crossbind/keystore`);
        expect(args).toEqual(expect.arrayContaining([SIGNING.alias, SIGNING.password]));
        expect(args.join(' ')).not.toContain('secret-4711');
        expect(args.slice(-2)).toEqual(['assembleRelease', 'bundleRelease']);
        expect(fs.existsSync(`${project}.apk`)).toBe(true);
        expect(fs.existsSync(`${project}.aab`)).toBe(true);
        expect(fs.existsSync(path.join(home, '.crossbind', 'android', 'home'))).toBe(true);
    });

    test('without one is an APK signed with the debug key, a warning, and no bundle', () => {
        const project = path.join(base, 'dist', 'demo-android');
        fs.mkdirSync(path.dirname(project), { recursive: true });
        fs.writeFileSync(`${project}.aab`, 'an earlier bundle');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        packageAndroidRelease(project);

        expect(calls[0].at(-1)).toBe('assembleRelease');
        expect(calls[0].join(' ')).not.toContain('/tmp/crossbind/keystore');
        expect(fs.existsSync(`${project}.apk`)).toBe(true);
        expect(fs.existsSync(`${project}.aab`)).toBe(false);
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("signed with this machine's debug key"));
        warn.mockRestore();
    });

    test("is refused outside the project's base, which is all the container sees", () => {
        const elsewhere = path.join(home, 'dist', 'demo-android');

        expect(() => packageAndroidRelease(elsewhere)).toThrow(`the Android project ${elsewhere} is outside ${base}`);
        expect(calls).toHaveLength(0);
    });
});

describe('the debug APK of a development session', () => {
    test("builds in one container, whose Gradle daemon the session's builds share", () => {
        const project = path.join(base, '.crossbind', 'build', 'demo-android.debug');

        expect(buildApk(project)).toBe(path.join(project, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'));
        buildApk(project);

        const runs = calls.filter((args) => args[0] === 'run');
        const execs = calls.filter((args) => args[0] === 'exec');
        // The project's own name, not its base's, which other projects share; one a crashed session left behind gives
        // it up first.
        const name = `crossbind-android-app-${getContentHash(state.config.paths.project).slice(0, 12)}`;
        expect(calls[0]).toEqual(['rm', '--force', name]);
        expect(runs).toHaveLength(1);
        expect(runs[0]).toEqual(expect.arrayContaining(['--detach', '--name', name, '--network', 'none', '--user', '1000:1000', 'sleep', 'infinity']));
        expect(execs).toHaveLength(2);
        expect(execs[0]).toEqual(expect.arrayContaining(['-w', '/tmp/crossbind/live/.crossbind/build/demo-android.debug', 'assembleDebug']));
        expect(execs[0]).not.toContain('--no-daemon');
    });
});

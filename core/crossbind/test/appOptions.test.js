import { describe, expect, test } from 'vitest';
import {
    appDisplayName, appHeader, appId, appUpdater, appWindow,
} from '../src/utils/appOptions.js';

const config = (app = {}, version = '1.2.3') => ({ general: { name: 'demo-app' }, app, package: { version } });

describe("an app's id", () => {
    test("is app.id, else one made from the project's name", () => {
        expect(appId(config({ id: 'com.example.demo' }))).toBe('com.example.demo');
        expect(appId({ general: { name: '@scope/my app' }, app: {} })).toBe('dev.crossbind.-scope-my-app');
    });

    test('takes letters, digits, hyphens and dots alone, as it names folders as well', () => {
        expect(() => appId(config({ id: 'com.example/demo' }))).toThrow('app.id');
    });

    test('has no empty part, which would name the folder above the app\'s own', () => {
        ['.', '..', 'com..example', '.com.example', 'com.example.'].forEach((id) => {
            expect(() => appId(config({ id }))).toThrow(`app.id ${JSON.stringify(id)} is no bundle id`);
        });
    });
});

describe("an app's name", () => {
    test("is app.name, else the project's name", () => {
        expect(appDisplayName(config({ name: 'Démo Uygulaması' }))).toBe('Démo Uygulaması');
        expect(appDisplayName(config())).toBe('demo-app');
    });

    test('takes no quotation mark, backslash or control character, which its C and Windows resource strings cannot hold', () => {
        for (const name of ['Say "hi"', 'a\\b', 'two\nlines', '', '  ', 42]) {
            expect(() => appDisplayName(config({ name }))).toThrow('app.name');
        }
    });

    test('starts with neither @ nor ?, which Android reads as a resource', () => {
        expect(() => appDisplayName(config({ name: '@string/app' }))).toThrow('@ nor ?');
        expect(() => appDisplayName(config({ name: '?attr' }))).toThrow('@ nor ?');
    });

    test("names general.name and the fix when the project's name is the one it cannot show", () => {
        expect(() => appDisplayName({ general: { name: '@scope' }, app: {} })).toThrow('Set app.name');
    });
});

describe("an app's window", () => {
    test('opens a 1024 × 768 page that resizes, without app.window', () => {
        expect(appWindow(config())).toEqual({ width: 1024, height: 768, minWidth: 0, minHeight: 0, resizable: true });
    });

    test('takes the page size, the minimum size and whether it resizes from app.window', () => {
        expect(appWindow(config({ window: { width: 800, height: 600, minWidth: 400, minHeight: 300 } })))
            .toEqual({ width: 800, height: 600, minWidth: 400, minHeight: 300, resizable: true });
        expect(appWindow(config({ window: { resizable: false } }))).toMatchObject({ resizable: false });
    });

    test('refuses anything but an object of its options, so a misspelt option does not pass unnoticed', () => {
        for (const window of [800, true, [], 'big']) expect(() => appWindow(config({ window }))).toThrow('no object');
        expect(() => appWindow(config({ window: { heigth: 600 } }))).toThrow('heigth');
    });

    test('refuses a size that is no whole number of pixels up to 16384', () => {
        for (const width of [0, -1, 10.5, '800', 16385, 1e21]) expect(() => appWindow(config({ window: { width } }))).toThrow('app.window.width');
        expect(() => appWindow(config({ window: { minHeight: -1 } }))).toThrow('app.window.minHeight');
        expect(() => appWindow(config({ window: { resizable: 'yes' } }))).toThrow('app.window.resizable');
    });

    test('refuses a minimum above the size it opens with, or on a window that does not resize', () => {
        expect(() => appWindow(config({ window: { width: 800, minWidth: 900 } }))).toThrow('raise app.window.width');
        expect(() => appWindow(config({ window: { minHeight: 800 } }))).toThrow('app.window.minHeight 800');
        expect(() => appWindow(config({ window: { resizable: false, minHeight: 300 } }))).toThrow('resizable');
    });
});

describe("a desktop app's updater", () => {
    const publicKey = Buffer.alloc(32, 7).toString('base64');
    const url = 'https://example.com/updates/demo-app-{platform}-{arch}.update.json';

    test('is none without app.updater', () => {
        expect(appUpdater(config())).toBeNull();
    });

    test("takes where the updates are and the key that checks them, with package.json's version", () => {
        expect(appUpdater(config({ updater: { url, publicKey } }, '1.2.3-beta.4'))).toEqual({ url, publicKey: Buffer.alloc(32, 7), version: '1.2.3-beta.4' });
    });

    test('takes an https address, or http on this machine alone', () => {
        for (const local of ['http://localhost:8080/u.json', 'http://127.0.0.1/u.json', 'http://[::1]/u.json']) {
            expect(appUpdater(config({ updater: { url: local, publicKey } })).url).toBe(local);
        }
        for (const bad of ['http://example.com/u.json', 'ftp://example.com/u.json', 'example.com/u.json', 'https://example.com/a b.json', 'https://example.com/"u".json', 42]) {
            expect(() => appUpdater(config({ updater: { url: bad, publicKey } }))).toThrow('is no https address');
        }
    });

    test("takes a manifest's address, beside which its file is, as the host can take it", () => {
        for (const bad of ['https://example.com', 'https://example.com?x=1', 'https://example.com/updates/', 'https://example.com/güncelleme.json']) {
            expect(() => appUpdater(config({ updater: { url: bad, publicKey } }))).toThrow('is no https address of a manifest');
        }
    });

    test('refuses a key of small order, whose signatures anyone can forge, whatever the sign of x', () => {
        const identity = Buffer.alloc(32);
        identity[0] = 1;
        identity[31] = 0x80;
        for (const key of [Buffer.alloc(32), identity]) {
            expect(() => appUpdater(config({ updater: { url, publicKey: key.toString('base64') } }))).toThrow('anyone can forge signatures for');
        }
    });

    test('takes the Ed25519 public key `crossbind app updater-key` prints, as it prints it', () => {
        for (const bad of [Buffer.alloc(31).toString('base64'), `${publicKey} `, publicKey.replace(/=$/, ''), undefined]) {
            expect(() => appUpdater(config({ updater: { url, publicKey: bad } }))).toThrow('is no Ed25519 public key');
        }
    });

    test('refuses an option it does not take', () => {
        expect(() => appUpdater(config({ updater: { url, publicKey, interval: 60 } }))).toThrow('interval is none of them');
        expect(() => appUpdater(config({ updater: url }))).toThrow('is no object of url and publicKey');
        expect(() => appUpdater(config({ updater: null }))).toThrow('is no object of url and publicKey');
    });

    test('needs a semver version in package.json to tell a newer one by', () => {
        for (const version of ['1.2', '1.2.3.4', '1.2.3-', '1.2.3-a..b', '1.2.3+', 'v1.2.3']) {
            expect(() => appUpdater(config({ updater: { url, publicKey } }, version))).toThrow('is no semver version');
        }
    });

    test('needs a general.name an app can fetch its update files by', () => {
        expect(() => appUpdater({ general: { name: 'my app' }, app: { updater: { url, publicKey } } })).toThrow('general.name "my app" names');
        expect(() => appUpdater({ general: { name: '.hidden' }, app: { updater: { url, publicKey } } })).toThrow('not starting with a dot');
    });
});

describe("the header a desktop app's host builds with", () => {
    test('defines the name and the window', () => {
        expect(appHeader(config({ name: 'Demo App', window: { width: 800, height: 600, minWidth: 400 } }), 'darwin')).toBe([
            '// crossbind writes this file from crossbind.config.js and package.json.',
            '#define CROSSBIND_APP_OPEN_PATH {}',
            '#define CROSSBIND_APP_ID "dev.crossbind.demo-app"',
            '#define CROSSBIND_APP_NAME "Demo App"',
            '#define CROSSBIND_APP_WINDOW_WIDTH 800',
            '#define CROSSBIND_APP_WINDOW_HEIGHT 600',
            '#define CROSSBIND_APP_WINDOW_MIN_WIDTH 400',
            '#define CROSSBIND_APP_WINDOW_MIN_HEIGHT 0',
            '#define CROSSBIND_APP_WINDOW_RESIZABLE 1',
            '',
        ].join('\n'));
    });

    test("adds the version a Windows executable carries: package.json's, else 1.0.0", () => {
        expect(appHeader(config({}, '1.2.3-beta.4'), 'win32')).toContain('#define CROSSBIND_APP_VERSION "1.2.3-beta.4"\n#define CROSSBIND_APP_VERSION_NUMBERS 1,2,3,0\n');
        expect(appHeader(config({}, '1.2.3.4+build.5'), 'win32')).toContain('#define CROSSBIND_APP_VERSION_NUMBERS 1,2,3,4\n');
        expect(appHeader(config({}, '2.1'), 'win32')).toContain('#define CROSSBIND_APP_VERSION_NUMBERS 2,1,0,0\n');
        expect(appHeader({ general: { name: 'demo' }, app: {} }, 'win32')).toContain('#define CROSSBIND_APP_VERSION_NUMBERS 1,0,0,0\n');
    });

    test("lists where the page's shell.openPath opens files: nowhere without app.openPath", () => {
        expect(appHeader(config(), 'linux')).toContain('#define CROSSBIND_APP_OPEN_PATH {}\n');
        expect(appHeader(config({ openPath: ['logs', 'picked'] }), 'win32')).toContain('#define CROSSBIND_APP_OPEN_PATH {"logs", "picked"}\n');
    });

    test("gives a phone's host that list alone, so the desktop's options do not stop its build", () => {
        expect(appHeader(config({ openPath: ['data'], id: 'com.example.my_app', window: 800 }), 'android')).toBe([
            '// crossbind writes this file from crossbind.config.js and package.json.',
            '#define CROSSBIND_APP_OPEN_PATH {"data"}',
            '',
        ].join('\n'));
    });

    test('refuses anything but a list of data, cache, logs and picked', () => {
        expect(() => appHeader(config({ openPath: 'data' }), 'ios')).toThrow('app.openPath "data" is no list');
        expect(() => appHeader(config({ openPath: ['data', 'home'] }), 'darwin')).toThrow('"home" is none of them');
    });

    test("defines where a desktop app's updates are, the key that checks them and the version they are newer than", () => {
        const updater = { url: 'https://example.com/{platform}-{arch}.json', publicKey: Buffer.alloc(32, 7).toString('base64') };
        const header = appHeader(config({ updater }), 'linux');
        expect(header).toContain('#define CROSSBIND_APP_UPDATER_URL "https://example.com/{platform}-{arch}.json"\n');
        expect(header).toContain(`#define CROSSBIND_APP_UPDATER_KEY {${Array(32).fill('0x07').join(', ')}}\n`);
        expect(header).toContain('#define CROSSBIND_APP_UPDATER_VERSION "1.2.3"\n');
        expect(appHeader(config(), 'darwin')).not.toContain('UPDATER');
        expect(appHeader(config({ updater }), 'ios')).not.toContain('UPDATER');
    });

    test('keeps a desktop app to one instance with app.singleInstance, as a phone keeps every app itself', () => {
        expect(appHeader(config({ singleInstance: true }), 'linux')).toContain('#define CROSSBIND_APP_SINGLE_INSTANCE 1\n');
        expect(appHeader(config({ singleInstance: false }), 'win32')).not.toContain('SINGLE_INSTANCE');
        expect(appHeader(config(), 'darwin')).not.toContain('SINGLE_INSTANCE');
        expect(appHeader(config({ singleInstance: true }), 'ios')).not.toContain('SINGLE_INSTANCE');
    });

    test('refuses an app.singleInstance that is no boolean, naming the values it takes', () => {
        expect(() => appHeader(config({ singleInstance: 'yes' }), 'darwin')).toThrow('app.singleInstance "yes" is no boolean');
    });

    test('names the icon a Windows executable carries, which the build writes beside the header', () => {
        expect(appHeader(config({ icon: 'icon.png' }), 'win32')).toContain('#define CROSSBIND_APP_ICON 1\n');
        expect(appHeader(config(), 'win32')).not.toContain('CROSSBIND_APP_ICON');
        expect(appHeader(config({ icon: 'icon.png' }), 'darwin')).not.toContain('CROSSBIND_APP_ICON');
    });

    test('refuses a version Windows cannot carry on Windows alone', () => {
        for (const version of ['70000.0.0', '1.2.3.4.5', 'v1.2.3', '1.0.0-x"y', 1]) {
            expect(() => appHeader(config({}, version), 'win32')).toThrow('65535');
        }
        expect(appHeader(config({}, '20261021.0.0'), 'darwin')).not.toContain('VERSION');
    });
});

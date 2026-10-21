import { describe, expect, test } from 'vitest';
import { appDisplayName, appHeader, appId, appWindow } from '../src/utils/appOptions.js';

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

    test('refuses a version Windows cannot carry on Windows alone', () => {
        for (const version of ['70000.0.0', '1.2.3.4.5', 'v1.2.3', '1.0.0-x"y', 1]) {
            expect(() => appHeader(config({}, version), 'win32')).toThrow('65535');
        }
        expect(appHeader(config({}, '20261021.0.0'), 'darwin')).not.toContain('VERSION');
    });
});

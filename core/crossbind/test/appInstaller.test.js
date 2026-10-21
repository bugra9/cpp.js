import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { PNG } from 'pngjs';

const state = { config: {} };
vi.mock('../src/state/index.js', () => ({ default: state }));
// hdiutil, dpkg-deb and makensis, which see what they package as it is when they run.
const run = vi.fn();
vi.mock('../src/actions/run.js', () => ({ default: run }));

const {
    default: writeInstaller, checkInstaller, debianControl, debianName, debianVersion, desktopEntry, maintainer,
} = await import('../src/actions/appInstaller.js');

const roots = [];
afterAll(() => roots.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true })));

// A project with a built app in dist, as publishApp leaves it.
function project(app, { name = 'demo', appOptions = {}, pkg = { version: '1.2.0-beta.3' } } = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-installer-'));
    roots.push(root);
    fs.mkdirSync(path.join(root, 'build'));
    Object.assign(state.config, {
        general: { name },
        app: appOptions,
        package: pkg,
        paths: { base: root, project: root, build: path.join(root, 'build') },
    });
    Object.entries(app).forEach(([file, content]) => {
        fs.mkdirSync(path.dirname(path.join(root, 'dist', file)), { recursive: true });
        fs.writeFileSync(path.join(root, 'dist', file), content);
    });
    return root;
}

beforeEach(() => run.mockReset());

describe("a Linux app's Debian package", () => {
    test('is named after the project in lower case, with a hyphen for each underscore and from its first letter or digit', () => {
        expect(debianName('My_App')).toBe('my-app');
        expect(debianName('_My_App')).toBe('my-app');
        expect(debianName('crossbind-e2e-desktop-app')).toBe('crossbind-e2e-desktop-app');
        expect(() => debianName('x')).toThrow('general.name "x" makes no Debian package name');
        expect(() => debianName('Şarkı')).toThrow('Change general.name in crossbind.config.js.');
    });

    test('sorts pre-releases before their release, as semver does', () => {
        expect(debianVersion('1.0.0')).toBe('1.0.0');
        expect(debianVersion('1.0.0-beta.1')).toBe('1.0.0~beta.1');
        expect(debianVersion('2.0.0-rc.1+build.5')).toBe('2.0.0~rc.1+build.5');
    });

    test("names package.json's author as its maintainer, by name and email address", () => {
        expect(maintainer('Ada Lovelace <ada@example.com> (https://example.com)')).toBe('Ada Lovelace <ada@example.com>');
        expect(maintainer({ name: 'Ada Lovelace', email: 'ada@example.com', url: 'https://example.com' })).toBe('Ada Lovelace <ada@example.com>');
        expect(maintainer({ name: 'Ada Lovelace' })).toBe('Ada Lovelace');
        expect(maintainer(undefined)).toBeNull();
    });

    test("has a control file that depends on WebKitGTK and describes the app by package.json's description", () => {
        const control = {
            name: 'demo', version: '1.0.0-beta.1', arch: 'x64', label: 'Demo', description: 'A demo\nof crossbind',
        };
        expect(debianControl({ ...control, author: 'Ada <ada@example.com>' })).toBe([
            'Package: demo', 'Version: 1.0.0~beta.1', 'Architecture: amd64', 'Maintainer: Ada <ada@example.com>',
            'Depends: libwebkit2gtk-4.1-0 (>= 2.40), libgtk-3-0', 'Description: A demo of crossbind', '',
        ].join('\n'));
        // Without an author or a description, the app's name stands for both.
        expect(debianControl({ ...control, arch: 'arm64', description: undefined })).toBe([
            'Package: demo', 'Version: 1.0.0~beta.1', 'Architecture: arm64', 'Maintainer: Demo', 'Depends: libwebkit2gtk-4.1-0 (>= 2.40), libgtk-3-0',
            'Description: Demo', '',
        ].join('\n'));
    });

    test('has a desktop entry that starts its command, with its icon when it has one', () => {
        expect(desktopEntry({ label: 'My Demo', command: 'demo', hasIcon: true })).toBe(
            '[Desktop Entry]\nType=Application\nName=My Demo\nExec=demo\nIcon=demo\nTerminal=false\n',
        );
        expect(desktopEntry({ label: 'My Demo', command: 'demo', hasIcon: false })).not.toContain('Icon=');
    });

    // Windows writes a link's target with backslashes, and a drive for /Applications.
    test.skipIf(process.platform === 'win32')('holds the app in /usr/lib, its command in /usr/bin, and the desktop entry and icon of a menu', () => {
        const root = project({ 'demo-linux-x64/demo': 'elf', 'demo-linux-x64/resources/icon.png': 'png' }, { name: 'Demo_App', appOptions: { name: 'My Demo' } });
        fs.renameSync(path.join(root, 'dist/demo-linux-x64/demo'), path.join(root, 'dist/demo-linux-x64/Demo_App'));
        const target = { platform: 'linux', arch: 'x64' };
        let tree;
        run.mockImplementationOnce((program, params) => {
            const stage = params[3];
            const read = (file) => fs.readFileSync(path.join(stage, file), 'utf8');
            tree = {
                command: fs.readlinkSync(path.join(stage, 'usr/bin/demo-app')),
                app: fs.readdirSync(path.join(stage, 'usr/lib/demo-app')).sort(),
                icon: read('usr/share/icons/hicolor/512x512/apps/demo-app.png'),
                entry: read('usr/share/applications/demo-app.desktop'),
                control: read('DEBIAN/control'),
            };
        });

        writeInstaller(path.join(root, 'dist/demo-linux-x64'), target);

        expect(run).toHaveBeenCalledWith(null, ['dpkg-deb', '--build', '--root-owner-group', expect.stringMatching(/build[/\\]demo-linux-x64\.deb$/),
            path.join(root, 'dist/demo-linux-x64.deb')], null, target);
        expect(tree).toEqual({
            command: '../lib/demo-app/Demo_App',
            app: ['Demo_App', 'resources'],
            icon: 'png',
            entry: desktopEntry({ label: 'My Demo', command: 'demo-app', hasIcon: true }),
            control: debianControl({ name: 'demo-app', version: '1.2.0-beta.3', arch: 'x64', label: 'My Demo' }),
        });
        // What it packaged is gone once the package is made.
        expect(fs.existsSync(path.join(root, 'build/demo-linux-x64.deb'))).toBe(false);
    });

    test("is refused for an app outside the project's base, which is all the linux image sees", () => {
        const root = project({});
        const elsewhere = path.join(os.tmpdir(), 'elsewhere', 'demo-linux-x64');
        expect(() => writeInstaller(elsewhere, { platform: 'linux', arch: 'x64' })).toThrow(`the Linux app ${elsewhere} is outside ${root}`);
    });
});

describe("a macOS app's disk image", () => {
    test.skipIf(process.platform === 'win32')('holds the app beside a link to /Applications, and is named after it', () => {
        const root = project({ 'demo.app/Contents/Info.plist': 'plist' }, { appOptions: { name: 'My Demo' } });
        const target = { platform: 'darwin', arch: 'arm64' };
        let folder;
        run.mockImplementationOnce((program, params) => {
            const source = params[params.indexOf('-srcfolder') + 1];
            folder = {
                entries: fs.readdirSync(source).sort(),
                link: fs.readlinkSync(path.join(source, 'Applications')),
                plist: fs.readFileSync(path.join(source, 'demo.app/Contents/Info.plist'), 'utf8'),
            };
        });

        writeInstaller(path.join(root, 'dist/demo.app'), target);

        expect(run).toHaveBeenCalledWith(null, ['hdiutil', 'create', '-quiet', '-volname', 'My Demo', '-srcfolder', expect.any(String), '-fs', 'HFS+',
            '-format', 'UDZO', path.join(root, 'dist/demo.dmg')], null, target);
        expect(folder).toEqual({ entries: ['Applications', 'demo.app'], link: '/Applications', plist: 'plist' });
    });
});

describe("a Windows app's setup program", () => {
    test('is built by makensis from the host\'s script, which it gives the app, its names and its icon', () => {
        const icon = PNG.sync.write({ width: 16, height: 16, data: Buffer.alloc(16 * 16 * 4, 255) });
        const root = project({ 'demo-win32-x64/demo.exe': 'MZ', 'icon.png': icon }, { appOptions: { name: 'My $Demo', icon: 'dist/icon.png' } });
        const target = { platform: 'win32', arch: 'x64' };
        const app = path.join(root, 'dist/demo-win32-x64');

        writeInstaller(app, target);

        const [, params, , , options] = run.mock.calls[0];
        expect(params.slice(0, 4)).toEqual(['makensis', '-V2', '-INPUTCHARSET', 'UTF8']);
        // NSIS reads $ as the start of a variable, so the app's name doubles it.
        expect(params).toEqual(expect.arrayContaining([
            '-DNAME=My $$Demo', '-DEXE=demo.exe', '-DID=dev.crossbind.demo', '-DVERSION=1.2.0-beta.3', `-DAPP=${app}`, `-DOUTFILE=${app}-setup.exe`,
            `-DICON=${path.join(root, 'build')}/demo-win32-x64.ico`,
        ]));
        expect(params.at(-1)).toMatch(/[/\\]windows[/\\]installer\.nsi$/);
        expect(fs.existsSync(params.at(-1))).toBe(true);
        expect(options).toEqual({ params: ['-e', 'LC_ALL=C.UTF-8'] });
        expect(fs.readFileSync(path.join(root, 'build/demo-win32-x64.ico')).readUInt16LE(2)).toBe(1);
    });

    test('has no icon of its own without app.icon', () => {
        const root = project({ 'demo-win32-x64/demo.exe': 'MZ' });
        writeInstaller(path.join(root, 'dist/demo-win32-x64'), { platform: 'win32', arch: 'x64' });
        expect(run.mock.calls[0][1].some((param) => param.startsWith('-DICON='))).toBe(false);
    });

    test('is refused for a name Windows takes for no shortcut or folder', () => {
        const root = project({}, { appOptions: { name: 'Notes: Pro' } });
        expect(() => writeInstaller(path.join(root, 'dist/demo-win32-x64'), { platform: 'win32', arch: 'x64' }))
            .toThrow('"Notes: Pro", the name of a Windows app\'s Start menu shortcut and folder, is no file name Windows takes');
        expect(run).not.toHaveBeenCalled();
    });
});

describe('the names an installer takes', () => {
    test('stop a build that could not write it, before anything compiles', () => {
        project({}, { name: 'x', appOptions: { name: 'Notes: Pro' } });
        expect(() => checkInstaller({ platform: 'linux', arch: 'x64' })).toThrow('general.name "x" makes no Debian package name');
        expect(() => checkInstaller({ platform: 'win32', arch: 'x64' })).toThrow('"Notes: Pro", the name of a Windows app\'s Start menu shortcut');
        expect(() => checkInstaller({ platform: 'darwin', arch: 'arm64' })).not.toThrow();
    });
});

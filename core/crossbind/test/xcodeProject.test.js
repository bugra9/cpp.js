import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, test, vi } from 'vitest';

const state = {
    config: {
        general: { name: 'demo' }, target: {}, app: {}, system: { XCODE_DEVELOPMENT_TEAM: '' }, paths: {},
    },
    targets: [],
};
vi.mock('../src/state/index.js', () => ({ default: state }));
// xcodebuild makes Hermes' xcframework; here an empty folder stands in for it.
const spawnSync = vi.fn((program, args) => {
    fs.mkdirSync(args[args.indexOf('-output') + 1], { recursive: true });
    return { status: 0, stdout: '', stderr: '' };
});
vi.mock('node:child_process', async (importOriginal) => ({ ...await importOriginal(), spawnSync }));

const { xmlPlist, textPlist } = await import('../src/utils/plist.js');
const { default: writeXcodeProject } = await import('../src/actions/xcodeProject.js');
const { publishApp } = await import('../src/actions/buildApp.js');
const { execFileSync } = await vi.importActual('node:child_process');

function part(root, sdk) {
    const dir = path.join(root, `demo.ios-${sdk}`);
    fs.mkdirSync(path.join(dir, 'lib'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'app', 'page'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'hermesvm.framework'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'lib', '0-libdemo.a'), 'archive');
    fs.writeFileSync(path.join(dir, 'app', 'host.hbc'), 'bytecode');
    fs.writeFileSync(path.join(dir, 'link.json'), JSON.stringify(['-Wl,-force_load,{lib}/0-libdemo.a', '-Wl,-u,_crossbind_keep_demo']));
    return { sdk, dir };
}

describe('property lists', () => {
    test('an XML one indents as the macOS Info.plist always has', () => {
        expect(xmlPlist({ CFBundleName: 'a & b', NSHighResolutionCapable: true })).toBe('<?xml version="1.0" encoding="UTF-8"?>\n'
            + '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n'
            + '<plist version="1.0">\n<dict>\n    <key>CFBundleName</key>\n    <string>a &amp; b</string>\n'
            + '    <key>NSHighResolutionCapable</key>\n    <true/>\n</dict>\n</plist>\n');
    });

    test('the text one quotes every value, escaping quotes and backslashes', () => {
        expect(textPlist({ a: ['x "y"', 'c:\\d'], b: { c: 1 } })).toBe('// !$*UTF8*$!\n{\n\t"a" = (\n\t\t"x \\"y\\"",\n\t\t"c:\\\\d",\n\t);\n'
            + '\t"b" = {\n\t\t"c" = "1";\n\t};\n}\n');
    });
});

describe('an iOS app\'s Xcode project', () => {
    test('links each SDK\'s archives from beside the project, signed by the app\'s team', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-xcode-'));
        const to = path.join(root, 'with space', 'demo-ios');
        const sim = part(root, 'iphonesimulator');

        writeXcodeProject(to, { parts: [sim], identity: { id: 'com.example.demo', team: 'ABCDE12345' }, version: '1.2.3' });

        const project = fs.readFileSync(path.join(to, 'demo.xcodeproj', 'project.pbxproj'), 'utf8');
        expect(fs.readFileSync(path.join(to, 'lib', 'iphonesimulator', '0-libdemo.a'), 'utf8')).toBe('archive');
        expect(fs.readFileSync(path.join(to, 'app', 'host.hbc'), 'utf8')).toBe('bytecode');
        expect(project).toContain('"OTHER_LDFLAGS[sdk=iphonesimulator*]" = (\n\t\t\t\t\t"-Wl,-force_load,\\"$(PROJECT_DIR)/lib/iphonesimulator/0-libdemo.a\\"",');
        expect(project).toContain('"-Wl,-u,_crossbind_keep_demo",');
        expect(project).not.toContain('iphoneos*');
        expect(project).toContain('"PRODUCT_BUNDLE_IDENTIFIER" = "com.example.demo";');
        expect(project).toContain('"DEVELOPMENT_TEAM" = "ABCDE12345";');
        expect(project).toContain('"MARKETING_VERSION" = "1.2.3";');
        expect(fs.readFileSync(path.join(to, 'Info.plist'), 'utf8')).toContain('<key>LSRequiresIPhoneOS</key>\n    <true/>');
        expect(fs.readFileSync(path.join(to, 'main.m'), 'utf8')).toContain('return crossbind_app_main(argc, argv);');
        expect(spawnSync).toHaveBeenCalledWith('xcodebuild', [
            '-create-xcframework', '-framework', path.join(sim.dir, 'hermesvm.framework'), '-output', `${to}/Frameworks/hermesvm.xcframework`,
        ], { encoding: 'utf8' });
        if (process.platform === 'darwin') {
            expect(execFileSync('plutil', ['-lint', path.join(to, 'demo.xcodeproj', 'project.pbxproj')], { encoding: 'utf8' })).toContain(': OK');
        }
    });

    test('is not written from no part at all', () => {
        expect(() => writeXcodeProject(path.join(os.tmpdir(), 'crossbind-none'), { parts: [], identity: { id: 'a', team: '' }, version: '1' }))
            .toThrow('no part of the iOS app demo is built');
    });

    test('takes only a bundle id and a team id in their own forms', () => {
        const ios = { platform: 'ios', arch: 'iphoneos', buildType: 'release' };
        state.config.app = { id: 'not an id' };
        expect(() => publishApp(ios, { to: path.join(os.tmpdir(), 'crossbind-id') })).toThrow('app.id "not an id" is no bundle id');
        state.config.app = { id: 'com.example.demo', team: 'team' };
        expect(() => publishApp(ios, { to: path.join(os.tmpdir(), 'crossbind-id') })).toThrow('"team" (app.team or XCODE_DEVELOPMENT_TEAM) is no Apple team id');
        state.config.app = {};
    });
});

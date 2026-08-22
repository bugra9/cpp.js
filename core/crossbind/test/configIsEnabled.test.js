import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getFilledConfig } from '../src/state/loadConfig.js';

// isEnabled decides whether a dependency joins the CMake link at all. A false negative drops it
// silently: the build stays green and the binary dies at init (that is how a missing prebuilt
// used to surface). These cases pin the four ways a dependency can qualify.
const androidDebug = { path: 'android-arm64-v8a-mt-debug', releasePath: 'android-arm64-v8a-mt-release', platform: 'android', runtime: 'mt' };
const iosDebug = { path: 'ios-iphoneos-mt-debug', releasePath: 'ios-iphoneos-mt-release', platform: 'ios', runtime: 'mt' };

let tmpDir;

const isEnabledFor = (cmakePath, target, type = 'cmake') => getFilledConfig({
    general: { name: 'zlib' },
    export: { type },
    paths: { project: tmpDir, cmake: cmakePath },
}).functions.isEnabled(target);

beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-isenabled-'));
    fs.mkdirSync(path.join(tmpDir, 'dist/prebuilt'), { recursive: true });
});

afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('isEnabled', () => {
    const prebuiltCMake = () => path.join(tmpDir, 'dist/prebuilt/CMakeLists.txt');

    test('accepts a dependency that ships the exact target', () => {
        fs.mkdirSync(path.join(tmpDir, 'dist/prebuilt', androidDebug.path));

        expect(isEnabledFor(prebuiltCMake(), androidDebug)).toBe(true);
    });

    test('lets a debug build consume the release prebuilt', () => {
        // Ports ship release artifacts only; without this fallback every debug build would
        // silently drop every port.
        fs.mkdirSync(path.join(tmpDir, 'dist/prebuilt', androidDebug.releasePath));

        expect(isEnabledFor(prebuiltCMake(), androidDebug)).toBe(true);
    });

    test('rejects a dependency with no artifacts for this target', () => {
        fs.mkdirSync(path.join(tmpDir, 'dist/prebuilt', 'wasm-wasm32-st-release'));

        expect(isEnabledFor(prebuiltCMake(), androidDebug)).toBe(false);
    });

    test('accepts an ios dependency that ships only the xcframework', () => {
        // ios consumes <name>-<runtime>.xcframework next to the package, not a target dir.
        fs.mkdirSync(path.join(tmpDir, `zlib-${iosDebug.runtime}.xcframework`));

        expect(isEnabledFor(prebuiltCMake(), iosDebug)).toBe(true);
    });

    test('accepts a source-cmake package for every target', () => {
        // Its own CMakeLists is compiled into the consuming build, so it ships no prebuilt.
        const ownCMake = path.join(tmpDir, 'CMakeLists.txt');
        fs.writeFileSync(ownCMake, 'project(zlib)\n');

        expect(isEnabledFor(ownCMake, androidDebug)).toBe(true);
        expect(isEnabledFor(ownCMake, iosDebug)).toBe(true);
    });

    test('does not treat a missing source CMakeLists as a source-cmake package', () => {
        expect(isEnabledFor(path.join(tmpDir, 'CMakeLists.txt'), androidDebug)).toBe(false);
    });
});

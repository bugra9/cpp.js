import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import getCMakeListsFilePath, { getCliCMakeListsFile } from '../src/utils/getCMakeListsFilePath.js';

describe('getCMakeListsFilePath', () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = path.join(os.tmpdir(), `cppjs-cmake-${process.pid}-${Date.now()}`);
        fs.mkdirSync(tmpDir, { recursive: true });
    });

    afterEach(() => {
        if (tmpDir && fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('returns the root CMakeLists.txt when present', () => {
        const expected = path.join(tmpDir, 'CMakeLists.txt');
        fs.writeFileSync(expected, '');
        const result = getCMakeListsFilePath(tmpDir);
        expect(path.normalize(result)).toBe(path.normalize(expected));
    });

    test('falls back to a sub-directory CMakeLists.txt when root has none', () => {
        fs.mkdirSync(path.join(tmpDir, 'subproj'));
        const expected = path.join(tmpDir, 'subproj', 'CMakeLists.txt');
        fs.writeFileSync(expected, '');
        const result = getCMakeListsFilePath(tmpDir);
        expect(path.normalize(result)).toBe(path.normalize(expected));
    });

    test('falls back to the bundled CLI default when no CMakeLists found', () => {
        const result = getCMakeListsFilePath(tmpDir);
        expect(result).toMatch(/assets\/cmake\/CMakeLists\.txt$/);
    });

    test('skips ignored directories (node_modules, dist, build)', () => {
        fs.mkdirSync(path.join(tmpDir, 'node_modules'));
        fs.writeFileSync(path.join(tmpDir, 'node_modules', 'CMakeLists.txt'), '');
        const result = getCMakeListsFilePath(tmpDir);
        expect(result).not.toContain('node_modules');
    });
});

describe('getCliCMakeListsFile', () => {
    test('points at the bundled assets/cmake/CMakeLists.txt', () => {
        const result = getCliCMakeListsFile();
        expect(result).toMatch(/cppjs-core\/cpp\.js\/src\/assets\/cmake\/CMakeLists\.txt$/);
    });
});

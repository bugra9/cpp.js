import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import findFiles from '../src/utils/findFiles.js';

describe('findFiles', () => {
    let tmpDir;

    beforeEach(() => {
        tmpDir = path.join(os.tmpdir(), `cppjs-findfiles-${process.pid}-${Date.now()}`);
        fs.mkdirSync(path.join(tmpDir, 'sub'), { recursive: true });
        fs.writeFileSync(path.join(tmpDir, 'a.txt'), '');
        fs.writeFileSync(path.join(tmpDir, 'b.txt'), '');
        fs.writeFileSync(path.join(tmpDir, 'sub', 'c.txt'), '');
        fs.writeFileSync(path.join(tmpDir, 'ignore.md'), '');
    });

    afterEach(() => {
        if (tmpDir && fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('returns absolute posix paths', () => {
        const results = findFiles('*.txt', { cwd: tmpDir });
        expect(results.length).toBe(2);
        results.forEach((p) => {
            expect(path.isAbsolute(p)).toBe(true);
            expect(p).not.toContain('\\');
        });
    });

    test('matches files at the cwd level', () => {
        const results = findFiles('*.txt', { cwd: tmpDir }).map((p) => path.basename(p)).sort();
        expect(results).toEqual(['a.txt', 'b.txt']);
    });

    test('matches files in subdirectories with **/ glob', () => {
        const results = findFiles('**/*.txt', { cwd: tmpDir }).map((p) => path.basename(p)).sort();
        expect(results).toEqual(['a.txt', 'b.txt', 'c.txt']);
    });

    test('returns empty array when nothing matches', () => {
        expect(findFiles('*.nope', { cwd: tmpDir })).toEqual([]);
    });

    test('respects the ignore option', () => {
        const results = findFiles('*', { cwd: tmpDir, ignore: ['*.md'] }).map((p) => path.basename(p));
        expect(results).not.toContain('ignore.md');
    });
});

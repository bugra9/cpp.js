import {
    describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import writeIfChanged from '../src/utils/writeIfChanged.js';

let work;

beforeEach(() => {
    work = fs.mkdtempSync(path.join(os.tmpdir(), 'cppjs-write-if-changed-'));
});

afterEach(() => {
    fs.rmSync(work, { recursive: true, force: true });
});

describe('writeIfChanged', () => {
    test('writes a missing file and creates its parent directories', () => {
        const file = path.join(work, 'nested/deeper/out.txt');
        writeIfChanged(file, 'hello');
        expect(fs.readFileSync(file, 'utf8')).toBe('hello');
    });

    test('leaves an identical file untouched', async () => {
        const file = path.join(work, 'out.txt');
        writeIfChanged(file, 'same');
        const before = fs.statSync(file).mtimeMs;
        await new Promise((resolve) => { setTimeout(resolve, 10); });
        writeIfChanged(file, 'same');
        expect(fs.statSync(file).mtimeMs).toBe(before);
    });

    test('rewrites the file when the content differs', () => {
        const file = path.join(work, 'out.txt');
        writeIfChanged(file, 'first');
        writeIfChanged(file, 'second');
        expect(fs.readFileSync(file, 'utf8')).toBe('second');
    });
});

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import writeJson from '../src/utils/writeJson.js';

describe('writeJson', () => {
    let tmpFile;

    beforeEach(() => {
        tmpFile = path.join(os.tmpdir(), `cppjs-writejson-${process.pid}-${Date.now()}.json`);
    });

    afterEach(() => {
        if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    });

    test('writes a parseable JSON file', () => {
        const data = { key: 'value', nested: { a: 1 } };
        writeJson(tmpFile, data);
        expect(fs.existsSync(tmpFile)).toBe(true);
        expect(JSON.parse(fs.readFileSync(tmpFile, 'utf8'))).toEqual(data);
    });

    test('uses 4-space indentation', () => {
        writeJson(tmpFile, { a: 1 });
        const content = fs.readFileSync(tmpFile, 'utf8');
        expect(content).toContain('    "a": 1');
    });

    test('overwrites existing file content', () => {
        fs.writeFileSync(tmpFile, 'old garbage content');
        writeJson(tmpFile, { fresh: true });
        expect(JSON.parse(fs.readFileSync(tmpFile, 'utf8'))).toEqual({ fresh: true });
    });

    test('handles arrays as the top-level value', () => {
        writeJson(tmpFile, [1, 2, 3]);
        expect(JSON.parse(fs.readFileSync(tmpFile, 'utf8'))).toEqual([1, 2, 3]);
    });

    test('does not throw on unwritable path; logs to console.error', () => {
        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const badPath = '/nonexistent-dir-cppjs-test/should-not-exist.json';
        expect(() => writeJson(badPath, { a: 1 })).not.toThrow();
        expect(errSpy).toHaveBeenCalled();
        errSpy.mockRestore();
    });
});

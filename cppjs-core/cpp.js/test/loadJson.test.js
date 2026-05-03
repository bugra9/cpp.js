import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import loadJson from '../src/utils/loadJson.js';

describe('loadJson', () => {
    let tmpFile;

    beforeEach(() => {
        tmpFile = path.join(os.tmpdir(), `cppjs-loadjson-${process.pid}-${Date.now()}.json`);
    });

    afterEach(() => {
        if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    });

    test('returns null when file does not exist', () => {
        expect(loadJson('/nonexistent/path/to/missing.json')).toBeNull();
    });

    test('parses a valid JSON file', () => {
        fs.writeFileSync(tmpFile, JSON.stringify({ foo: 'bar', n: 42 }));
        expect(loadJson(tmpFile)).toEqual({ foo: 'bar', n: 42 });
    });

    test('returns null when file contains invalid JSON', () => {
        fs.writeFileSync(tmpFile, '{ not valid json');
        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(loadJson(tmpFile)).toBeNull();
        expect(errSpy).toHaveBeenCalled();
        errSpy.mockRestore();
    });

    test('handles arrays as the top-level value', () => {
        fs.writeFileSync(tmpFile, JSON.stringify([1, 2, 3]));
        expect(loadJson(tmpFile)).toEqual([1, 2, 3]);
    });

    test('handles empty object', () => {
        fs.writeFileSync(tmpFile, '{}');
        expect(loadJson(tmpFile)).toEqual({});
    });
});

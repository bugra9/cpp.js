import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getContentHash, getFileHash } from '../src/utils/hash.js';

describe('getContentHash', () => {
    test('produces the SHA-256 of a known string', () => {
        // Reference: echo -n "hello" | shasum -a 256 → 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
        expect(getContentHash('hello')).toBe(
            '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
        );
    });

    test('produces the SHA-256 of an empty input', () => {
        expect(getContentHash('')).toBe(
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        );
    });

    test('handles Buffer input identically to string', () => {
        expect(getContentHash(Buffer.from('hello'))).toBe(getContentHash('hello'));
    });
});

describe('getFileHash', () => {
    let tmpFile;

    beforeAll(() => {
        tmpFile = path.join(os.tmpdir(), `cppjs-hash-test-${process.pid}.txt`);
        fs.writeFileSync(tmpFile, 'hello');
    });

    afterAll(() => {
        if (tmpFile && fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    });

    test('hashes file contents matching getContentHash', () => {
        expect(getFileHash(tmpFile)).toBe(getContentHash('hello'));
    });
});

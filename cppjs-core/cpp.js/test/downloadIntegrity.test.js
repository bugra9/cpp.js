import {
    describe, test, expect, beforeEach, afterEach,
} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { verifyIntegrity } from '../src/utils/downloadAndExtractFile.js';

const URL = 'https://download.osgeo.org/libtiff/tiff-4.7.1.tar.gz';

describe('verifyIntegrity', () => {
    let tmpDir;
    let file;
    let hash;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cppjs-integrity-'));
        file = path.join(tmpDir, 'src.tar.gz');
        fs.writeFileSync(file, 'the downloaded source archive bytes');
        hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('passes and keeps the file when it matches the pinned sha256', () => {
        expect(() => verifyIntegrity(file, URL, hash)).not.toThrow();
        expect(fs.existsSync(file)).toBe(true);
    });

    test('accepts an upper-case pinned hash', () => {
        expect(() => verifyIntegrity(file, URL, hash.toUpperCase())).not.toThrow();
    });

    test('throws and deletes the poisoned file on a mismatch', () => {
        const wrong = 'deadbeef'.repeat(8); // 64 hex chars, not the real hash
        expect(() => verifyIntegrity(file, URL, wrong)).toThrow(/integrity check failed/);
        expect(fs.existsSync(file)).toBe(false);
    });

    test('skips verification when no hash is pinned (incremental rollout)', () => {
        expect(() => verifyIntegrity(file, URL, undefined)).not.toThrow();
        expect(fs.existsSync(file)).toBe(true);
    });
});

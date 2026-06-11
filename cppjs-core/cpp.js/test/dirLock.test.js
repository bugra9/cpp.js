import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import withDirLock from '../src/utils/dirLock.js';

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

describe('withDirLock', () => {
    let tmpDir;
    let lockPath;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cppjs-lock-'));
        lockPath = path.join(tmpDir, 'deps', 'z.lock');
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test('runs the function, returns its value and removes the lock file', async () => {
        const result = await withDirLock(lockPath, async () => {
            expect(fs.existsSync(lockPath)).toBe(true);
            return 42;
        });

        expect(result).toBe(42);
        expect(fs.existsSync(lockPath)).toBe(false);
    });

    test('serializes two concurrent holders of the same lock', async () => {
        const order = [];
        const first = withDirLock(lockPath, async () => {
            order.push('first-start');
            await sleep(120);
            order.push('first-end');
        }, { pollMs: 10 });
        await sleep(20);
        const second = withDirLock(lockPath, async () => {
            order.push('second-start');
        }, { pollMs: 10 });

        await Promise.all([first, second]);

        expect(order).toEqual(['first-start', 'first-end', 'second-start']);
    });

    test('breaks a stale lock and proceeds', async () => {
        fs.mkdirSync(path.dirname(lockPath), { recursive: true });
        fs.writeFileSync(lockPath, '999999');
        const past = (Date.now() - 60 * 60 * 1000) / 1000;
        fs.utimesSync(lockPath, past, past);

        const result = await withDirLock(lockPath, async () => 'ran', { staleMs: 1000 });

        expect(result).toBe('ran');
        expect(fs.existsSync(lockPath)).toBe(false);
    });

    test('releases the lock when the function throws', async () => {
        await expect(withDirLock(lockPath, async () => {
            throw new Error('boom');
        })).rejects.toThrow('boom');

        expect(fs.existsSync(lockPath)).toBe(false);
    });
});

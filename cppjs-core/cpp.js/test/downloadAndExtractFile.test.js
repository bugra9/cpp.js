import {
    describe, test, expect, beforeEach, afterEach, vi,
} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';

const httpsGet = vi.hoisted(() => vi.fn());
const decompressMock = vi.hoisted(() => vi.fn());

vi.mock('follow-redirects', () => ({
    default: { https: { get: httpsGet } },
}));
vi.mock('decompress', () => ({ default: decompressMock }));

import downloadAndExtractFile from '../src/utils/downloadAndExtractFile.js';

const URL = 'https://example.com/downloads/pkg-1.0.tar.gz';

const sha256Of = (content) => crypto.createHash('sha256').update(content).digest('hex');

// decompress is mocked; emulate its one observable side effect (the extracted top-level
// folder) so the rename-to-source step has something to work on.
function mockExtractedArchive(output) {
    decompressMock.mockImplementation(async () => {
        fs.mkdirSync(path.join(output, 'pkg-1.0'), { recursive: true });
        return [{ path: 'pkg-1.0/lib.c' }];
    });
}

describe('downloadAndExtractFile', () => {
    let output;

    beforeEach(() => {
        vi.clearAllMocks();
        output = fs.mkdtempSync(path.join(os.tmpdir(), 'cppjs-download-'));
    });

    afterEach(() => {
        fs.rmSync(output, { recursive: true, force: true });
    });

    test('returns false without touching the network when output/source already exists', async () => {
        fs.mkdirSync(path.join(output, 'source'));

        await expect(downloadAndExtractFile(URL, output)).resolves.toBe(false);
        expect(httpsGet).not.toHaveBeenCalled();
        expect(decompressMock).not.toHaveBeenCalled();
    });

    test('reuses an already-downloaded archive instead of re-fetching it', async () => {
        const archive = 'previously downloaded archive bytes';
        fs.writeFileSync(path.join(output, 'pkg-1.0.tar.gz'), archive);
        mockExtractedArchive(output);

        await expect(downloadAndExtractFile(URL, output, sha256Of(archive))).resolves.toBe(true);
        expect(httpsGet).not.toHaveBeenCalled();
        expect(fs.existsSync(path.join(output, 'source'))).toBe(true);
    });

    test('throws when the archive extracts to nothing', async () => {
        fs.writeFileSync(path.join(output, 'pkg-1.0.tar.gz'), 'bytes');
        decompressMock.mockResolvedValue([]);

        await expect(downloadAndExtractFile(URL, output, sha256Of('bytes')))
            .rejects.toThrow(/empty or not a supported archive/);
    });

    test('downloads over https, verifies the pin, and extracts to source', async () => {
        const archive = Buffer.from('fresh archive bytes from the network');
        httpsGet.mockImplementation((options, onResponse) => {
            expect(options.hostname).toBe('example.com');
            const res = new EventEmitter();
            res.statusCode = 200;
            res.pipe = (fileStream) => fileStream.end(archive);
            queueMicrotask(() => onResponse(res));
            return new EventEmitter();
        });
        mockExtractedArchive(output);

        await expect(downloadAndExtractFile(URL, output, sha256Of(archive))).resolves.toBe(true);
        expect(fs.readFileSync(path.join(output, 'pkg-1.0.tar.gz'))).toEqual(archive);
        expect(fs.existsSync(path.join(output, 'source'))).toBe(true);
    });

    test('rejects with the HTTP status on a non-2xx response', async () => {
        httpsGet.mockImplementation((options, onResponse) => {
            const res = new EventEmitter();
            res.statusCode = 404;
            res.resume = vi.fn();
            queueMicrotask(() => onResponse(res));
            return new EventEmitter();
        });

        await expect(downloadAndExtractFile(URL, output)).rejects.toThrow(/HTTP 404/);
    });

    test('rejects when the host cannot be reached', async () => {
        httpsGet.mockImplementation(() => {
            const request = new EventEmitter();
            queueMicrotask(() => request.emit('error', new Error('ENOTFOUND example.com')));
            return request;
        });

        await expect(downloadAndExtractFile(URL, output)).rejects.toThrow(/cannot reach/);
    });
});

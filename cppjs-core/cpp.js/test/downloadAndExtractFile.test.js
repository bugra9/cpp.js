import {
    describe, test, expect, beforeEach, afterEach, vi,
} from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { EventEmitter } from 'node:events';

const httpsGet = vi.hoisted(() => vi.fn());

vi.mock('follow-redirects', () => ({
    default: { https: { get: httpsGet } },
}));

import downloadAndExtractFile from '../src/utils/downloadAndExtractFile.js';

const URL = 'https://example.com/downloads/pkg-1.0.tar.gz';

const sha256Of = (content) => crypto.createHash('sha256').update(content).digest('hex');

// Real archives, packed by the same tar the implementation extracts with: the upstream
// releases this code consumes are tarballs (gzip, and bzip2 for geos).
function packArchive(dest, { compression = 'z', root = 'pkg-1.0' } = {}) {
    const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'cppjs-fixture-'));
    fs.mkdirSync(path.join(staging, root), { recursive: true });
    fs.writeFileSync(path.join(staging, root, 'lib.c'), 'int answer(void) { return 42; }\n');
    execFileSync('tar', [`-c${compression}f`, dest, '-C', staging, root]);
    fs.rmSync(staging, { recursive: true, force: true });
    return fs.readFileSync(dest);
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
    });

    test('reuses an already-downloaded archive instead of re-fetching it', async () => {
        const archive = packArchive(path.join(output, 'pkg-1.0.tar.gz'));

        await expect(downloadAndExtractFile(URL, output, sha256Of(archive))).resolves.toBe(true);
        expect(httpsGet).not.toHaveBeenCalled();
        expect(fs.readFileSync(path.join(output, 'source/lib.c'), 'utf8')).toContain('answer');
    });

    test('extracts bzip2 tarballs too', async () => {
        const dest = path.join(output, 'pkg-1.0.tar.bz2');
        const archive = packArchive(dest, { compression: 'j' });

        await expect(downloadAndExtractFile('https://example.com/downloads/pkg-1.0.tar.bz2', output, sha256Of(archive)))
            .resolves.toBe(true);
        expect(fs.existsSync(path.join(output, 'source/lib.c'))).toBe(true);
    });

    test('renames the archive root to source rather than trusting the archive paths', async () => {
        const archive = packArchive(path.join(output, 'pkg-1.0.tar.gz'), { root: 'some-other-name-2.3' });

        await expect(downloadAndExtractFile(URL, output, sha256Of(archive))).resolves.toBe(true);
        expect(fs.existsSync(path.join(output, 'source/lib.c'))).toBe(true);
        expect(fs.existsSync(path.join(output, 'some-other-name-2.3'))).toBe(false);
        expect(fs.existsSync(path.join(output, '.extract'))).toBe(false);
    });

    test('throws when the downloaded file is not an archive', async () => {
        fs.writeFileSync(path.join(output, 'pkg-1.0.tar.gz'), 'not an archive');

        await expect(downloadAndExtractFile(URL, output, sha256Of('not an archive')))
            .rejects.toThrow(/extracting .* failed/);
        expect(fs.existsSync(path.join(output, 'source'))).toBe(false);
    });

    test('downloads over https, verifies the pin, and extracts to source', async () => {
        const staged = path.join(output, 'staged.tar.gz');
        const archive = packArchive(staged);
        fs.rmSync(staged);
        httpsGet.mockImplementation((options, onResponse) => {
            expect(options.hostname).toBe('example.com');
            const res = new EventEmitter();
            res.statusCode = 200;
            res.pipe = (fileStream) => fileStream.end(archive);
            queueMicrotask(() => onResponse(res));
            return new EventEmitter();
        });

        await expect(downloadAndExtractFile(URL, output, sha256Of(archive))).resolves.toBe(true);
        expect(fs.readFileSync(path.join(output, 'pkg-1.0.tar.gz'))).toEqual(archive);
        expect(fs.existsSync(path.join(output, 'source/lib.c'))).toBe(true);
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

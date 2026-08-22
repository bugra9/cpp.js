import {
    describe, test, expect, beforeEach, afterEach, vi,
} from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ensureRustSysroot, { assertManifest, sysrootPath } from '../src/utils/rustSysroot.js';

// The artifact is what a host build links against, so it is fetched over the network and unpacked
// on the developer's machine. These tests drive the real flow - a served archive, a real sha256, a
// real tar - because the value of this path is entirely in what it refuses.
const HOST = { version: '1.97.1', commit: '0'.repeat(40) };
const TARGET = 'wasm32-unknown-emscripten';

const manifestFor = (over = {}) => ({
    schema: 1,
    rustc: HOST.version,
    rustcCommit: HOST.commit,
    emsdk: '6.0.2',
    target: TARGET,
    panic: 'abort',
    variants: { st: { targetFeatures: [] }, mt: { targetFeatures: ['atomics', 'bulk-memory', 'mutable-globals'] } },
    ...over,
});

let work;
let server;
let requests;

// An image filesystem export: the tree lives at opt/crossbind/rust/<version>.
function buildArtifact(manifest = manifestFor()) {
    const stage = fs.mkdtempSync(path.join(work, 'stage-'));
    const tree = path.join(stage, 'opt', 'crossbind', 'rust', manifest.rustc ?? '1.97.1');
    for (const variant of ['st', 'mt']) {
        const lib = path.join(tree, variant, 'lib', 'rustlib', TARGET, 'lib');
        fs.mkdirSync(lib, { recursive: true });
        fs.writeFileSync(path.join(lib, 'libstd-0123456789abcdef.rlib'), variant);
    }
    fs.writeFileSync(path.join(tree, 'manifest.json'), JSON.stringify(manifest));
    const tar = path.join(work, `artifact-${crypto.randomUUID()}.tar`);
    execFileSync('tar', ['-cf', tar, '-C', stage, 'opt']);
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(tar)).digest('hex');
    return { tar, sha256 };
}

function serve(tar) {
    return new Promise((resolve) => {
        server = http.createServer((req, res) => {
            requests.push(req.url);
            res.writeHead(200, { 'Content-Type': 'application/octet-stream' });
            fs.createReadStream(tar).pipe(res);
        });
        server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${server.address().port}/sysroot.tar`));
    });
}

beforeEach(() => {
    work = fs.mkdtempSync(path.join(os.tmpdir(), 'crossbind-sysroot-'));
    requests = [];
});

afterEach(async () => {
    if (server) await new Promise((resolve) => { server.close(resolve); });
    server = null;
    fs.rmSync(work, { recursive: true, force: true });
    vi.restoreAllMocks();
});

describe('ensureRustSysroot', () => {
    test('downloads, verifies and lands a complete tree keyed by digest', async () => {
        const { tar, sha256 } = buildArtifact();
        const url = await serve(tar);
        const root = path.join(work, 'cache');

        const dir = await ensureRustSysroot({
            url, sha256, root, host: HOST,
        });

        expect(dir).toBe(path.join(root, sha256));
        expect(JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')).target).toBe(TARGET);
        expect(fs.existsSync(sysrootPath(dir, 'st'))).toBe(true);
        expect(fs.existsSync(sysrootPath(dir, 'mt'))).toBe(true);
        // Nothing half-written is left behind for the next run to trip over.
        expect(fs.readdirSync(root).filter((e) => e.startsWith('.staging-'))).toEqual([]);
    });

    test('refuses an archive whose bytes do not match the pin, and leaves no tree', async () => {
        const { tar } = buildArtifact();
        const url = await serve(tar);
        const root = path.join(work, 'cache');
        const wrong = 'b'.repeat(64);

        await expect(ensureRustSysroot({
            url, sha256: wrong, root, host: HOST,
        })).rejects.toThrow(/integrity check failed/);
        expect(fs.existsSync(path.join(root, wrong))).toBe(false);
    });

    test('refuses an artifact built by a different compiler', async () => {
        // rlib metadata is keyed to the producing rustc; linking against a foreign one fails deep
        // inside the linker, so it is rejected here where the message can say why.
        const { tar, sha256 } = buildArtifact(manifestFor({ rustcCommit: 'f'.repeat(40) }));
        const url = await serve(tar);
        const root = path.join(work, 'cache');

        await expect(ensureRustSysroot({
            url, sha256, root, host: HOST,
        })).rejects.toThrow(/different compiler/);
        expect(fs.existsSync(path.join(root, sha256))).toBe(false);
    });

    test('refuses an artifact missing a variant', async () => {
        const { tar, sha256 } = buildArtifact(manifestFor({ variants: { st: { targetFeatures: [] } } }));
        const url = await serve(tar);

        await expect(ensureRustSysroot({
            url, sha256, root: path.join(work, 'cache'), host: HOST,
        })).rejects.toThrow(/missing the 'mt' variant/);
    });

    test('serves the second build from cache without downloading again', async () => {
        const { tar, sha256 } = buildArtifact();
        const url = await serve(tar);
        const root = path.join(work, 'cache');

        await ensureRustSysroot({
            url, sha256, root, host: HOST,
        });
        await ensureRustSysroot({
            url, sha256, root, host: HOST,
        });

        expect(requests).toHaveLength(1);
    });

    test('two concurrent builds download once and both get the tree', async () => {
        // The lock is the reason: without it both would extract into the same destination.
        const { tar, sha256 } = buildArtifact();
        const url = await serve(tar);
        const root = path.join(work, 'cache');

        const dirs = await Promise.all([
            ensureRustSysroot({
                url, sha256, root, host: HOST,
            }),
            ensureRustSysroot({
                url, sha256, root, host: HOST,
            }),
        ]);

        expect(dirs[0]).toBe(dirs[1]);
        expect(requests).toHaveLength(1);
        expect(fs.existsSync(path.join(dirs[0], 'manifest.json'))).toBe(true);
    });

    test('demands a pin at all', async () => {
        await expect(ensureRustSysroot({ url: 'https://example.invalid/a.tar', sha256: '' }))
            .rejects.toThrow(/must be pinned by sha256/);
    });
});

describe('assertManifest', () => {
    test('rejects an unsupported schema', () => {
        expect(() => assertManifest(manifestFor({ schema: 2 }), HOST)).toThrow(/schema 2 is not supported/);
    });

    test('accepts the current contract', () => {
        expect(assertManifest(manifestFor(), HOST).target).toBe(TARGET);
    });
});

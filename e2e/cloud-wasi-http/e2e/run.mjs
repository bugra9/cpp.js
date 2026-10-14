import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Serves the built component under each WASI 0.3 host on PATH and asks it what the handler answers.
const WASM = resolve(import.meta.dirname, '../dist/crossbind-e2e-cloud-wasi-http-wasi-wasm32-st-release.http.wasm');
const STARTUP_MS = 60000;
const LOG_MS = 5000;
const POLL_MS = 250;
const UPLOAD = Buffer.alloc(2_500_000, 'crossbind');
const BIG_BODY = 3 * 1024 * 1024;
const CONCURRENT = 30;
const MEMORY_CAP = 64 * 1024 * 1024;
const OVERSIZED = Buffer.alloc(80 * 1024 * 1024);

function spinManifest(dir) {
    const file = join(dir, 'spin.toml');
    writeFileSync(file, `spin_manifest_version = 2

[application]
name = "crossbind-e2e"

[[trigger.http]]
route = "/..."
component = "handler"

[component.handler]
source = "${WASM}"
`);
    return file;
}

// wasmtime runs with a capped memory, so a body too large for it is proven to answer an error instead of a
// trap; Spin keeps a component's stderr in its log dir.
const HOSTS = [
    {
        program: 'wasmtime',
        args: (port) => ['serve', '-W', `max-memory-size=${MEMORY_CAP}`, '--addr', `127.0.0.1:${port}`, WASM],
        logOf: () => '',
        oversizedLog: 'ErrorCode::HttpRequestBodySize',
    },
    {
        program: 'spin',
        args: (port, dir) => ['up', '--listen', `127.0.0.1:${port}`, '-f', spinManifest(dir)],
        logOf: (dir) => {
            const file = join(dir, '.spin/logs/handler_stderr.txt');
            return existsSync(file) ? readFileSync(file, 'utf8') : '';
        },
    },
];

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function isInstalled(program) {
    try {
        execFileSync(program, ['--version'], { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function freePort() {
    return new Promise((done, fail) => {
        const server = createServer();
        server.once('error', fail);
        server.listen(0, '127.0.0.1', () => {
            const { port } = server.address();
            server.close(() => done(port));
        });
    });
}

async function untilServing(base, child) {
    const deadline = Date.now() + STARTUP_MS;
    for (;;) {
        if (child.exitCode !== null) throw new Error(`exited with ${child.exitCode} before serving`);
        try {
            await fetch(base);
            return;
        } catch (error) {
            if (Date.now() > deadline) throw new Error(`nothing answered at ${base}`, { cause: error });
            await sleep(POLL_MS);
        }
    }
}

function expect(isTrue, message) {
    if (!isTrue) throw new Error(message);
}

async function untilLogged(log, text) {
    const deadline = Date.now() + LOG_MS;
    while (!log().includes(text) && Date.now() < deadline) await sleep(POLL_MS);
    expect(log().includes(text), `the host did not log "${text}"`);
}

async function check(host, base, log) {
    const hello = await fetch(`${base}/hello?name=crossbind`, { headers: { 'X-Crossbind': 'e2e' } });
    const text = await hello.text();
    expect(hello.status === 200, `GET /hello answered ${hello.status}`);
    expect(hello.headers.get('content-type') === 'text/plain; charset=utf-8', `GET /hello came as ${hello.headers.get('content-type')}`);
    const head = `GET /hello\nquery name=crossbind\nauthority ${new URL(base).host}\n`;
    expect(text.startsWith(head) && text.includes('\nx-crossbind: e2e\n'), `GET /hello answered ${JSON.stringify(text)}`);

    const echo = await fetch(`${base}/echo`, { method: 'POST', body: UPLOAD });
    expect(Buffer.from(await echo.arrayBuffer()).equals(UPLOAD), 'POST /echo did not send the body back whole');

    expect((await fetch(`${base}/missing`)).status === 404, 'GET /missing was not a 404');
    expect((await fetch(`${base}/throw`)).status === 500, 'GET /throw was not a 500');
    expect((await (await fetch(`${base}/big`)).arrayBuffer()).byteLength === BIG_BODY, 'GET /big lost bytes');

    const paths = Array.from({ length: CONCURRENT }, (_, i) => `/concurrent/${i}`);
    const answers = await Promise.all(paths.map(async (path) => (await fetch(`${base}${path}`)).text()));
    expect(answers.every((answer, i) => answer.startsWith(`GET ${paths[i]}\n`)), 'concurrent requests got answers of other requests');

    await untilLogged(log, 'crossbind: GET /throw threw: thrown for /throw');

    if (host.oversizedLog) {
        const oversized = await fetch(`${base}/echo`, { method: 'POST', body: OVERSIZED });
        expect(oversized.status === 500, `an oversized POST /echo answered ${oversized.status}`);
        await untilLogged(log, host.oversizedLog);
        expect((await fetch(`${base}/hello`)).status === 200, 'nothing answered after an oversized body');
    }
}

const hosts = HOSTS.filter((host) => isInstalled(host.program));
const missing = HOSTS.filter((host) => !hosts.includes(host));
missing.forEach((host) => console.log(`${process.env.CI ? 'FAIL' : 'SKIP'}: ${host.program} is not installed.`));
if (process.env.CI && missing.length) process.exit(1);

for (const host of hosts) {
    const dir = mkdtempSync(join(tmpdir(), 'crossbind-wasi-http-'));
    const port = await freePort();
    const base = `http://127.0.0.1:${port}`;
    let output = '';
    const child = spawn(host.program, host.args(port, dir), { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (chunk) => {
        output += chunk;
    });
    child.stderr.on('data', (chunk) => {
        output += chunk;
    });
    try {
        await untilServing(base, child);
        await check(host, base, () => output + host.logOf(dir));
        console.log(`ok: ${host.program} served the component`);
    } catch (error) {
        console.error(`FAIL (${host.program}): ${error.message}\n${output}`);
        process.exitCode = 1;
    } finally {
        if (child.exitCode === null) {
            child.kill();
            await new Promise((done) => child.once('exit', done));
        }
        rmSync(dir, { recursive: true, force: true });
    }
}

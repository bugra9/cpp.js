/**
 * Small process helpers shared by the e2e-templates harness.
 *
 * `run` spawns a command (no shell, so arguments with spaces are safe),
 * captures combined stdout/stderr, tees it to an optional log stream, and
 * never rejects: it always resolves to a result record so callers can branch
 * on `ok` instead of wrapping every call in try/catch.
 */

const { spawn, spawnSync } = require('node:child_process');

const MINUTE = 60 * 1000;
const DEFAULT_TIMEOUT_MS = 25 * MINUTE;

function run(command, args, options = {}) {
    const { cwd, env, logStream, timeoutMs = DEFAULT_TIMEOUT_MS, label } = options;

    return new Promise((resolve) => {
        const startedAt = Date.now();
        const header = `\n$ ${command} ${args.join(' ')}${cwd ? `   (cwd: ${cwd})` : ''}\n`;
        if (logStream) logStream.write(header);

        const child = spawn(command, args, {
            cwd,
            env: { ...process.env, ...env },
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        let output = '';
        const capture = (chunk) => {
            const text = chunk.toString();
            output += text;
            if (logStream) logStream.write(text);
        };
        child.stdout.on('data', capture);
        child.stderr.on('data', capture);

        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            child.kill('SIGKILL');
            capture(`\n[e2e-templates] TIMEOUT after ${timeoutMs}ms\n`);
        }, timeoutMs);

        const finish = (code, errMessage) => {
            clearTimeout(timer);
            if (errMessage) capture(`\n[e2e-templates] spawn error: ${errMessage}\n`);
            resolve({
                ok: code === 0 && !timedOut && !errMessage,
                code,
                timedOut,
                output,
                ms: Date.now() - startedAt,
                label: label || command,
            });
        };

        child.on('error', (err) => finish(-1, err.message));
        child.on('close', (code) => finish(code));
    });
}

/**
 * Returns true if `command` can be executed (used for capability detection).
 * Never throws — a missing binary resolves to false.
 */
function commandOk(command, args = ['--version']) {
    try {
        const result = spawnSync(command, args, { stdio: 'ignore', timeout: 30 * 1000 });
        return !result.error && result.status === 0;
    } catch {
        return false;
    }
}

/** Captures stdout of a command, or returns '' on any failure. */
function commandOutput(command, args) {
    try {
        const result = spawnSync(command, args, { encoding: 'utf8', timeout: 30 * 1000 });
        if (result.error || result.status !== 0) return '';
        return (result.stdout || '').trim();
    } catch {
        return '';
    }
}

module.exports = {
    run,
    commandOk,
    commandOutput,
    MINUTE,
    DEFAULT_TIMEOUT_MS,
};

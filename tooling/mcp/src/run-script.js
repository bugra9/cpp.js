import { spawn } from 'node:child_process';

const MAX_BUFFER_BYTES = 1024 * 1024;

export function runProcess(cmd, args, { cwd, env, timeoutMs = 600_000 } = {}) {
    return new Promise((resolve) => {
        const child = spawn(cmd, args, {
            cwd,
            env: { ...process.env, ...env },
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';
        let timedOut = false;

        const timer = setTimeout(() => {
            timedOut = true;
            child.kill('SIGTERM');
        }, timeoutMs);

        child.stdout.on('data', (chunk) => {
            stdout = appendCapped(stdout, chunk.toString());
        });
        child.stderr.on('data', (chunk) => {
            stderr = appendCapped(stderr, chunk.toString());
        });

        child.on('error', (err) => {
            clearTimeout(timer);
            resolve({ exitCode: null, stdout, stderr: stderr + `\n[spawn error] ${err.message}`, timedOut: false });
        });

        child.on('close', (code) => {
            clearTimeout(timer);
            resolve({ exitCode: code, stdout, stderr, timedOut });
        });
    });
}

function appendCapped(buffer, chunk) {
    const next = buffer + chunk;
    if (next.length <= MAX_BUFFER_BYTES) return next;
    const head = next.slice(0, MAX_BUFFER_BYTES / 2);
    const tail = next.slice(-MAX_BUFFER_BYTES / 2);
    return `${head}\n... [truncated ${next.length - MAX_BUFFER_BYTES} bytes] ...\n${tail}`;
}

export function runNodeScript(scriptPath, args, opts) {
    return runProcess(process.execPath, [scriptPath, ...args], opts);
}

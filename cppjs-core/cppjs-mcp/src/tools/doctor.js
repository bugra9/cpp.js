import path from 'node:path';
import fs from 'node:fs';
import { findCppjsRoot } from '../repo-root.js';
import { runProcess } from '../run-script.js';

export const name = 'cppjs_doctor';

export const config = {
    title: 'Check cpp.js toolchain prerequisites',
    description: 'Run the doctor.sh script to verify Node, pnpm, git, Docker, Android SDK/NDK, and Xcode. Returns the report verbatim. Best for diagnosing "why won\'t my package build" before invoking build_package.',
    inputSchema: {},
};

export async function handler() {
    const root = findCppjsRoot();
    if (!root) return error('cpp.js repo not found from cwd. Set the MCP working directory to your checkout.');

    const script = path.join(root, 'scripts', 'doctor.sh');
    if (!fs.existsSync(script)) return error(`doctor.sh not found at ${script}`);

    const { exitCode, stdout, stderr, timedOut } = await runProcess('bash', [script], { cwd: root, timeoutMs: 60_000 });
    if (timedOut) return error('doctor.sh timed out after 60s.');

    const text = `exit code: ${exitCode}\n\n${stdout}${stderr ? `\n[stderr]\n${stderr}` : ''}`;
    return {
        isError: exitCode !== 0,
        content: [{ type: 'text', text }],
    };
}

function error(message) {
    return { isError: true, content: [{ type: 'text', text: message }] };
}

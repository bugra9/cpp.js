import path from 'node:path';
import { z } from 'zod';
import { requireCppjsRoot } from '../repo-root.js';
import { runNodeScript } from '../run-script.js';

export const name = 'cppjs_check_native_versions';

export const config = {
    title: 'Check upstream native versions of cpp.js packages',
    description: 'Compare each cppjs-package-*\'s nativeVersion against the latest upstream release (GitHub releases / tags / project HTML download index). With update=true, auto-bump every package.json that\'s behind. Must run from inside the cpp.js monorepo.',
    inputSchema: {
        update: z.boolean().optional().describe('When true, write new nativeVersion values to package.json. When false (default), report only.'),
    },
};

export async function handler({ update = false } = {}) {
    const root = requireCppjsRoot();
    const script = path.join(root, 'scripts', 'check-native-versions.js');
    const args = update ? ['--update'] : [];

    const { exitCode, stdout, stderr, timedOut } = await runNodeScript(script, args, { cwd: root, timeoutMs: 5 * 60_000 });
    if (timedOut) return error('check-native-versions timed out after 5 min.');

    const text = `${stdout}${stderr ? `\n[stderr]\n${stderr}` : ''}`;
    return {
        isError: exitCode !== 0,
        content: [{ type: 'text', text }],
    };
}

function error(message) {
    return { isError: true, content: [{ type: 'text', text: message }] };
}

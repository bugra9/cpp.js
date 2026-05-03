import { z } from 'zod';
import { requireCppjsRoot } from '../repo-root.js';
import { runProcess } from '../run-script.js';

export const name = 'cppjs_build_package';

export const config = {
    title: 'Build a cppjs-package-* family',
    description: 'Invoke pnpm --filter to build the wasm / android / ios sub-arches of a given package. Long-running (minutes per arch). Must run from inside the cpp.js monorepo. Wasm + Android build on Linux/macOS; iOS only on macOS.',
    inputSchema: {
        name: z.string().describe('Package short name (without "cppjs-package-" prefix). e.g. "zlib" builds @cpp.js/package-zlib-{wasm,android,ios}.'),
        scope: z.string().optional().describe('npm scope. Defaults to "@cpp.js" (in-repo packages).'),
        arch: z
            .enum(['all', 'wasm', 'android', 'ios'])
            .optional()
            .describe('Which arch to build. Defaults to "all".'),
        timeoutMs: z.number().optional().describe('Override the 30-minute default timeout.'),
    },
};

export async function handler({ name: pkgName, scope = '@cpp.js', arch = 'all', timeoutMs = 30 * 60_000 }) {
    const root = requireCppjsRoot();
    const filter = arch === 'all'
        ? `${scope}/package-${pkgName}*`
        : `${scope}/package-${pkgName}-${arch}`;

    const { exitCode, stdout, stderr, timedOut } = await runProcess(
        'pnpm',
        ['--filter', filter, 'run', 'build'],
        { cwd: root, timeoutMs },
    );

    if (timedOut) {
        return error(`Build timed out after ${Math.round(timeoutMs / 60_000)} min for filter ${filter}.`);
    }

    const text = `pnpm --filter ${filter} run build\nexit code: ${exitCode}\n\n${stdout}${stderr ? `\n[stderr]\n${stderr}` : ''}`;
    return {
        isError: exitCode !== 0,
        content: [{ type: 'text', text }],
    };
}

function error(message) {
    return { isError: true, content: [{ type: 'text', text: message }] };
}

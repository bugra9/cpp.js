import { z } from 'zod';
import { requireCrossbindRoot } from '../repo-root.js';
import { runProcess } from '../run-script.js';

export const name = 'crossbind_build_port';

export const config = {
    title: 'Build a port family',
    description: 'Invoke pnpm --filter to build the wasm / android / ios targets of a given port. Long-running (minutes per arch). Must run from inside the crossbind monorepo. Wasm + Android build on Linux/macOS; iOS only on macOS.',
    inputSchema: {
        name: z.string().describe('Port short name, e.g. "zlib" builds @crossbind/port-zlib-{wasm,android,ios}.'),
        scope: z.string().optional().describe('npm scope. Defaults to "@crossbind" (in-repo packages).'),
        arch: z
            .enum(['all', 'wasm', 'android', 'ios'])
            .optional()
            .describe('Which arch to build. Defaults to "all".'),
        timeoutMs: z.number().optional().describe('Override the 30-minute default timeout.'),
    },
};

export async function handler({ name: pkgName, scope = '@crossbind', arch = 'all', timeoutMs = 30 * 60_000 }) {
    const root = requireCrossbindRoot();
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

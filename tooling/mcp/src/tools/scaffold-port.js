import path from 'node:path';
import { z } from 'zod';
import { requireCrossbindRoot } from '../repo-root.js';
import { runNodeScript } from '../run-script.js';

export const name = 'crossbind_scaffold_port';

export const config = {
    title: 'Scaffold a new port family',
    description: 'Create a new ports/<name> directory tree (base + wasm + android + ios targets) by copying the ports/zlib template and rewriting names, scope, license, and library symbols. Wraps scripts/scaffold-package.js. Must run from inside the crossbind monorepo.',
    inputSchema: {
        name: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'lowercase letters, digits and dashes only').describe('Short port name, e.g. "libsodium" → produces ports/libsodium.'),
        scope: z.string().optional().describe('npm scope. Pass "" (empty) for community / user-org unscoped packages. Defaults to "@crossbind".'),
        license: z.string().optional().describe('SPDX license identifier. Defaults to MIT.'),
        lib: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'letters, digits, underscore and dash only').optional().describe('Override the linker library name (lib<lib>.a). Defaults to <name>.'),
        output: z.string().optional().describe('Override output directory. Defaults to ports/<name>/.'),
        force: z.boolean().optional().describe('Overwrite an existing target directory. Defaults to false.'),
    },
};

export async function handler({ name: pkgName, scope, license, lib, output, force }) {
    const root = requireCrossbindRoot();
    const script = path.join(root, 'scripts', 'scaffold-package.js');
    const args = [pkgName];
    if (scope !== undefined) args.push('--scope', scope);
    if (license) args.push('--license', license);
    if (lib) args.push('--lib', lib);
    if (output) {
        const resolvedOutput = path.resolve(root, output);
        if (resolvedOutput !== root && !resolvedOutput.startsWith(`${root}${path.sep}`)) {
            return error('output must resolve inside the crossbind repository.');
        }
        args.push('--output', resolvedOutput);
    }
    if (force) args.push('--force');

    const { exitCode, stdout, stderr, timedOut } = await runNodeScript(script, args, { cwd: root, timeoutMs: 60_000 });
    if (timedOut) return error('scaffold-package timed out after 60s.');
    if (exitCode !== 0) return error(`scaffold-package exited with code ${exitCode}.\n${stderr}\n${stdout}`);

    return {
        content: [{ type: 'text', text: stdout.trim() || `Scaffolded ports/${pkgName}` }],
    };
}

function error(message) {
    return { isError: true, content: [{ type: 'text', text: message }] };
}

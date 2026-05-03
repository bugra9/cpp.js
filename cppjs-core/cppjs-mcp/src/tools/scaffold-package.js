import path from 'node:path';
import { z } from 'zod';
import { requireCppjsRoot } from '../repo-root.js';
import { runNodeScript } from '../run-script.js';

export const name = 'cppjs_scaffold_package';

export const config = {
    title: 'Scaffold a new cppjs-package-* family',
    description: 'Create a new cppjs-package-<name> directory tree (wasm + android + ios sub-arches) by copying the cppjs-package-zlib template and rewriting names, scope, license, and library symbols. Wraps scripts/scaffold-package.js. Must run from inside the cpp.js monorepo.',
    inputSchema: {
        name: z.string().describe('Short package name, e.g. "libsodium" → produces cppjs-package-libsodium.'),
        scope: z.string().optional().describe('npm scope. Pass "" (empty) for community / user-org unscoped packages. Defaults to "@cpp.js".'),
        license: z.string().optional().describe('SPDX license identifier. Defaults to MIT.'),
        lib: z.string().optional().describe('Override the linker library name (lib<lib>.a). Defaults to <name>.'),
        output: z.string().optional().describe('Override output directory. Defaults to cppjs-packages/cppjs-package-<name>/.'),
        force: z.boolean().optional().describe('Overwrite an existing target directory. Defaults to false.'),
    },
};

export async function handler({ name: pkgName, scope, license, lib, output, force }) {
    const root = requireCppjsRoot();
    const script = path.join(root, 'scripts', 'scaffold-package.js');
    const args = [pkgName];
    if (scope !== undefined) args.push('--scope', scope);
    if (license) args.push('--license', license);
    if (lib) args.push('--lib', lib);
    if (output) args.push('--output', output);
    if (force) args.push('--force');

    const { exitCode, stdout, stderr, timedOut } = await runNodeScript(script, args, { cwd: root, timeoutMs: 60_000 });
    if (timedOut) return error('scaffold-package timed out after 60s.');
    if (exitCode !== 0) return error(`scaffold-package exited with code ${exitCode}.\n${stderr}\n${stdout}`);

    return {
        content: [{ type: 'text', text: stdout.trim() || `Scaffolded cppjs-package-${pkgName}` }],
    };
}

function error(message) {
    return { isError: true, content: [{ type: 'text', text: message }] };
}

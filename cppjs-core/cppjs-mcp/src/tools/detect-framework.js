import path from 'node:path';
import { z } from 'zod';
import { findCppjsRoot } from '../repo-root.js';
import { runNodeScript } from '../run-script.js';

export const name = 'cppjs_detect_framework';

export const config = {
    title: 'Detect framework of a JS/TS project',
    description: 'Inspect a project directory and identify its bundler / runtime (vite, webpack, rspack, rollup, nextjs, react-native-cli, react-native-expo, cloudflare-worker, nodejs, vanilla). Returns a JSON match plus the recommended cpp.js integration playbook URL. Wraps scripts/detect-framework.js from the cpp.js repo.',
    inputSchema: {
        projectPath: z
            .string()
            .optional()
            .describe('Absolute path to the project directory. Defaults to the MCP server\'s cwd.'),
    },
};

export async function handler({ projectPath }) {
    const targetPath = projectPath ? path.resolve(projectPath) : process.cwd();
    // Always run the bundled script from the cpp.js checkout; a caller-supplied path would
    // let a prompt-injected agent execute an arbitrary file as node.
    const script = resolveDetectScript();

    if (!script) {
        return errorResponse(
            'Could not locate scripts/detect-framework.js. Either run the MCP server from inside a cpp.js checkout '
            + 'or pass scriptPath explicitly.',
        );
    }

    const { exitCode, stdout, stderr, timedOut } = await runNodeScript(script, [targetPath], { timeoutMs: 30_000 });

    if (timedOut) {
        return errorResponse('detect-framework timed out after 30s.');
    }
    if (exitCode !== 0) {
        return errorResponse(`detect-framework exited with code ${exitCode}.\n${stderr}`);
    }

    return {
        content: [{ type: 'text', text: stdout.trim() }],
    };
}

function resolveDetectScript() {
    const root = findCppjsRoot();
    return root ? path.join(root, 'scripts', 'detect-framework.js') : null;
}

function errorResponse(message) {
    return {
        isError: true,
        content: [{ type: 'text', text: message }],
    };
}

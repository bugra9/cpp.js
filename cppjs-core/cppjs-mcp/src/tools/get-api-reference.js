import path from 'node:path';
import fs from 'node:fs';
import { z } from 'zod';
import { findCppjsRoot } from '../repo-root.js';

export const name = 'cppjs_get_api_reference';

const TOPIC_TO_FILE = {
    index: 'README.md',
    init: 'init.md',
    config: 'cppjs-config.md',
    build: 'cppjs-build.md',
    filesystem: 'filesystem.md',
    threading: 'threading.md',
    'binding-rules': 'cpp-binding-rules.md',
    swig: 'swig-escape.md',
    state: 'build-state.md',
    overrides: 'overrides.md',
    troubleshooting: 'troubleshooting.md',
    performance: 'performance.md',
    lifecycle: 'lifecycle-and-types.md',
};

const GITHUB_BASE = 'https://github.com/bugra9/cpp.js/blob/main/docs/api';

export const config = {
    title: 'Get cpp.js API reference doc by topic',
    description: 'Return the canonical reference document for a cpp.js API surface. Use BEFORE answering questions about initCppJs(opts), cppjs.config.js fields, cppjs.build.js hooks, OPFS / persistent storage / filesystem, threading (st vs mt), useWorker, COOP/COEP, or edge-runtime limits. The 6 topics map 1:1 to docs/api/*.md files. Reads the file from the local cpp.js checkout when available; otherwise returns the GitHub URL the agent can fetch.',
    inputSchema: {
        topic: z
            .enum([
                'index', 'init', 'config', 'build', 'filesystem', 'threading',
                'binding-rules', 'swig', 'state', 'overrides',
                'troubleshooting', 'performance', 'lifecycle',
            ])
            .describe(
                'Which doc to return. '
                + 'index = the decision-tree landing page; '
                + 'init = initCppJs(opts) runtime API; '
                + 'config = cppjs.config.js (consumer build-time); '
                + 'build = cppjs.build.js (package author only); '
                + 'filesystem = OPFS / memfs / node-fs / edge fs decision tree; '
                + 'threading = runtime st vs mt + useWorker + COOP/COEP + edge limits; '
                + 'binding-rules = rules for writing C++ that cpp.js can auto-bind; '
                + 'swig = manual SWIG .i escape hatch; '
                + 'state = state and target object shapes for cppjs.build.js hooks; '
                + 'overrides = catalog of 20 override mechanisms (least to most invasive); '
                + 'troubleshooting = common errors mapped to fixes + tribal-knowledge gotchas; '
                + 'performance = default Emscripten / CMake flags + safe-override guide; '
                + 'lifecycle = JS-side memory management (none needed) + TypeScript notes.',
            ),
    },
};

export async function handler({ topic }) {
    const fileName = TOPIC_TO_FILE[topic];
    if (!fileName) {
        return errorResponse(`Unknown topic '${topic}'. Valid: ${Object.keys(TOPIC_TO_FILE).join(', ')}.`);
    }

    const url = `${GITHUB_BASE}/${fileName}`;
    const root = findCppjsRoot();

    if (root) {
        const filePath = path.join(root, 'docs', 'api', fileName);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            return {
                content: [
                    { type: 'text', text: `# Source: ${filePath}\n# Mirror: ${url}\n\n${content}` },
                ],
            };
        }
    }

    return {
        content: [
            {
                type: 'text',
                text: `Local docs/api/${fileName} not found (MCP not running inside a cpp.js checkout). Fetch the canonical version from:\n${url}`,
            },
        ],
    };
}

function errorResponse(message) {
    return { isError: true, content: [{ type: 'text', text: message }] };
}

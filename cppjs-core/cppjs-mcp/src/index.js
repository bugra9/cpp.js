import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import * as detectFramework from './tools/detect-framework.js';
import * as listPackages from './tools/list-packages.js';
import * as recommend from './tools/recommend.js';
import * as scaffoldPackage from './tools/scaffold-package.js';
import * as doctor from './tools/doctor.js';
import * as buildPackage from './tools/build-package.js';
import * as checkNativeVersions from './tools/check-native-versions.js';
import * as cloudBuildPackage from './tools/cloud-build-package.js';
import * as getApiReference from './tools/get-api-reference.js';

const TOOLS = [
    detectFramework,
    listPackages,
    recommend,
    scaffoldPackage,
    doctor,
    buildPackage,
    checkNativeVersions,
    cloudBuildPackage,
    getApiReference,
];

async function main() {
    const server = new McpServer({
        name: 'cppjs-mcp',
        version: '0.1.0',
    });

    for (const tool of TOOLS) {
        server.registerTool(tool.name, tool.config, async (args) => {
            try {
                return await tool.handler(args || {});
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Tool ${tool.name} failed: ${message}` }],
                };
            }
        });
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((err) => {
    process.stderr.write(`[cppjs-mcp] fatal: ${err?.stack || err}\n`);
    process.exit(1);
});

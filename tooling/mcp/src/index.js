import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import * as detectFramework from './tools/detect-framework.js';
import * as listPorts from './tools/list-ports.js';
import * as recommend from './tools/recommend.js';
import * as scaffoldPort from './tools/scaffold-port.js';
import * as doctor from './tools/doctor.js';
import * as buildPort from './tools/build-port.js';
import * as checkNativeVersions from './tools/check-native-versions.js';
import * as cloudBuildPort from './tools/cloud-build-port.js';
import * as getApiReference from './tools/get-api-reference.js';

const TOOLS = [
    detectFramework,
    listPorts,
    recommend,
    scaffoldPort,
    doctor,
    buildPort,
    checkNativeVersions,
    cloudBuildPort,
    getApiReference,
];

async function main() {
    const server = new McpServer({
        name: 'crossbind-mcp',
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
    process.stderr.write(`[crossbind-mcp] fatal: ${err?.stack || err}\n`);
    process.exit(1);
});

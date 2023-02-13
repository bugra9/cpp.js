import { findCMakeListsFile, createWasm } from 'cpp.js';
import rollupCppjsPlugin from 'rollup-plugin-cppjs';

import fs from 'fs';
import p from 'path';
import { tmpdir } from "os";

function createTempDir(folder) {
    let path = p.join(process.cwd(), 'node_modules', ".cppjs");
    if (folder) path = p.join(path, folder);

    if (fs.existsSync(path)) fs.rmSync(path, { recursive: true, force: true });
    fs.mkdirSync(path, { recursive: true });

    return path;
}

const viteCppjsPlugin = (options = {}) => {
    let isServe = false;
    const basePath = options.basePath ? p.resolve(options.basePath) : process.cwd();

    return [
        rollupCppjsPlugin(options),
        {
            name: 'vite-plugin-cppjs',
            load(source) {
                if (isServe && source === '/cpp.js') {
                    const cMakeListsFilePath = findCMakeListsFile();
                    createWasm(cMakeListsFilePath, options.tempDir, options.tempDir, {}, basePath);
                    return fs.readFileSync(`${options.tempDir}/cpp.js`, {encoding:'utf8', flag:'r'});
                }
            },
            configResolved(config) {
                isServe = config.command === 'serve';
                if (isServe) {
                    if (!options.tempDir) options.tempDir = createTempDir('a'+Math.random());
                    config.server.fs.allow.push(options.tempDir);
                }
            },
            configureServer(server) {
                if (isServe) {
                    server.middlewares.use((req, res, next) => {
                        if (req.url === '/cpp.wasm') req.url = '/@fs' +options.tempDir+ '/cpp.wasm';
                        next();
                    });
                }
            },
        }
    ]
};

export default viteCppjsPlugin;

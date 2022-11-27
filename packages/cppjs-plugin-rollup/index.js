import { createBridge, findCMakeListsFile, findOrCreateInterfaceFile, createWasm } from 'cpp.js';

import fs from 'fs';
import p from 'path';
import { tmpdir } from "os";

function createTempDir(folder) {
    let path = p.join(tmpdir(), "cppjs-app-cli");
    if (folder) path = p.join(path, folder);

    if (fs.existsSync(path)) fs.rmSync(path, { recursive: true, force: true });
    fs.mkdirSync(path, { recursive: true });

    return path;
}

const rollupCppjsPlugin = (options = {}) => {
    return {
        name: 'rollup-plugin-cppjs',
        buildStart() {
            if (!options.tempDir) options.tempDir = createTempDir('a'+Math.random());
        },
        resolveId ( source ) {
            if (source === '/cpp.js') {
                return { id: source, external: true };
            }
            return null;
        },
        async transform(code, path) {
            if (!/.h$/.test(path)) {
                return
            }

            const interfaceFile = findOrCreateInterfaceFile(path, options.tempDir);
            createBridge(interfaceFile, options.tempDir);

            return "export default function() { return new Promise((resolve, reject) => import('/cpp.js').then(n => n.default(resolve))); }";
        },
        generateBundle() {
            const cMakeListsFilePath = findCMakeListsFile();
            createWasm(cMakeListsFilePath, options.tempDir, options.tempDir, { cc: ['-O3'] });
            this.emitFile({
                type: "asset",
                source: fs.readFileSync(`${options.tempDir}/cpp.js`),
                fileName: "cpp.js"
            });
            this.emitFile({
                type: "asset",
                source: fs.readFileSync(`${options.tempDir}/cpp.wasm`),
                fileName: "cpp.wasm"
            });
            fs.rmSync(options.tempDir, { recursive: true, force: true });
        },
    }
};

export default rollupCppjsPlugin;

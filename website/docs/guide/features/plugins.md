# Plugins
When integrating Cpp.js into your project via a bundler, the process is streamlined through the use of plugins. This allows for seamless automation of various tasks. This documentation will guide you through the plugin architecture, using the Rollup and Vite plugins as a reference example. Additionally, you have the flexibility to develop and publish your own plugins as needed.

### Plugin Structure

The plugin structure for bundlers can be categorized into two primary segments: general and development. In the general segment, the plugin manages tasks such as locating imported packages (**resolveId**), reading the relevant files within those packages (**load**), transforming code (**transform**), and creating a bundled output (**generateBundle**).

In the development segment, the focus shifts to tasks like implementing hot module replacement (**handleHotUpdate**) and configuring the development server (**configureServer**).

| Hook | Description |
| ---: | ----------- |
| **resolveId** | locating imported packages |
| **load** | reading the relevant files |
| **transform** | transforming code |
| **generateBundle** | creating a bundled output |
| <br /> |
| **configureServer** | configuring the development server |
| **handleHotUpdate** | hot module replacement  (HMR) |

**Note:** Hook names differ per plugin. The table is based on Rollup and Vite.

### Resolving Package Files
A JavaScript file can import a module from the Cpp.js package it depends on.

Here is a minimal example:
```js title="cppjs.config.js"
import gdal3js from 'gdal3.js/cppjs.config.js';

export default {
    dependencies: [
        gdal3js,
    ]
    paths: {
        config: import.meta.url,
    },
};
```

```js title="src/index.js"
import { initCppJs } from 'gdal3.js/Gdal.h';
```

To resolve packages files correctly, integration via a hook is required.

Here is a minimal example:
```js title="@cpp.js/plugin-rollup/index.js"

import { state, createLib, createBridgeFile, buildWasm, getCppJsScript, getDependFilePath } from 'cpp.js';
import fs from 'node:fs';
import p from 'node:path';

const rollupCppjsPlugin = (options, bridges = []) => {
    return {
        name: 'rollup-plugin-cppjs',
        resolveId(source) {
            if (source === '/cpp.js') {
                return { id: source, external: true };
            }
            if (source === 'cpp.js') {
                return { id: source, external: false };
            }

            const dependFilePath = getDependFilePath(source, 'Emscripten-x86_64');
            if (dependFilePath) {
                return dependFilePath;
            }

            return null;
        },
    };
};

export default rollupCppjsPlugin;
```

### Create Bridge Files and Return Cpp.js Script
The `createBridgeFile` function in Cpp.js generates a bridge file for the imported header and returns the bridge file path.

Here is a minimal example:
```diff title="@cpp.js/plugin-rollup/index.js"
const rollupCppjsPlugin = (options, bridges = []) => {
+   const headerRegex = new RegExp(`\\.(${state.config.ext.header.join('|')})$`);
+   const moduleRegex = new RegExp(`\\.(${state.config.ext.module.join('|')})$`);

    return {
        name: 'rollup-plugin-cppjs',
        resolveId(source) {},
+       async transform(code, path) {
+           if (!headerRegex.test(path) && !moduleRegex.test(path)) {
+               return null;
+           }
+
+           const bridgeFile = createBridgeFile(path);
+           bridges.push(bridgeFile);
+
+           return getCppJsScript('Emscripten-x86_64', bridgeFile);
+       },
+       load(id) {
+           if (id === 'cpp.js') {
+               return getCppJsScript('Emscripten-x86_64');
+           }
+           return null;
+       }
    };
};
```

### Compile
For web projects, the code is compiled to WebAssembly using `createLib` and `buildWasm` function. As a result of the compilation, the following files are generated in the `temp` directory:

- `NAME.browser.js`
- `NAME.wasm`
- `NAME.data.txt`

These files should then be moved to the appropriate location to complete the build process.

Here is a minimal example:
```diff title="@cpp.js/plugin-rollup/index.js"
const rollupCppjsPlugin = (options, bridges = []) => {
    return {
        name: 'rollup-plugin-cppjs',
        resolveId(source) {},
        async transform(code, path) {},
+       async generateBundle() {
+           createLib('Emscripten-x86_64', 'Source', { isProd: true, buildSource: true });
+           createLib('Emscripten-x86_64', 'Bridge', { isProd: true, buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/commonBridges.cpp`, ...bridges] });
+           await buildWasm('browser', true);
+           await buildWasm('node', true);
+           this.emitFile({
+               type: 'asset',
+               source: fs.readFileSync(`${state.config.paths.build}/${state.config.general.name}.browser.js`),
+               fileName: 'cpp.js',
+           });
+           this.emitFile({
+               type: 'asset',
+               source: fs.readFileSync(`${state.config.paths.build}/${state.config.general.name}.wasm`),
+               fileName: 'cpp.wasm',
+           });
+           const dataFilePath = `${state.config.paths.build}/${state.config.general.name}.data.txt`;
+           if (fs.existsSync(dataFilePath)) {
+               this.emitFile({
+                   type: 'asset',
+                   source: fs.readFileSync(dataFilePath),
+                   fileName: 'cpp.data.txt',
+               });
+           }
+       },
    };
};
```

### Configuring the Development Server
To ensure Cpp.js operates correctly in the development server environment, follow these steps:

- **Allow Access to Cpp.js Temp Path:**
  Make sure the development server configuration permits access to the directory where Cpp.js stores its temporary files, typically generated by the `buildWasm` function.

- **Serve JavaScript Files:**
  Configure your server to compile and return the `NAME.browser.js` file from the temp path when a request is made to the `/cpp.js` endpoint. This can be achieved using server-specific routing or middleware.

- **Serve WebAssembly Files:**
  Similarly, set up your server to return the `NAME.wasm` file from the temp path when a request is made to the `/cpp.wasm` endpoint.

Here is a minimal example:
```js title="@cpp.js/plugin-vite/index.js"
import { state, createLib, createBridgeFile, buildWasm } from 'cpp.js';
import rollupCppjsPlugin from '@cpp.js/plugin-rollup';
import fs from 'node:fs';

const viteCppjsPlugin = (options) => {
    let isServe = false;
    const bridges = [];
    const headerRegex = new RegExp(`\\.(${state.config.ext.header.join('|')})$`);
    const sourceRegex = new RegExp(`\\.(${state.config.ext.source.join('|')})$`);

    return [
        rollupCppjsPlugin(options, bridges),
        {
            name: 'vite-plugin-cppjs',
            async load(source) {
                if (isServe && source === '/cpp.js') {
                    createLib('Emscripten-x86_64', 'Source', { isProd: false, buildSource: true });
                    createLib('Emscripten-x86_64', 'Bridge', { isProd: false, buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/commonBridges.cpp`, ...bridges] });
                    await buildWasm('browser', false);
                    return fs.readFileSync(`${state.config.paths.build}/${state.config.general.name}.browser.js`, { encoding: 'utf8', flag: 'r' });
                }
                return null;
            },
            configResolved(config) {
                isServe = config.command === 'serve';
                if (isServe) {
                    config.server.fs.allow.push(state.config.paths.build);
                }
            },
            configureServer(server) {
                if (isServe) {
                    server.middlewares.use((req, res, next) => {
                        if (req.url === '/cpp.wasm') req.url = `/@fs/${state.config.paths.build}/${state.config.general.name}.wasm`;
                        next();
                    });
                }
            },
        },
    ];
};

export default viteCppjsPlugin;
```

### Hot Module Replacement (HMR)
Enable HMR by watching native file changes, recompiling with `createLib` and `buildWasm`, and using WebSockets to refresh updates.

Here is a minimal example:
```diff title="@cpp.js/plugin-vite/index.js"
const viteCppjsPlugin = (options) => {
    let isServe = false;
    const bridges = [];
    const headerRegex = new RegExp(`\\.(${state.config.ext.header.join('|')})$`);
    const sourceRegex = new RegExp(`\\.(${state.config.ext.source.join('|')})$`);

    return [
        rollupCppjsPlugin(options, bridges),
        {
            name: 'vite-plugin-cppjs',
            async load(source) {},
            configResolved(config) {},
            configureServer(server) {},
+           async handleHotUpdate({ file, server }) {
+               if (file.startsWith(state.config.paths.build)) {
+                   return;
+               }
+               if (headerRegex.test(file)) {
+                   const bridgeFile = createBridgeFile(file);
+                   bridges.push(bridgeFile);
+                   createLib('Emscripten-x86_64', 'Bridge', { isProd: false, buildSource: false, nativeGlob: [`${state.config.paths.cli}/assets/commonBridges.cpp`, ...bridges] });
+                   await buildWasm('browser', true);
+                   server.ws.send({ type: 'full-reload' });
+               } else if (sourceRegex.test(file)) {
+                   createLib('Emscripten-x86_64', 'Source', { isProd: false, buildSource: true, bypassCmake: true });
+                   await buildWasm('browser', false);
+                   server.ws.send({ type: 'full-reload' });
+               }
+           },
        },
    ];
};
```

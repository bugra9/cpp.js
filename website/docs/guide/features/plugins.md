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
import { initCppJs } 'gdal3.js/Gdal.h';
```

In prebuilt Cpp.js packages, header files are located in the `dist/prebuilt/PLATFORM_NAME/include` directory, and SWIG module files can be found in the `dist/prebuilt/PLATFORM_NAME/swig` directory. To resolve these files correctly, integration via a hook is required.

Here is a minimal example:
```js title="@cpp.js/plugin-rollup/index.js"

import CppjsCompiler from 'cpp.js';
import fs from 'node:fs';
import p from 'node:path';

const platform = 'Emscripten-x86_64';
const rollupCppjsPlugin = (options, _compiler) => {
    const compiler = _compiler || new CppjsCompiler();
    const headerRegex = new RegExp(`\\.(${compiler.config.ext.header.join('|')})$`);
    const moduleRegex = new RegExp(`\\.(${compiler.config.ext.module.join('|')})$`);
    const dependPackageNames = compiler.config.getAllDependencies();

    return {
        name: 'rollup-plugin-cppjs',
        resolveId(source) {
            if (source === '/cpp.js') {
                return { id: source, external: true };
            }
            if (source === 'cpp.js') {
                return { id: source, external: false };
            }

            const dependPackage = dependPackageNames.find((d) => source.startsWith(d.package.name));
            if (dependPackage) {
                const filePath = source.substring(dependPackage.package.name.length + 1);

                let path = `${dependPackage.paths.output}/prebuilt/${platform}/${filePath}`;
                if (headerRegex.test(source)) {
                    path = `${dependPackage.paths.output}/prebuilt/${platform}/include/${filePath}`;
                } else if (moduleRegex.test(source)) {
                    path = `${dependPackage.paths.output}/prebuilt/${platform}/swig/${filePath}`;
                }

                return path;
            }
            return null;
        },
    };
};

export default rollupCppjsPlugin;
```

### Create or Locate SWIG Module Files
The `findOrCreateInterfaceFile` function in Cpp.js generates a simple SWIG module file for the imported header and registers it with the system. If a SWIG module file is imported instead of a header, it is registered with the system directly.

To execute these processes, the `findOrCreateInterfaceFile` function must be called for both the imported headers and SWIG modules.

Here is a minimal example:
```diff title="@cpp.js/plugin-rollup/index.js"
const rollupCppjsPlugin = (options, _compiler) => {
    const compiler = _compiler || new CppjsCompiler();
    const headerRegex = new RegExp(`\\.(${compiler.config.ext.header.join('|')})$`);
    const moduleRegex = new RegExp(`\\.(${compiler.config.ext.module.join('|')})$`);

    return {
        name: 'rollup-plugin-cppjs',
        resolveId(source) {},
+       async transform(code, path) {
+           if (!headerRegex.test(path) && !moduleRegex.test(path)) {
+               return null;
+           }
+
+           compiler.findOrCreateInterfaceFile(path);
+           return CppJs;
+       }
    };
};
```

### Create Bridge and Compile
To create a C++ bridge from the registered SWIG module files, use the `createBridge` function.

For web projects, the code is compiled to WebAssembly using the `createWasm` function. As a result of the compilation, the following files are generated in the `temp` directory:

- `NAME.browser.js`
- `NAME.wasm`
- `NAME.data.txt`

These files should then be moved to the appropriate location to complete the build process.

Here is a minimal example:
```diff title="@cpp.js/plugin-rollup/index.js"
const rollupCppjsPlugin = (options, _compiler) => {
    const compiler = _compiler || new CppjsCompiler();

    return {
        name: 'rollup-plugin-cppjs',
        resolveId(source) {},
        async transform(code, path) {},
+       async generateBundle() {
+           compiler.createBridge();
+           await compiler.createWasm({ cc: ['-O3'] });
+           this.emitFile({
+               type: 'asset',
+               source: fs.readFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.browser.js`),
+               fileName: 'cpp.js',
+           });
+           this.emitFile({
+               type: 'asset',
+               source: fs.readFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.wasm`),
+               fileName: 'cpp.wasm',
+           });
+           const dataFilePath = `${compiler.config.paths.temp}/${compiler.config.general.name}.data.txt`;
+           if (fs.existsSync(dataFilePath)) {
+               this.emitFile({
+                   type: 'asset',
+                   source: fs.readFileSync(dataFilePath),
+                   fileName: 'cpp.data.txt',
+               });
+           }
+           const isWatching = process.argv.includes('-w') || process.argv.includes('--watch');
+           if (!isWatching) {
+               fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
+           }
+       },
    };
};
```

### Encapsulate the Output
To transmit the configuration, encapsulate the output.

Here is a minimal example:
```diff title="@cpp.js/plugin-rollup/index.js"
const rollupCppjsPlugin = (options, _compiler) => {
    const compiler = _compiler || new CppjsCompiler();
+   const env = JSON.stringify(compiler.getData('env'));

+   const params = `{
+       ...config,
+       env: {...${env}, ...config.env},
+       paths: {
+           wasm: 'cpp.wasm',
+           data: 'cpp.data.txt'
+       }
+   }`;
+
+   const CppJs = `
+       export let Native = {};
+       export function initCppJs(config = {}) {
+           return new Promise(
+               (resolve, reject) => import('/cpp.js').then(n => { return window.CppJs.initCppJs(${params})}).then(m => {
+                   Native = m;
+                   resolve(m);
+               })
+           );
+       }
+   `;

    return {
        name: 'rollup-plugin-cppjs',
        resolveId(source) {},
        async transform(code, path) {},
        async generateBundle() {},
+       load(id) {
+           if (id === 'cpp.js') {
+               return CppJs;
+           }
+           return null;
+       },
    };
};
```

### Configuring the Development Server
To ensure Cpp.js operates correctly in the development server environment, follow these steps:

- **Allow Access to Cpp.js Temp Path:**
  Make sure the development server configuration permits access to the directory where Cpp.js stores its temporary files, typically generated by the `createWasm` function.

- **Serve JavaScript Files:**
  Configure your server to compile and return the `NAME.browser.js` file from the temp path when a request is made to the `/cpp.js` endpoint. This can be achieved using server-specific routing or middleware.

- **Serve WebAssembly Files:**
  Similarly, set up your server to return the `NAME.wasm` file from the temp path when a request is made to the `/cpp.wasm` endpoint.

Here is a minimal example:
```js title="@cpp.js/plugin-vite/index.js"
import CppjsCompiler from 'cpp.js';
import rollupCppjsPlugin from '@cpp.js/plugin-rollup';
import fs from 'node:fs';

const viteCppjsPlugin = (options, _compiler) => {
    let isServe = false;
    const compiler = _compiler || new CppjsCompiler();
    const headerRegex = new RegExp(`\\.(${compiler.config.ext.header.join('|')})$`);
    const sourceRegex = new RegExp(`\\.(${compiler.config.ext.source.join('|')})$`);

    return [
        rollupCppjsPlugin(options, compiler),
        {
            name: 'vite-plugin-cppjs',
            async load(source) {
                if (isServe && source === '/cpp.js') {
                    compiler.createBridge();
                    await compiler.createWasm();
                    return fs.readFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.browser.js`, { encoding: 'utf8', flag: 'r' });
                }
                return null;
            },
            configResolved(config) {
                isServe = config.command === 'serve';
                if (isServe) {
                    config.server.fs.allow.push(compiler.config.paths.temp);
                }
            },
            configureServer(server) {
                if (isServe) {
                    server.middlewares.use((req, res, next) => {
                        if (req.url === '/cpp.wasm') req.url = `/@fs${compiler.config.paths.temp}/${compiler.config.general.name}.wasm`;
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
Enable HMR by watching native file changes, recompiling with `createWasm`, and using WebSockets to refresh updates.

Here is a minimal example:
```diff title="@cpp.js/plugin-vite/index.js"
const viteCppjsPlugin = (options, _compiler) => {
    let isServe = false;
    const compiler = _compiler || new CppjsCompiler();
    const headerRegex = new RegExp(`\\.(${compiler.config.ext.header.join('|')})$`);
    const sourceRegex = new RegExp(`\\.(${compiler.config.ext.source.join('|')})$`);

    return [
        rollupCppjsPlugin(options, compiler),
        {
            name: 'vite-plugin-cppjs',
            async load(source) {},
            configResolved(config) {},
            configureServer(server) {},
+           async handleHotUpdate({ file, server }) {
+               if (file.startsWith(compiler.config.paths.temp)) {
+                   return;
+               }
+               if (headerRegex.test(file)) {
+                   compiler.findOrCreateInterfaceFile(file);
+                   compiler.createBridge();
+               } else if (sourceRegex.test(file)) {
+                   await compiler.createWasm();
+                   server.ws.send({ type: 'full-reload' });
+               }
+           },
        },
    ];
};
```

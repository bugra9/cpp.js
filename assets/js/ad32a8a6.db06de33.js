"use strict";(self.webpackChunk_cpp_js_website=self.webpackChunk_cpp_js_website||[]).push([[3806],{2168:(e,n,r)=>{r.r(n),r.d(n,{assets:()=>c,contentTitle:()=>l,default:()=>d,frontMatter:()=>s,metadata:()=>o,toc:()=>a});var t=r(7512),i=r(2436);const s={},l="Plugins",o={id:"guide/features/plugins",title:"Plugins",description:"When integrating Cpp.js into your project via a bundler, the process is streamlined through the use of plugins. This allows for seamless automation of various tasks. This documentation will guide you through the plugin architecture, using the Rollup and Vite plugins as a reference example. Additionally, you have the flexibility to develop and publish your own plugins as needed.",source:"@site/docs/guide/features/plugins.md",sourceDirName:"guide/features",slug:"/guide/features/plugins",permalink:"/docs/guide/features/plugins",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"guide",previous:{title:"Packages",permalink:"/docs/guide/features/packages"}},c={},a=[{value:"Plugin Structure",id:"plugin-structure",level:3},{value:"Resolving Package Files",id:"resolving-package-files",level:3},{value:"Create or Locate SWIG Module Files",id:"create-or-locate-swig-module-files",level:3},{value:"Create Bridge and Compile",id:"create-bridge-and-compile",level:3},{value:"Encapsulate the Output",id:"encapsulate-the-output",level:3},{value:"Configuring the Development Server",id:"configuring-the-development-server",level:3},{value:"Hot Module Replacement (HMR)",id:"hot-module-replacement-hmr",level:3}];function p(e){const n={code:"code",h1:"h1",h3:"h3",header:"header",li:"li",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",ul:"ul",...(0,i.M)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.header,{children:(0,t.jsx)(n.h1,{id:"plugins",children:"Plugins"})}),"\n",(0,t.jsx)(n.p,{children:"When integrating Cpp.js into your project via a bundler, the process is streamlined through the use of plugins. This allows for seamless automation of various tasks. This documentation will guide you through the plugin architecture, using the Rollup and Vite plugins as a reference example. Additionally, you have the flexibility to develop and publish your own plugins as needed."}),"\n",(0,t.jsx)(n.h3,{id:"plugin-structure",children:"Plugin Structure"}),"\n",(0,t.jsxs)(n.p,{children:["The plugin structure for bundlers can be categorized into two primary segments: general and development. In the general segment, the plugin manages tasks such as locating imported packages (",(0,t.jsx)(n.strong,{children:"resolveId"}),"), reading the relevant files within those packages (",(0,t.jsx)(n.strong,{children:"load"}),"), transforming code (",(0,t.jsx)(n.strong,{children:"transform"}),"), and creating a bundled output (",(0,t.jsx)(n.strong,{children:"generateBundle"}),")."]}),"\n",(0,t.jsxs)(n.p,{children:["In the development segment, the focus shifts to tasks like implementing hot module replacement (",(0,t.jsx)(n.strong,{children:"handleHotUpdate"}),") and configuring the development server (",(0,t.jsx)(n.strong,{children:"configureServer"}),")."]}),"\n",(0,t.jsxs)(n.table,{children:[(0,t.jsx)(n.thead,{children:(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.th,{style:{textAlign:"right"},children:"Hook"}),(0,t.jsx)(n.th,{children:"Description"})]})}),(0,t.jsxs)(n.tbody,{children:[(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{style:{textAlign:"right"},children:(0,t.jsx)(n.strong,{children:"resolveId"})}),(0,t.jsx)(n.td,{children:"locating imported packages"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{style:{textAlign:"right"},children:(0,t.jsx)(n.strong,{children:"load"})}),(0,t.jsx)(n.td,{children:"reading the relevant files"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{style:{textAlign:"right"},children:(0,t.jsx)(n.strong,{children:"transform"})}),(0,t.jsx)(n.td,{children:"transforming code"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{style:{textAlign:"right"},children:(0,t.jsx)(n.strong,{children:"generateBundle"})}),(0,t.jsx)(n.td,{children:"creating a bundled output"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{style:{textAlign:"right"},children:(0,t.jsx)("br",{})}),(0,t.jsx)(n.td,{})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{style:{textAlign:"right"},children:(0,t.jsx)(n.strong,{children:"configureServer"})}),(0,t.jsx)(n.td,{children:"configuring the development server"})]}),(0,t.jsxs)(n.tr,{children:[(0,t.jsx)(n.td,{style:{textAlign:"right"},children:(0,t.jsx)(n.strong,{children:"handleHotUpdate"})}),(0,t.jsx)(n.td,{children:"hot module replacement  (HMR)"})]})]})]}),"\n",(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:"Note:"})," Hook names differ per plugin. The table is based on Rollup and Vite."]}),"\n",(0,t.jsx)(n.h3,{id:"resolving-package-files",children:"Resolving Package Files"}),"\n",(0,t.jsx)(n.p,{children:"A JavaScript file can import a module from the Cpp.js package it depends on."}),"\n",(0,t.jsx)(n.p,{children:"Here is a minimal example:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-js",metastring:'title="cppjs.config.js"',children:"import getDirName from 'cpp.js/src/utils/getDirName.js';\nimport gdal3js from 'gdal3.js/cppjs.config.js';\n\nexport default {\n    dependencies: [\n        gdal3js,\n    ]\n    paths: {\n        project: getDirName(import.meta.url),\n    },\n};\n"})}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-js",metastring:'title="src/index.js"',children:"import { initCppJs } 'gdal3.js/Gdal.h';\n"})}),"\n",(0,t.jsxs)(n.p,{children:["In prebuilt Cpp.js packages, header files are located in the ",(0,t.jsx)(n.code,{children:"dist/prebuilt/PLATFORM_NAME/include"})," directory, and SWIG module files can be found in the ",(0,t.jsx)(n.code,{children:"dist/prebuilt/PLATFORM_NAME/swig"})," directory. To resolve these files correctly, integration via a hook is required."]}),"\n",(0,t.jsx)(n.p,{children:"Here is a minimal example:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-js",metastring:'title="@cpp.js/plugin-rollup/index.js"',children:"\nimport CppjsCompiler from 'cpp.js';\nimport fs from 'fs';\nimport p from 'path';\n\nconst platform = 'Emscripten-x86_64';\nconst rollupCppjsPlugin = (options, _compiler) => {\n    const compiler = _compiler || new CppjsCompiler();\n    const headerRegex = new RegExp(`\\\\.(${compiler.config.ext.header.join('|')})$`);\n    const moduleRegex = new RegExp(`\\\\.(${compiler.config.ext.module.join('|')})$`);\n    const dependPackageNames = compiler.config.getAllDependencies();\n\n    return {\n        name: 'rollup-plugin-cppjs',\n        resolveId(source) {\n            if (source === '/cpp.js') {\n                return { id: source, external: true };\n            }\n            if (source === 'cpp.js') {\n                return { id: source, external: false };\n            }\n\n            const dependPackage = dependPackageNames.find((d) => source.startsWith(d.package.name));\n            if (dependPackage) {\n                const filePath = source.substring(dependPackage.package.name.length + 1);\n\n                let path = `${dependPackage.paths.output}/prebuilt/${platform}/${filePath}`;\n                if (headerRegex.test(source)) {\n                    path = `${dependPackage.paths.output}/prebuilt/${platform}/include/${filePath}`;\n                } else if (moduleRegex.test(source)) {\n                    path = `${dependPackage.paths.output}/prebuilt/${platform}/swig/${filePath}`;\n                }\n\n                return path;\n            }\n            return null;\n        },\n    };\n};\n\nexport default rollupCppjsPlugin;\n"})}),"\n",(0,t.jsx)(n.h3,{id:"create-or-locate-swig-module-files",children:"Create or Locate SWIG Module Files"}),"\n",(0,t.jsxs)(n.p,{children:["The ",(0,t.jsx)(n.code,{children:"findOrCreateInterfaceFile"})," function in Cpp.js generates a simple SWIG module file for the imported header and registers it with the system. If a SWIG module file is imported instead of a header, it is registered with the system directly."]}),"\n",(0,t.jsxs)(n.p,{children:["To execute these processes, the ",(0,t.jsx)(n.code,{children:"findOrCreateInterfaceFile"})," function must be called for both the imported headers and SWIG modules."]}),"\n",(0,t.jsx)(n.p,{children:"Here is a minimal example:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-diff",metastring:'title="@cpp.js/plugin-rollup/index.js"',children:"const rollupCppjsPlugin = (options, _compiler) => {\n    const compiler = _compiler || new CppjsCompiler();\n    const headerRegex = new RegExp(`\\\\.(${compiler.config.ext.header.join('|')})$`);\n    const moduleRegex = new RegExp(`\\\\.(${compiler.config.ext.module.join('|')})$`);\n\n    return {\n        name: 'rollup-plugin-cppjs',\n        resolveId(source) {},\n+       async transform(code, path) {\n+           if (!headerRegex.test(path) && !moduleRegex.test(path)) {\n+               return null;\n+           }\n+\n+           compiler.findOrCreateInterfaceFile(path);\n+           return CppJs;\n+       }\n    };\n};\n"})}),"\n",(0,t.jsx)(n.h3,{id:"create-bridge-and-compile",children:"Create Bridge and Compile"}),"\n",(0,t.jsxs)(n.p,{children:["To create a C++ bridge from the registered SWIG module files, use the ",(0,t.jsx)(n.code,{children:"createBridge"})," function."]}),"\n",(0,t.jsxs)(n.p,{children:["For web projects, the code is compiled to WebAssembly using the ",(0,t.jsx)(n.code,{children:"createWasm"})," function. As a result of the compilation, the following files are generated in the ",(0,t.jsx)(n.code,{children:"temp"})," directory:"]}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:"NAME.browser.js"})}),"\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:"NAME.wasm"})}),"\n",(0,t.jsx)(n.li,{children:(0,t.jsx)(n.code,{children:"NAME.data.txt"})}),"\n"]}),"\n",(0,t.jsx)(n.p,{children:"These files should then be moved to the appropriate location to complete the build process."}),"\n",(0,t.jsx)(n.p,{children:"Here is a minimal example:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-diff",metastring:'title="@cpp.js/plugin-rollup/index.js"',children:"const rollupCppjsPlugin = (options, _compiler) => {\n    const compiler = _compiler || new CppjsCompiler();\n\n    return {\n        name: 'rollup-plugin-cppjs',\n        resolveId(source) {},\n        async transform(code, path) {},\n+       async generateBundle() {\n+           compiler.createBridge();\n+           await compiler.createWasm({ cc: ['-O3'] });\n+           this.emitFile({\n+               type: 'asset',\n+               source: fs.readFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.browser.js`),\n+               fileName: 'cpp.js',\n+           });\n+           this.emitFile({\n+               type: 'asset',\n+               source: fs.readFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.wasm`),\n+               fileName: 'cpp.wasm',\n+           });\n+           const dataFilePath = `${compiler.config.paths.temp}/${compiler.config.general.name}.data.txt`;\n+           if (fs.existsSync(dataFilePath)) {\n+               this.emitFile({\n+                   type: 'asset',\n+                   source: fs.readFileSync(dataFilePath),\n+                   fileName: 'cpp.data.txt',\n+               });\n+           }\n+           const isWatching = process.argv.includes('-w') || process.argv.includes('--watch');\n+           if (!isWatching) {\n+               fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });\n+           }\n+       },\n    };\n};\n"})}),"\n",(0,t.jsx)(n.h3,{id:"encapsulate-the-output",children:"Encapsulate the Output"}),"\n",(0,t.jsx)(n.p,{children:"To transmit the configuration, encapsulate the output."}),"\n",(0,t.jsx)(n.p,{children:"Here is a minimal example:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-diff",metastring:'title="@cpp.js/plugin-rollup/index.js"',children:"const rollupCppjsPlugin = (options, _compiler) => {\n    const compiler = _compiler || new CppjsCompiler();\n+   const env = JSON.stringify(compiler.getData('env'));\n\n+   const params = `{\n+       ...config,\n+       env: {...${env}, ...config.env},\n+       paths: {\n+           wasm: 'cpp.wasm',\n+           data: 'cpp.data.txt'\n+       }\n+   }`;\n+\n+   const CppJs = `\n+       export let Native = {};\n+       export function initCppJs(config = {}) {\n+           return new Promise(\n+               (resolve, reject) => import('/cpp.js').then(n => { return window.CppJs.initCppJs(${params})}).then(m => {\n+                   Native = m;\n+                   resolve(m);\n+               })\n+           );\n+       }\n+   `;\n\n    return {\n        name: 'rollup-plugin-cppjs',\n        resolveId(source) {},\n        async transform(code, path) {},\n        async generateBundle() {},\n+       load(id) {\n+           if (id === 'cpp.js') {\n+               return CppJs;\n+           }\n+           return null;\n+       },\n    };\n};\n"})}),"\n",(0,t.jsx)(n.h3,{id:"configuring-the-development-server",children:"Configuring the Development Server"}),"\n",(0,t.jsx)(n.p,{children:"To ensure Cpp.js operates correctly in the development server environment, follow these steps:"}),"\n",(0,t.jsxs)(n.ul,{children:["\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:"Allow Access to Cpp.js Temp Path:"}),"\nMake sure the development server configuration permits access to the directory where Cpp.js stores its temporary files, typically generated by the ",(0,t.jsx)(n.code,{children:"createWasm"})," function."]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:"Serve JavaScript Files:"}),"\nConfigure your server to compile and return the ",(0,t.jsx)(n.code,{children:"NAME.browser.js"})," file from the temp path when a request is made to the ",(0,t.jsx)(n.code,{children:"/cpp.js"})," endpoint. This can be achieved using server-specific routing or middleware."]}),"\n"]}),"\n",(0,t.jsxs)(n.li,{children:["\n",(0,t.jsxs)(n.p,{children:[(0,t.jsx)(n.strong,{children:"Serve WebAssembly Files:"}),"\nSimilarly, set up your server to return the ",(0,t.jsx)(n.code,{children:"NAME.wasm"})," file from the temp path when a request is made to the ",(0,t.jsx)(n.code,{children:"/cpp.wasm"})," endpoint."]}),"\n"]}),"\n"]}),"\n",(0,t.jsx)(n.p,{children:"Here is a minimal example:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-js",metastring:'title="@cpp.js/plugin-vite/index.js"',children:"import CppjsCompiler from 'cpp.js';\nimport rollupCppjsPlugin from '@cpp.js/plugin-rollup';\nimport fs from 'fs';\n\nconst viteCppjsPlugin = (options, _compiler) => {\n    let isServe = false;\n    const compiler = _compiler || new CppjsCompiler();\n    const headerRegex = new RegExp(`\\\\.(${compiler.config.ext.header.join('|')})$`);\n    const sourceRegex = new RegExp(`\\\\.(${compiler.config.ext.source.join('|')})$`);\n\n    return [\n        rollupCppjsPlugin(options, compiler),\n        {\n            name: 'vite-plugin-cppjs',\n            async load(source) {\n                if (isServe && source === '/cpp.js') {\n                    compiler.createBridge();\n                    await compiler.createWasm();\n                    return fs.readFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.browser.js`, { encoding: 'utf8', flag: 'r' });\n                }\n                return null;\n            },\n            configResolved(config) {\n                isServe = config.command === 'serve';\n                if (isServe) {\n                    config.server.fs.allow.push(compiler.config.paths.temp);\n                }\n            },\n            configureServer(server) {\n                if (isServe) {\n                    server.middlewares.use((req, res, next) => {\n                        if (req.url === '/cpp.wasm') req.url = `/@fs${compiler.config.paths.temp}/${compiler.config.general.name}.wasm`;\n                        next();\n                    });\n                }\n            },\n        },\n    ];\n};\n\nexport default viteCppjsPlugin;\n"})}),"\n",(0,t.jsx)(n.h3,{id:"hot-module-replacement-hmr",children:"Hot Module Replacement (HMR)"}),"\n",(0,t.jsxs)(n.p,{children:["Enable HMR by watching native file changes, recompiling with ",(0,t.jsx)(n.code,{children:"createWasm"}),", and using WebSockets to refresh updates."]}),"\n",(0,t.jsx)(n.p,{children:"Here is a minimal example:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-diff",metastring:'title="@cpp.js/plugin-vite/index.js"',children:"const viteCppjsPlugin = (options, _compiler) => {\n    let isServe = false;\n    const compiler = _compiler || new CppjsCompiler();\n    const headerRegex = new RegExp(`\\\\.(${compiler.config.ext.header.join('|')})$`);\n    const sourceRegex = new RegExp(`\\\\.(${compiler.config.ext.source.join('|')})$`);\n\n    return [\n        rollupCppjsPlugin(options, compiler),\n        {\n            name: 'vite-plugin-cppjs',\n            async load(source) {},\n            configResolved(config) {},\n            configureServer(server) {},\n+           async handleHotUpdate({ file, server }) {\n+               if (file.startsWith(compiler.config.paths.temp)) {\n+                   return;\n+               }\n+               if (headerRegex.test(file)) {\n+                   compiler.findOrCreateInterfaceFile(file);\n+                   compiler.createBridge();\n+               } else if (sourceRegex.test(file)) {\n+                   await compiler.createWasm();\n+                   server.ws.send({ type: 'full-reload' });\n+               }\n+           },\n        },\n    ];\n};\n"})})]})}function d(e={}){const{wrapper:n}={...(0,i.M)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(p,{...e})}):p(e)}},2436:(e,n,r)=>{r.d(n,{I:()=>o,M:()=>l});var t=r(5496);const i={},s=t.createContext(i);function l(e){const n=t.useContext(s);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(i):e.components||i:l(e.components),t.createElement(s.Provider,{value:n},e.children)}}}]);
import { installCommand, REPO_URL } from '../../data.js';

export default {
    slug: 'runtime-api',
    title: 'Runtime API',
    description: 'initNative(opts) in full: where it comes from, every option it takes, and the module it resolves to.',
    lede: '`initNative()` boots the native runtime and resolves to the module. Every generated module exports it, one call serves every native import of the app, and its options are runtime choices: apart from the `env` a build declares, nothing in `crossbind.config.js` reaches it.',
    blocks: [
        { type: 'h2', id: 'model', text: 'The 30-second model' },
        {
            type: 'p',
            text: 'At build time, `crossbind build` - or the bundler plugin that builds for you - reads `crossbind.config.js` and drives Emscripten, wasi-sdk, cargo, the Android NDK or Xcode to produce `.wasm`, `.a` or `.xcframework` files. At run time, your app calls `initNative()` once; when it resolves, every binding and the module helpers are there.',
        },
        {
            type: 'code',
            file: 'src/main.js',
            code: `import { initNative, Native } from './native/native.h';

await initNative();
console.log(await Native.sample());`,
        },
        {
            type: 'p',
            text: 'Named imports are `null` until the promise resolves. A module imported after the runtime booted is bound as soon as it loads.',
        },

        { type: 'h2', id: 'where', text: 'Where it comes from' },
        {
            type: 'p',
            text: 'With a bundler plugin, import it from any header, `.rs` file, `cargo:` crate or `conan:` header you already import; they all export the same function. Each module registers its bindings when it is imported, and the first `initNative()` boots the runtime once and binds them all. Later calls resolve to the same module and ignore their options.',
        },
        {
            type: 'code',
            file: 'src/main.js',
            code: `import { initNative, Matrix } from './native/Matrix.h';
import { Uuid } from 'cargo:uuid';
import { zlibVersion } from 'conan:zlib/zlib.h';

await initNative();`,
        },
        {
            type: 'p',
            text: 'Without a bundler, import the built loader from the output folder (`paths.output`, set to `dist` in the examples) and call its default export. A Node.js or edge build also writes one ES module per runtime there - `node/wasm.mjs`, `node/napi.mjs` and `edge/wasm.mjs` - that exports `initNative` and every bound name, and a plain page loads the browser loader with a `<script>` tag, which defines a global `initNative`.',
        },
        {
            type: 'code',
            file: 'src/index.mjs',
            code: `import initNative from '../dist/my-app-wasm-wasm32-st-release.node.js';

const { Native } = await initNative();
console.log(Native.sample());`,
        },

        { type: 'h2', id: 'options', text: 'Options' },
        {
            type: 'p',
            text: 'The wasm runtimes - browser, Node.js and edge - take the same options; only the defaults differ, and an option a runtime has no use for is ignored.',
        },
        {
            type: 'table',
            head: ['Option', 'Type', 'Default', 'What it does'],
            rows: [
                [
                    '`useWorker`',
                    'boolean',
                    '`true` where `Worker` exists, as in every browser',
                    'Browser: runs the module in a Web Worker, so every call returns a promise ([worker mode](#worker)). OPFS needs it.',
                ],
                ['`workerUrl`', 'string', 'the loader script', 'Browser, worker mode: the script the worker starts from.'],
                [
                    '`fs.opfs`',
                    'boolean',
                    '`true` in an `mt` browser build, `false` in an `st` one',
                    'Browser: mounts the Origin Private File System under `/opfs`, inside the worker only. See [Files](/guide/filesystem/).',
                ],
                [
                    '`env`',
                    'object of strings',
                    "the build's `env`",
                    "Environment variables of the native process, merged over the build's. `_CROSSBIND_DATA_PATH_` in a value becomes the data folder.",
                ],
                ['`logHandler`', "`(text, 'stdout') => void`", '`console.debug` with a `wasm stdout:` prefix', 'Receives each line the C++ writes to stdout.'],
                ['`errorHandler`', "`(text, 'stderr') => void`", '`console.error` with a `wasm stderr:` prefix', 'Receives each line written to stderr.'],
                ['`onRuntimeInitialized`', '`(m) => void`', '-', 'Runs once the runtime is ready, before the promise resolves.'],
                [
                    '`getWasmFunction`',
                    '`() => WebAssembly.Module`',
                    '-',
                    'Instantiates a module you already hold instead of fetching the `.wasm`. Edge runtimes import the `.wasm` as a module and need it; `dist/edge/wasm.mjs` passes it for you.',
                ],
                [
                    '`path`',
                    'string',
                    "the base the bundler serves from; `/` on a plain page; the loader's folder in Node.js",
                    'Where the loader finds its `.wasm`, data and worker files: a URL, a root path or a path relative to the page.',
                ],
                ['`paths`', '`{ wasm, data, js, worker }`', "the build's file names", 'File names under `path`. A bundler plugin sets them itself and ignores yours.'],
            ],
        },
        {
            type: 'callout',
            tone: 'warn',
            title: 'Function options do not cross into a worker',
            text: 'With `useWorker: true`, `logHandler`, `errorHandler`, `onRuntimeInitialized` and `getWasmFunction` stay on the page: functions cannot be sent to a worker, so the worker logs to its own console with the default prefixes. Pass `useWorker: false` when you need them.',
        },
        {
            type: 'p',
            text: "A Node-API addon (`-e node` on a desktop platform) has no Emscripten runtime and takes three options: `env`, `addonPath` (default: the addon next to the loader, or in its platform package) and `dataPath` (default: `data/` next to the loader, fixed once the addon has started). There, build-time `env` values never replace a variable the process already has; values passed to `initNative()` do. On React Native, `initNative()` takes no options and the build's `env` applies.",
        },

        { type: 'h2', id: 'module', text: 'The module' },
        {
            type: 'p',
            text: 'The promise resolves to the module: the bound classes, functions, enums and constants as members - the same values the named imports receive - plus these helpers.',
        },
        {
            type: 'table',
            head: ['Member', 'Available on', 'Does'],
            rows: [
                ['`toArray(vector)`', 'every runtime', 'returns a bound `std::vector` as an array'],
                ['`toVector(Vector, array)`', 'every runtime', 'returns an array as a bound vector; takes the class or its name as a string'],
                ['`FS`', 'wasm builds: browser, Node.js and edge', 'the Emscripten virtual filesystem, in memory on the edge'],
                ['`getFileBytes(path)`, `getFileList(start?)`', 'browser and Node.js wasm builds', 'a file as a `Uint8Array`; a recursive `[{ path, size }]` listing'],
                [
                    '`getDefaultPath()`, `getFinalPath(path)`, `getRandomPath(start?)`, `autoMountFiles(files, parent?)`',
                    'browser',
                    'OPFS and in-memory mounts, and files the user picked - see [Files](/guide/filesystem/)',
                ],
            ],
        },
        {
            type: 'p',
            text: 'A plain array passed where C++ takes a `std::vector` converts on every call in worker mode; on the page thread, in Node.js and on the edge it converts for module functions and constructors only, so pass `toVector(...)` to a method. A module that binds a pointer also exports the pointer helpers - `cstring`, `allocBuffer`, `readBuffer` and the rest - described under [C++](/guide/bindings/#pointers). Every header module exports `AllSymbols` as well: the module itself once booted. Importing it binds every function of that header.',
        },
        {
            type: 'p',
            text: 'A C++ exception thrown by a call reaches JavaScript as an `Error`. On wasm its message is `<type>: <what()>`, with the two parts in `e.cppType` and `e.cppMessage`; on React Native and in a Node-API addon it is the plain `what()` text.',
        },

        { type: 'h2', id: 'worker', text: 'Worker mode' },
        {
            type: 'p',
            text: 'In a browser the module runs in a Web Worker unless you pass `useWorker: false`, and the page talks to it through proxies. Every call, every `new` and every value read - constants and fields included - goes through the bridge, so each one returns a promise:',
        },
        {
            type: 'code',
            file: 'src/main.js',
            code: `import { initNative, Matrix } from './native/Matrix.h';

await initNative();

const a = await new Matrix(1210000, 1);
const result = await a.multiple(await new Matrix(1210000, 2));
console.log(await result.get(0));`,
        },
        {
            type: 'table',
            head: ['', 'useWorker: false', 'useWorker: true'],
            rows: [
                ['A call returns', 'the value', 'a promise of it'],
                ['`new X(...)` returns', 'the instance', 'a promise - write `await new X(...)`'],
                ['A returned `std::vector`', 'a vector object', 'a plain array'],
                ['A JavaScript function passed to C++', 'works', 'cannot cross into the worker'],
                ['Function options of `initNative`', 'apply', 'ignored'],
                ['A path under `/opfs`', 'throws', 'works while `fs.opfs` is on and the browser supports OPFS'],
            ],
        },
        {
            type: 'p',
            text: "Set `dts: 'promise'` in `crossbind.config.js` so the generated types return promises too. `initNative.terminate()` stops the worker; the next `initNative()` starts a fresh one.",
        },

        { type: 'h2', id: 'logging', text: 'Logging and environment' },
        {
            type: 'p',
            text: 'Without handlers, stdout lines go to `console.debug` and stderr lines to `console.error`, prefixed `wasm stdout:` and `wasm stderr:`. To route them into your own logger, keep the module on the page thread:',
        },
        {
            type: 'code',
            file: 'src/main.js',
            code: `const m = await initNative({
    useWorker: false,
    logHandler: (text) => myLogger.info(\`[wasm] \${text}\`),
    errorHandler: (text) => myLogger.error(\`[wasm] \${text}\`),
});`,
        },
        {
            type: 'p',
            text: 'Runtime `env` values are strings, merged over the `env` the build declares in `targetSpecs` ([Data files](/guide/assets/#env)). `_CROSSBIND_DATA_PATH_` in a value becomes the folder the data files live in: `/crossbind` in the browser and on the edge, `data/` next to the loader in Node.js.',
        },
        {
            type: 'code',
            file: 'src/index.mjs',
            code: `const m = await initNative({
    env: { TMPDIR: '_CROSSBIND_DATA_PATH_/scratch' },
});`,
        },

        { type: 'h2', id: 'lifecycle', text: 'Object lifetime' },
        {
            type: 'p',
            text: "What crossbind hands you is freed when the garbage collector reclaims its handle, at a time you do not control: in the browser, on the page thread and in a worker, and in Node.js. `.delete()` frees it at once, so call it when a C++ object holds a file, a socket or a lot of memory, and on objects made in a loop. On React Native it is the only way: Hermes has no `FinalizationRegistry` yet. Memory a library returns through a raw pointer stays the library's: free it with the library's own function.",
        },
        {
            type: 'p',
            text: 'In the browser and Node.js wasm builds, `initNative.terminate()` forgets the booted module, and in worker mode stops the worker, so the next `initNative()` boots a new one. A Node-API addon cannot be unloaded: there the next call resolves the same module with its native state intact.',
        },

        { type: 'h2', id: 'types', text: 'TypeScript' },
        {
            type: 'p',
            text: 'crossbind writes declarations for every native import under `.crossbind/types/`, `.crossbind/rust-crates/types/` and `.crossbind/conan/types/`. Install the shared config and extend it once (TypeScript 5.5 or later):',
        },
        { type: 'code', file: 'shell', code: installCommand('@crossbind/typescript-config') },
        {
            type: 'code',
            file: 'tsconfig.json',
            code: '{ "extends": "@crossbind/typescript-config" }',
        },
        {
            type: 'p',
            text: "From a C++ header, classes get typed constructors, fields and methods; other names are declared `any`, and `initNative` returns `Promise<unknown>`. In worker mode set `dts: 'promise'` in `crossbind.config.js`: every generated return becomes a `Promise`, while constructors stay synchronously typed because TypeScript has no async constructor - write `await new X()` anyway.",
        },

        { type: 'h2', id: 'pitfalls', text: 'Common pitfalls' },
        {
            type: 'ul',
            items: [
                '`useWorker: true` in `crossbind.config.js` does nothing. That file is read once by the build; runtime options belong to `initNative()`.',
                "Only the first `initNative()` call's options count; later calls resolve to the same module.",
                '`x.method is not a function` in a browser usually means a `new X()` whose promise was never awaited.',
                'A function of a dependency that you reach only through the module, as in `m.GDALVersionInfo()`, needs a named import too when you import other names from that header by name. Without one it fails with `m.GDALVersionInfo is not a function` on the page thread and `crossbind: GDALVersionInfo is not bound in the native module` in a worker.',
                'Mounting `/opfs/...` from the page thread throws, and so does any `/opfs` path while `fs.opfs` is off.',
                "`runtime: 'mt'` works in the dev server and fails in production when the host does not send the COOP/COEP headers - see [Threads and workers](/guide/threading/).",
                'Edge runtimes have no Web Workers: no `useWorker`, no OPFS and no `mt`.',
            ],
        },
        {
            type: 'p',
            text: `[init.md](${REPO_URL}/blob/main/docs/api/init.md) and [lifecycle-and-types.md](${REPO_URL}/blob/main/docs/api/lifecycle-and-types.md) are the reference documents behind this page.`,
        },
    ],
};

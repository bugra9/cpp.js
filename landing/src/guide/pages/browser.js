import { CREATE_COMMAND, REPO_URL, installCommand } from '../../data.js';
import { RELEASE } from '../../release.js';

const suffix = RELEASE.distTagSuffix;
const example = (name) => `[${name}](${REPO_URL}/tree/main/examples/${name})`;
const WEBPACK_INSTALL = `npm install -D @crossbind/plugin-webpack${suffix} @crossbind/plugin-webpack-loader${suffix}`;

export default {
    slug: 'browser',
    title: 'Browser',
    description: 'WebAssembly in the browser: the bundler plugins, a page without one, workers and production hosting.',
    lede: 'In the browser your C++ runs as WebAssembly behind a JavaScript loader. A bundler plugin turns each header you import into a JavaScript module, compiles the wasm while you develop and emits it with your bundle; without a bundler, the CLI builds the loader and the wasm for a `<script>` tag.',
    blocks: [
        { type: 'h2', id: 'setup', text: 'Setup' },
        {
            type: 'p',
            text: 'A browser project needs three things: the plugin for its bundler, a `crossbind.config.js` at the project root and a header imported from app code. The scaffolder sets up all three - React, Vue or Svelte on Vite, React on Rspack, or a page with no bundler:',
        },
        { type: 'code', file: 'shell', code: `${CREATE_COMMAND} my-app Web React Vite` },
        {
            type: 'p',
            text: 'In an existing app, add the plugin for your bundler from the sections below and this config; [Configuration](/guide/configuration/) has the rest of what the file takes.',
        },
        {
            type: 'code',
            file: 'crossbind.config.js',
            code: `export default {
    paths: {
        config: import.meta.url,
    },
};`,
        },
        {
            type: 'p',
            text: 'C++ lives in `src/native`. Import a header and call `initNative()` once: it boots the module and binds every header the app imports.',
        },
        {
            type: 'code',
            file: 'src/main.js',
            code: `import { initNative, Native } from './native/native.h';

initNative().then(async () => {
    console.log(await Native.sample());
});`,
        },
        {
            type: 'p',
            text: 'The call returns a promise because the module runs in a Web Worker by default - see [Workers and storage](#runtime).',
        },

        { type: 'h2', id: 'vite', text: 'Vite' },
        { type: 'code', file: 'shell', code: installCommand('@crossbind/plugin-vite') },
        {
            type: 'code',
            file: 'vite.config.js',
            code: `import { defineConfig } from 'vite';
import viteCrossbindPlugin from '@crossbind/plugin-vite';

export default defineConfig({
    plugins: [viteCrossbindPlugin()],
});`,
        },
        {
            type: 'p',
            text: 'The plugin sits next to your framework\'s plugin; React, Vue and Svelte need nothing more.',
        },

        { type: 'h2', id: 'webpack', text: 'Webpack' },
        { type: 'code', file: 'shell', code: WEBPACK_INSTALL },
        {
            type: 'code',
            file: 'webpack.config.mjs',
            code: `import CrossbindWebpackPlugin from '@crossbind/plugin-webpack';

const crossbindWebpackPlugin = new CrossbindWebpackPlugin();

export default {
    module: {
        rules: [crossbindWebpackPlugin.getRule()],
    },
    plugins: [crossbindWebpackPlugin],
    devServer: crossbindWebpackPlugin.getDevServerConfig(),
};`,
        },
        {
            type: 'p',
            text: '`getRule()` hands headers and `.rs` files to the loader package, which is why both are installed. `getDevServerConfig()` serves the compiled module in dev and sends the COOP/COEP headers; if you already have a `devServer` block, spread it in and keep its `headers` and `setupMiddlewares`.',
        },
        {
            type: 'callout',
            tone: 'warn',
            title: 'Keep the config an ES module',
            text: 'crossbind loads your project config with a top-level `await`, and Node cannot `require()` a module that does: a CommonJS `webpack.config.js` that requires the plugin fails with `ERR_REQUIRE_ASYNC_MODULE`. Name it `webpack.config.mjs`, or set `"type": "module"`.',
        },

        { type: 'h2', id: 'rspack', text: 'Rspack' },
        {
            type: 'p',
            text: 'Rspack takes the same two packages through its webpack-compatible plugin API.',
        },
        { type: 'code', file: 'shell', code: WEBPACK_INSTALL },
        {
            type: 'code',
            file: 'rspack.config.mjs',
            code: `import { defineConfig } from '@rspack/cli';
import CrossbindWebpackPlugin from '@crossbind/plugin-webpack';

const crossbindWebpackPlugin = new CrossbindWebpackPlugin();

export default defineConfig({
    module: {
        rules: [crossbindWebpackPlugin.getRule()],
    },
    plugins: [crossbindWebpackPlugin],
    devServer: crossbindWebpackPlugin.getDevServerConfig(),
});`,
        },

        { type: 'h2', id: 'rollup', text: 'Rollup' },
        {
            type: 'p',
            text: 'The Rollup plugin is the core the Vite plugin wraps; use it directly only for a plain Rollup build. Rollup has no dev server: `rollup -c -w` rebuilds the wasm when a native file changes, and nothing reloads a page.',
        },
        { type: 'code', file: 'shell', code: installCommand('@crossbind/plugin-rollup') },
        {
            type: 'code',
            file: 'rollup.config.mjs',
            code: `import rollupCrossbindPlugin from '@crossbind/plugin-rollup';

export default {
    input: 'src/index.js',
    output: { file: 'dist/index.js', format: 'esm' },
    plugins: [rollupCrossbindPlugin()],
};`,
        },
        {
            type: 'p',
            text: 'The bundle step writes `crossbind.js` and `crossbind.wasm` into the output directory. Plain Rollup has no base path, so the generated code loads them from the site root.',
        },

        { type: 'h2', id: 'no-bundler', text: 'No bundler' },
        {
            type: 'p',
            text: 'A static page builds with the CLI and loads the result with a `<script>` tag. Point `paths.output` at the folder you serve and build for the browser:',
        },
        {
            type: 'code',
            file: 'crossbind.config.js',
            code: `export default {
    general: { name: 'my-app' },
    paths: {
        config: import.meta.url,
        output: 'dist',
    },
};`,
        },
        {
            type: 'code',
            file: 'shell',
            code: `npm install -D crossbind${suffix}
npx crossbind build -p wasm -a wasm32 -r st -e browser -b release`,
        },
        {
            type: 'p',
            text: 'That writes `dist/my-app-wasm-wasm32-st-release.browser.js` and its `.wasm`. The script is a UMD bundle that defines a global `initNative`, so load it with a classic `<script>` tag; `path` says where the files are, relative to the page.',
        },
        {
            type: 'code',
            file: 'index.html',
            code: `<script src="./dist/my-app-wasm-wasm32-st-release.browser.js"></script>
<script>
    initNative({ path: './dist' }).then(async ({ Native }) => {
        document.querySelector('#out').textContent = await Native.sample();
    });
</script>`,
        },
        {
            type: 'p',
            text: 'Nothing reads your imports here, so the build binds every `.h` file under `src/native`, and a library reaches the page through a header of your own. There is no dev server and no rebuild on save.',
        },

        { type: 'h2', id: 'runtime', text: 'Workers and storage' },
        {
            type: 'p',
            text: 'In a browser, `initNative()` starts the module in a Web Worker: `useWorker` defaults to on wherever `Worker` exists. The page thread never blocks on C++, and every call returns a promise, construction included (`await new X()`). Set `dts: \'promise\'` in `crossbind.config.js` so the generated TypeScript says the same.',
        },
        {
            type: 'p',
            text: 'Pass `useWorker: false` to keep the module on the page thread, where calls return their values directly and a long call blocks the page:',
        },
        {
            type: 'code',
            file: 'src/main.js',
            code: `initNative({ useWorker: false }).then(() => {
    console.log(Native.sample());
});`,
        },
        {
            type: 'p',
            text: 'Files under `/opfs/<app>/` survive a reload; OPFS needs the worker, and the generated loader turns it on by default only for `mt` builds. Files under `/memfs/<app>/` live in memory for the session. [Files](/guide/filesystem/) covers both, and [Threads and workers](/guide/threading/) how `useWorker` and `runtime: \'mt\'` combine - they are independent.',
        },

        { type: 'h2', id: 'dev', text: 'Development' },
        {
            type: 'p',
            text: 'The first dev start compiles the wasm in Docker, or on a [remote runner](/guide/remote-builds/), and takes a while; later starts reuse the cache in `.crossbind/`. Dev servers build the debug variant, production builds the release one.',
        },
        {
            type: 'p',
            text: 'Saving a header, a C++ source or a `.rs` file in `src/native` rebuilds the wasm and reloads the page, and a function you newly import from a [library header](/guide/bindings/#imports) binds when you save the importing file. The Vite and webpack dev servers, and `vite preview`, send the COOP/COEP headers, so a multithreaded build runs locally as it is.',
        },

        { type: 'h2', id: 'production', text: 'Production build' },
        {
            type: 'p',
            text: '`vite build`, `rspack build` or a production webpack build compiles the release variant and writes `crossbind.js`, `crossbind.wasm` and, when the project packs [data files](/guide/assets/), `crossbind.data.txt` into the output directory. Deploy them with the bundle. The generated code loads them from Vite\'s `base` or webpack\'s `output.publicPath` (`auto` included), so an app served from a sub-path finds them.',
        },
        {
            type: 'p',
            text: 'A single-threaded build needs no special headers. A `runtime: \'mt\'` build needs `SharedArrayBuffer`, which browsers enable only on a cross-origin isolated page, so the production host has to send:',
        },
        {
            type: 'code',
            file: 'response headers',
            code: `Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp`,
        },
        {
            type: 'p',
            text: 'Without them `SharedArrayBuffer` is undefined and the module fails to start; `crossOriginIsolated` must be `true` in the console of the deployed page. [Threads and workers](/guide/threading/#coop-coep) shows where each host takes the headers. GitHub Pages cannot send them, so a multithreaded build does not run there.',
        },

        { type: 'h2', id: 'own-plugin', text: 'Another bundler' },
        {
            type: 'p',
            text: 'The plugins are thin: the work is done by functions `crossbind` exports, and `@crossbind/plugin-rollup` is the smallest complete plugin to copy. Each one starts by picking the browser target:',
        },
        {
            type: 'code',
            file: 'my-plugin.js',
            code: `import {
    state, buildDependencies, createBridgeFile, getCrossbindScript, getDependFilePath,
    createLib, buildWasm, appSourceFiles, getTargetParams, getFilteredBuildTargets,
} from 'crossbind';

const targetParams = getTargetParams({ platform: ['wasm'], arch: ['wasm32'], runtime: ['st'], runtimeEnv: ['browser'] }, true);
const target = getFilteredBuildTargets(targetParams, { buildType: 'release' })?.[0];`,
        },
        {
            type: 'ul',
            items: [
                'Before the first transform, `buildDependencies()` puts the library headers in place.',
                'Imported headers become modules through `createBridgeFile()` and `getCrossbindScript()`; a library header such as `@crossbind/port-zlib/zlib.h` resolves through `getDependFilePath()`.',
                'The bundle step compiles with `createLib()` and `buildWasm()` and emits the target\'s `jsName`, `wasmName` and `dataTxtName` from `state.config.paths.build` as `crossbind.js`, `crossbind.wasm` and `crossbind.data.txt`.',
                'In dev, the plugin serves those files and watches `state.config.paths.native` and `appSourceFiles()`, whose imports decide what a library header binds.',
            ],
        },

        { type: 'h2', id: 'limits', text: 'Limits' },
        {
            type: 'ul',
            items: [
                '**Next.js** has no example or test in the repository, and the webpack plugin does not run under Turbopack.',
                '**COEP in development.** The dev servers send `Cross-Origin-Embedder-Policy: require-corp` for every build, single-threaded too, so a cross-origin image or script without a `Cross-Origin-Resource-Policy` header fails to load in dev but not in production.',
                '**Synchronous callbacks into page code** do not cross the worker: design them as promise round-trips, or set `useWorker: false`.',
            ],
        },
        {
            type: 'p',
            text: `Complete apps: ${example('web-react-vite')}, ${example('web-vue-vite')}, ${example('web-svelte-vite')}, ${example('web-react-rspack')} and ${example('web-vanilla')} - each one is also a scaffolder template.`,
        },
    ],
};

import sampleLibCmake from 'cppjs-sample-lib-cmake/cppjs.config.js';
import sampleLibMatrix from 'cppjs-sample-lib-prebuilt-matrix/cppjs.config.js';
import sampleLibSource from 'cppjs-sample-lib-source/cppjs.config.js';

// import sampleMobileReactNativeNativeCLI from 'cppjs-sample-mobile-reactnative-nativecli/cppjs.config.mjs';
import sampleMobileReactNativeNativeCLI from 'cppjs-sample-mobile-reactnative-nativecli/cppjs.config.mjs';

import sampleWebVanilla from 'cppjs-sample-web-vanilla/cppjs.config.mjs';
import sampleWebReactCRA from 'cppjs-sample-web-react-cra/cppjs.config.js';
import sampleWebReactRspack from 'cppjs-sample-web-react-rspack/cppjs.config.mjs';
import sampleWebReactVite from 'cppjs-sample-web-react-vite/cppjs.config.js';
import sampleWebSvelteVite from 'cppjs-sample-web-svelte-vite/cppjs.config.js';
import sampleWebVueVite from 'cppjs-sample-web-vue-vite/cppjs.config.js';

import sampleBackendNodeJsWasm from 'cppjs-sample-backend-nodejs-wasm/cppjs.config.mjs';
import sampleCloudCloudflareWorker from 'cppjs-sample-cloud-cloudflare-worker/cppjs.config.mjs';

export default {
    Web: {
        Questions: [
            'Select a framework:',
            'Select a bundler:',
        ],
        Vanilla: {
            path: sampleWebVanilla.paths.project,
        },
        React: {
            'Create React App (CRA)': {
                path: sampleWebReactCRA.paths.project,
            },
            Rspack: {
                path: sampleWebReactRspack.paths.project,
            },
            Vite: {
                path: sampleWebReactVite.paths.project,
            },
        },
        Vue: {
            Vite: {
                path: sampleWebVueVite.paths.project,
            },
        },
        Svelte: {
            Vite: {
                path: sampleWebSvelteVite.paths.project,
            },
        },
    },
    Mobile: {
        Questions: [
            'Select a framework:',
            'Select a ecosystem:',
        ],
        'React Native': {
            'Native CLI': {
                path: sampleMobileReactNativeNativeCLI.paths.project,
            },
        },
    },
    Backend: {
        Questions: [
            'Select a runtime:',
            'Select a ecosystem:',
        ],
        'Node.js': {
            WebAssembly: {
                path: sampleBackendNodeJsWasm.paths.project,
            },
        },
    },
    Cloud: {
        Questions: [
            'Select a service:',
        ],
        'Cloudflare Worker': {
            path: sampleCloudCloudflareWorker.paths.project,
        },
    },
    Library: {
        Questions: [
            'Select a library type:',
        ],
        Prebuilt: {
            path: sampleLibMatrix.paths.project,
        },
        Source: {
            path: sampleLibSource.paths.project,
        },
        CMake: {
            path: sampleLibCmake.paths.project,
        },
    },
};

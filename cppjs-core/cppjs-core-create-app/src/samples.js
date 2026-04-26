import getParentPath from 'cpp.js/src/utils/getParentPath.js';

import sampleLibCmake from '@cpp.js/sample-lib-cmake/cppjs.config.js';
import sampleLibMatrix from '@cpp.js/sample-lib-prebuilt-matrix/cppjs.config.js';
import sampleLibSource from '@cpp.js/sample-lib-source/cppjs.config.js';

import sampleMobileReactNativeCLI from '@cpp.js/sample-mobile-reactnative-cli/cppjs.config.mjs';
import sampleMobileReactNativeExpo from '@cpp.js/sample-mobile-reactnative-expo/cppjs.config.mjs';

import sampleWebVanilla from '@cpp.js/sample-web-vanilla/cppjs.config.mjs';
import sampleWebReactRspack from '@cpp.js/sample-web-react-rspack/cppjs.config.mjs';
import sampleWebReactVite from '@cpp.js/sample-web-react-vite/cppjs.config.js';
import sampleWebSvelteVite from '@cpp.js/sample-web-svelte-vite/cppjs.config.js';
import sampleWebVueVite from '@cpp.js/sample-web-vue-vite/cppjs.config.js';

import sampleBackendNodeJsWasm from '@cpp.js/sample-backend-nodejs-wasm/cppjs.config.mjs';
import sampleCloudCloudflareWorker from '@cpp.js/sample-cloud-cloudflare-worker/cppjs.config.mjs';

export default {
    Web: {
        Questions: [
            'Select a framework:',
            'Select a bundler:',
        ],
        Vanilla: {
            path: getParentPath(sampleWebVanilla.paths.config),
        },
        React: {
            Rspack: {
                path: getParentPath(sampleWebReactRspack.paths.config),
            },
            Vite: {
                path: getParentPath(sampleWebReactVite.paths.config),
            },
        },
        Vue: {
            Vite: {
                path: getParentPath(sampleWebVueVite.paths.config),
            },
        },
        Svelte: {
            Vite: {
                path: getParentPath(sampleWebSvelteVite.paths.config),
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
                path: getParentPath(sampleMobileReactNativeCLI.paths.config),
            },
            Expo: {
                path: getParentPath(sampleMobileReactNativeExpo.paths.config),
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
                path: getParentPath(sampleBackendNodeJsWasm.paths.config),
            },
        },
    },
    Cloud: {
        Questions: [
            'Select a service:',
        ],
        'Cloudflare Worker': {
            path: getParentPath(sampleCloudCloudflareWorker.paths.config),
        },
    },
    Library: {
        Questions: [
            'Select a library type:',
        ],
        Prebuilt: {
            path: getParentPath(sampleLibMatrix.paths.config),
        },
        Source: {
            path: getParentPath(sampleLibSource.paths.config),
        },
        CMake: {
            path: getParentPath(sampleLibCmake.paths.config),
        },
    },
};

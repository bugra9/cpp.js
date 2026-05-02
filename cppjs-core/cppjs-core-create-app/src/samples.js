import getParentPath from 'cpp.js/src/utils/getParentPath.js';

import sampleLibCmake from '@cpp.js/sample-lib-cmake/cppjs.config.js';
import sampleLibCmakeMultithread from '@cpp.js/sample-lib-cmake-multithread/cppjs.config.js';
import sampleLibMatrix from '@cpp.js/sample-lib-prebuilt-matrix/cppjs.config.js';
import sampleLibMatrixMultithread from '@cpp.js/sample-lib-prebuilt-matrix-multithread/cppjs.config.js';
import sampleLibSource from '@cpp.js/sample-lib-source/cppjs.config.js';
import sampleLibSourceMultithread from '@cpp.js/sample-lib-source-multithread/cppjs.config.js';

import sampleMobileReactNativeCLI from '@cpp.js/sample-mobile-reactnative-cli/cppjs.config.mjs';
import sampleMobileReactNativeCLIMultithread from '@cpp.js/sample-mobile-reactnative-cli-multithread/cppjs.config.mjs';
import sampleMobileReactNativeExpo from '@cpp.js/sample-mobile-reactnative-expo/cppjs.config.mjs';
import sampleMobileReactNativeExpoMultithread from '@cpp.js/sample-mobile-reactnative-expo-multithread/cppjs.config.mjs';

import sampleWebVanilla from '@cpp.js/sample-web-vanilla/cppjs.config.mjs';
import sampleWebReactRspack from '@cpp.js/sample-web-react-rspack/cppjs.config.mjs';
import sampleWebReactVite from '@cpp.js/sample-web-react-vite/cppjs.config.js';
import sampleWebReactViteMultithread from '@cpp.js/sample-web-react-vite-multithread/cppjs.config.js';
import sampleWebSvelteVite from '@cpp.js/sample-web-svelte-vite/cppjs.config.js';
import sampleWebSvelteViteMultithread from '@cpp.js/sample-web-svelte-vite-multithread/cppjs.config.js';
import sampleWebVueVite from '@cpp.js/sample-web-vue-vite/cppjs.config.js';
import sampleWebNextWebpack from '@cpp.js/sample-web-next-webpack/cppjs.config.js';
import sampleWebNextWebpackMultithread from '@cpp.js/sample-web-next-webpack-multithread/cppjs.config.js';
import sampleWebNuxtVite from '@cpp.js/sample-web-nuxt-vite/cppjs.config.js';
import sampleWebNuxtViteMultithread from '@cpp.js/sample-web-nuxt-vite-multithread/cppjs.config.js';

import sampleBackendNodeJsWasm from '@cpp.js/sample-backend-nodejs-wasm/cppjs.config.mjs';
import sampleBackendNodeJsWasmMultithread from '@cpp.js/sample-backend-nodejs-wasm-multithread/cppjs.config.mjs';
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
                multithreadPath: getParentPath(sampleWebReactViteMultithread.paths.config),
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
                multithreadPath: getParentPath(sampleWebSvelteViteMultithread.paths.config),
            },
        },
        'Next.js': {
            Webpack: {
                path: getParentPath(sampleWebNextWebpack.paths.config),
                multithreadPath: getParentPath(sampleWebNextWebpackMultithread.paths.config),
            },
        },
        Nuxt: {
            Vite: {
                path: getParentPath(sampleWebNuxtVite.paths.config),
                multithreadPath: getParentPath(sampleWebNuxtViteMultithread.paths.config),
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
                multithreadPath: getParentPath(sampleMobileReactNativeCLIMultithread.paths.config),
            },
            Expo: {
                path: getParentPath(sampleMobileReactNativeExpo.paths.config),
                multithreadPath: getParentPath(sampleMobileReactNativeExpoMultithread.paths.config),
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
                multithreadPath: getParentPath(sampleBackendNodeJsWasmMultithread.paths.config),
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
            multithreadPath: getParentPath(sampleLibMatrixMultithread.paths.config),
        },
        Source: {
            path: getParentPath(sampleLibSource.paths.config),
            multithreadPath: getParentPath(sampleLibSourceMultithread.paths.config),
        },
        CMake: {
            path: getParentPath(sampleLibCmake.paths.config),
            multithreadPath: getParentPath(sampleLibCmakeMultithread.paths.config),
        },
    },
};

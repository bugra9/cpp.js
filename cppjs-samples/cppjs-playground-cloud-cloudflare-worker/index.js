import initCppJs from './dist/cppjs-playground-cloud-cloudflare-worker-wasm-wasm32-st-release.browser.js';
import wasmContent from './dist/cppjs-playground-cloud-cloudflare-worker-wasm-wasm32-st-release.wasm';

globalThis.WorkerGlobalScope = undefined;
const { Native } = await initCppJs({ getWasmFunction: () => wasmContent });

export default {
    async fetch(request, env, ctx) {
        const z = Native.sample();

        return new Response(`- ${z} -`);
    },
};

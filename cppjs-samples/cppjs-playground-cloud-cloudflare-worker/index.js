import initCppJs from './dist/cppjs-playground-cloud-cloudflare-worker.browser.js';
import wasmContent from './dist/cppjs-playground-cloud-cloudflare-worker.wasm';

globalThis.WorkerGlobalScope = undefined;
const { Native } = await initCppJs({ getWasmFunction: () => wasmContent });

export default {
    async fetch(request, env, ctx) {
        const z = Native.sample();

        return new Response(`- ${z} -`);
    },
};

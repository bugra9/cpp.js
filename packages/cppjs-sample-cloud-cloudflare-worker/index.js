import initCppJs from './dist/cppjs-sample-cloud-cloudflare-worker.browser.js';
import wasmContent from './dist/cppjs-sample-cloud-cloudflare-worker.wasm';

const { Native } = await initCppJs({ getWasmFunction: () => wasmContent });

export default {
    async fetch(request, env, ctx) {
        return new Response(Native.sample());
    },
};

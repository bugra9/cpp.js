import initCppJs from './dist/cppjs-sample-cloud-cloudflare-worker-wasm-wasm32-st-release.edge.js';
import wasmContent from './dist/cppjs-sample-cloud-cloudflare-worker-wasm-wasm32-st-release.edge.wasm';

globalThis.WorkerGlobalScope = undefined;
const { Native } = await initCppJs({ getWasmFunction: () => wasmContent });

export default {
    async fetch(request, env, ctx) {
        return new Response(Native.sample());
    },
};

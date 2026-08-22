import initNative from './dist/crossbind-example-cloud-cloudflare-worker-wasm-wasm32-st-release.edge.js';
import wasmContent from './dist/crossbind-example-cloud-cloudflare-worker-wasm-wasm32-st-release.edge.wasm';

const { Native } = await initNative({ getWasmFunction: () => wasmContent });

export default {
    async fetch(request, env, ctx) {
        return new Response(Native.sample());
    },
};

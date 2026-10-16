import { DEMOS } from '../demos.js';

// The demo build (scripts/site/build-example-demos.mjs) compiles every sample ahead of time as `sample-<id>`, so an
// unedited one runs without a compile. A site built without its demos has none; its samples then compile like any
// other code.

const BASE64_CHUNK = 0x8000;

const prebuiltOf = (sampleId) => DEMOS.get(`sample-${sampleId}`);

// A module built before the samples imported their natives has no import list, so its sample compiles instead.
export const hasPrebuilt = (sampleId) => Boolean(prebuiltOf(sampleId)?.imports);

function toBase64(bytes) {
    let binary = '';
    for (let i = 0; i < bytes.length; i += BASE64_CHUNK) binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK));
    return btoa(binary);
}

async function fetchOk(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`The prebuilt sample did not load (${response.status}).`);
    return response;
}

// The loader, the wasm and the import list in the shape the playground compiler answers with: text, the bytes as
// base64, and the list as parsed JSON.
export async function loadPrebuilt(sampleId) {
    const { script, wasm, imports } = prebuiltOf(sampleId);
    const [js, bytes, list] = await Promise.all([
        fetchOk(script).then((response) => response.text()),
        fetchOk(wasm).then((response) => response.arrayBuffer()),
        fetchOk(imports).then((response) => response.json()),
    ]);
    return { js, wasm: toBase64(new Uint8Array(bytes)), imports: list };
}

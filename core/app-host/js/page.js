// The page's crossbind.js in an app: initNative() resolves to the module the app's host runs, with the contract of a
// worker-backed web build.
import { connect } from './lean-client.js';

// The app's host gives this to the top frame of its page alone.
const token = globalThis.__crossbind_token;

const WEBKIT = {
    send: (text) => window.webkit.messageHandlers.crossbind.postMessage(text),
    base: 'crossbind://app',
    attachBytes: 16384,
    token,
};

let booted = null;

function initNative(config = {}) {
    if (!booted) {
        booted = token
            ? connect(WEBKIT, config.env)
            : Promise.reject(new Error("crossbind: only the top frame of an app's own page reaches the app's module"));
    }
    return booted;
}

initNative.terminate = () => {
    booted = null;
};

globalThis.Crossbind = { initNative };

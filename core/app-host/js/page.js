// The page's crossbind.js in an app: initNative() resolves to the module the app's host runs, with the contract of a
// worker-backed web build.
import { connect } from './lean-client.js';

const WEBKIT = {
    send: (text) => window.webkit.messageHandlers.crossbind.postMessage(text),
    base: 'crossbind://app',
    attachBytes: 16384,
};

let booted = null;

function initNative(config = {}) {
    if (!booted) booted = connect(WEBKIT, config.env);
    return booted;
}

initNative.terminate = () => {
    booted = null;
};

globalThis.Crossbind = { initNative };

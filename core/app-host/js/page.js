// The page's crossbind.js in an app: initNative() resolves to the module the app's host runs, with the contract of a
// worker-backed web build.
import { connect } from './lean-client.js';

// The app's host gives this to the top frame of its page alone.
const token = globalThis.__crossbind_token;

// A request the host refuses fails its call with what the host answered.
async function checked(response) {
    if (!response.ok) throw new Error((await response.text()) || `crossbind: the app's host answered ${response.status}`);
    return response;
}

// macOS, iOS and Linux: WebKit's message handler, and crossbind:// requests for the bytes.
const WEBKIT = {
    send: (text) => window.webkit.messageHandlers.crossbind.postMessage(text),
    frame: (query, body) => fetch(`crossbind://app/b/frame?${query}`, { method: 'POST', body }).then(checked).then((response) => response.text()),
    result: (query) => fetch(`crossbind://app/b/result?${query}`).then(checked).then((response) => response.arrayBuffer()),
    attachBytes: 16384,
    token,
};

// Android: the port the app hands the top frame as the page starts. A message goes as "<id>|m|<text>", a large result's
// request as "<id>|r|<query>", and a frame as one ArrayBuffer, "<header length><id>|<query>" and the bytes; an answer
// is "<id>|<text>", "<id>|!<what the host refused>", or an ArrayBuffer whose first four bytes hold the id.
function androidTransport(port) {
    const pending = new Map();
    let nextId = 1;
    port.onmessage = ({ data }) => {
        const isBytes = data instanceof ArrayBuffer;
        const bar = isBytes ? 0 : data.indexOf('|');
        const id = isBytes ? new DataView(data).getUint32(0, true) : Number(data.slice(0, bar));
        const { resolve, reject } = pending.get(id);
        pending.delete(id);
        if (isBytes) resolve(data.slice(4));
        else if (data[bar + 1] === '!') reject(new Error(data.slice(bar + 2)));
        else resolve(data.slice(bar + 1));
    };
    const call = (post) => new Promise((resolve, reject) => {
        const id = nextId;
        nextId += 1;
        pending.set(id, { resolve, reject });
        post(id);
    });
    const encoder = new TextEncoder();
    return {
        send: (text) => call((id) => port.postMessage(`${id}|m|${text}`)),
        frame: (query, body) => call((id) => {
            const header = encoder.encode(`${id}|${query}`);
            const bytes = new Uint8Array(4 + header.length + body.length);
            new DataView(bytes.buffer).setUint32(0, header.length, true);
            bytes.set(header, 4);
            bytes.set(body, 4 + header.length);
            port.postMessage(bytes.buffer, [bytes.buffer]);
        }),
        result: (query) => call((id) => port.postMessage(`${id}|r|${query}`)),
        attachBytes: 16384,
        token,
    };
}

const transport = globalThis.__crossbind_port ? globalThis.__crossbind_port.then(androidTransport) : WEBKIT;

let booted = null;

function initNative(config = {}) {
    if (!booted) {
        booted = token
            ? Promise.resolve(transport).then((chosen) => connect(chosen, config.env))
            : Promise.reject(new Error("crossbind: only the top frame of an app's own page reaches the app's module"));
    }
    return booted;
}

initNative.terminate = () => {
    booted = null;
};

globalThis.Crossbind = { initNative };

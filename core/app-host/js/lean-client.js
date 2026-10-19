// The lean protocol's page side: the awaitable module a worker-backed web build hands out, over one message per call.
// Byte arrays from transport.attachBytes up travel as attachments of a frame, a large result comes back on its own, and
// a frame waits for the messages sent before it, so order holds where the two take different channels.
import { pack, unpack, CODEC_TAG as TAG } from './codec.js';

const FUNCTION = Symbol('remote function');
const LOCAL_MEMBERS = {
    toJSON: () => ({}),
    [Symbol.toPrimitive]: (hint) => (hint === 'number' ? NaN : '[object Object]'),
};

function concatenate(views) {
    const total = views.reduce((sum, view) => sum + view.byteLength, 0);
    const body = new Uint8Array(total);
    let offset = 0;
    for (const view of views) {
        body.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength), offset);
        offset += view.byteLength;
    }
    return body;
}

function createSession(transport) {
    const handleIds = new WeakMap();
    const tokens = new Map();
    const tokenIds = new WeakMap();

    const pendingRelease = [];
    const collector = typeof FinalizationRegistry === 'function' ? new FinalizationRegistry((id) => {
        pendingRelease.push(id);
        if (pendingRelease.length > 1) return;
        setTimeout(() => {
            send(['release', 0, [], [pendingRelease.splice(0)]]).catch(() => {});
        }, 0);
    }) : null;

    // Messages wait for a request in flight, and a request for the messages sent before it.
    const inflight = new Set();
    let gate = Promise.resolve();
    const track = (promise) => {
        inflight.add(promise);
        promise.then(() => inflight.delete(promise), () => inflight.delete(promise));
        return promise;
    };
    function send(message) {
        const text = transport.token + JSON.stringify(message);
        return track(gate.then(() => transport.send(text)));
    }
    function sendWithAttachments(message, attachments) {
        const query = `m=${encodeURIComponent(JSON.stringify([...message, attachments.map((view) => [view.constructor.name, view.byteLength])]))}`;
        const body = concatenate(attachments);
        const done = Promise.allSettled([...inflight]).then(() => transport.frame(`${query}&t=${transport.token}`, body));
        gate = done.then(() => undefined, () => undefined);
        return track(done);
    }

    function tokenFor(id, value) {
        let token = tokens.get(id);
        if (!token) {
            token = Object.freeze({ __embindEnumRef: id, value });
            tokens.set(id, token);
            tokenIds.set(token, id);
        }
        return token;
    }

    function handleFor(id) {
        const handle = remote(id, []);
        handleIds.set(handle, id);
        collector?.register(handle, id);
        return handle;
    }

    function encodeArgs(args, attachments) {
        return pack(args, (value) => {
            if (typeof value === 'function') {
                if (handleIds.has(value)) return { [TAG]: 'h', v: handleIds.get(value) };
                const error = new Error('A function cannot be passed to the native module');
                error.name = 'DataCloneError';
                throw error;
            }
            if (value !== null && typeof value === 'object' && tokenIds.has(value)) return { [TAG]: 'e', v: tokenIds.get(value) };
            if (ArrayBuffer.isView(value) && value.byteLength >= transport.attachBytes) {
                attachments.push(value);
                return { [TAG]: 'att', i: attachments.length - 1 };
            }
            return undefined;
        });
    }

    async function decodeReply(text) {
        const [failed, value] = JSON.parse(text);
        if (failed) throw Object.assign(new Error(value.message), value);
        if (value !== null && typeof value === 'object' && value[TAG] === 'big') {
            const bytes = await transport.result(`id=${value.v}&t=${transport.token}`);
            const View = globalThis[value.k] ?? Uint8Array;
            return new View(bytes, 0, bytes.byteLength / (View.BYTES_PER_ELEMENT ?? 1));
        }
        return unpack(value, (tag, item) => {
            if (tag === 'h') return handleFor(item.v);
            if (tag === 'e') return tokenFor(item.v, item.n);
            if (tag === 'fn') return FUNCTION;
            return undefined;
        });
    }

    async function request(op, target, path, args) {
        const attachments = [];
        const message = [op, target, path, encodeArgs(args, attachments)];
        const reply = await (attachments.length ? sendWithAttachments(message, attachments) : send(message));
        const value = await decodeReply(reply);
        return value === FUNCTION ? remote(target, path, true) : value;
    }

    // A path from the module or an object: awaiting it reads the value, calling or constructing it runs on the host.
    // A function read that way is no longer awaitable, or awaiting it would read it again and again.
    function remote(target, path, isRead = false) {
        return new Proxy(function remoteMember() {}, {
            get(_, prop) {
                if (prop === 'then') {
                    if (path.length === 0 || isRead) return undefined;
                    return (resolve, reject) => request('get', target, path, []).then(resolve, reject);
                }
                if (Object.hasOwn(LOCAL_MEMBERS, prop)) return LOCAL_MEMBERS[prop];
                if (typeof prop === 'symbol') return undefined;
                return remote(target, [...path, prop]);
            },
            set(_, prop, value) {
                request('set', target, [...path, prop], [value]).catch(() => {});
                return true;
            },
            apply: (_, thisArg, args) => request('call', target, path, args),
            construct: (_, args) => request('new', target, path, args),
        });
    }

    return { request, module: remote(0, []) };
}

// transport: { send(text) → Promise<reply text>; frame(query, body) → Promise<reply text>, a message whose byte arrays
// are the body; result(query) → Promise<ArrayBuffer>, a large result; attachBytes; token: what the host gave the page,
// which every message, frame and result request carries }. A frame or result the host refuses rejects with its answer.
export async function connect(transport, env) {
    const session = createSession(transport);
    if (env && Object.keys(env).length > 0) await session.request('env', 0, [], [env]);
    return session.module;
}

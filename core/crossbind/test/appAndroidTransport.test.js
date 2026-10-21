import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { installHost } from '../../app-host/js/lean-host.js';

// The page of an Android app over a real message port: a stand-in for the activity reads what the page sends as the
// activity does, and answers from the host's functions as the activity relays the module's answers.

const TOKEN = 'android-token';
const REFUSED = "crossbind: this request does not carry the page's token";
const { port1: pagePort, port2: activityPort } = new MessageChannel();
const seen = [];
const pageIds = new Map();
let nextCall = 0;
let refusesFrames = false;

const fakeModule = {
    Crossbind: { getEnv: () => '', setEnv: () => 0 },
    add: (a, b) => a + b,
    sum: (bytes) => bytes.reduce((total, byte) => total + byte, 0),
    filled: (length) => new Uint8Array(length).fill(7),
};

// "<id>|m|<message>" or "<id>|r|<query>", or as an ArrayBuffer "<header length><id>|<query>" and the bytes.
activityPort.onmessage = ({ data }) => {
    if (data instanceof ArrayBuffer) {
        seen.push('frame');
        const headerLength = new DataView(data).getUint32(0, true);
        const header = new TextDecoder().decode(new Uint8Array(data, 4, headerLength));
        const bar = header.indexOf('|');
        const [id, query] = [header.slice(0, bar), header.slice(bar + 1)];
        const refused = refusesFrames || new URLSearchParams(query).get('t') !== TOKEN;
        activityPort.postMessage(refused ? `${id}|!${REFUSED}` : `${id}|${globalThis.__crossbind_frame(query, data.slice(4 + headerLength))}`);
        return;
    }
    const bar = data.indexOf('|');
    const id = data.slice(0, bar);
    const rest = data.slice(bar + 3);
    if (data[bar + 1] === 'r') {
        seen.push('result');
        const view = globalThis.__crossbind_result(rest);
        const framed = new Uint8Array(4 + view.byteLength);
        new DataView(framed.buffer).setUint32(0, Number(id), true);
        framed.set(view, 4);
        activityPort.postMessage(framed.buffer, [framed.buffer]);
        return;
    }
    seen.push('message');
    const call = String(nextCall);
    nextCall += 1;
    pageIds.set(call, id);
    globalThis.__crossbind_receive(call, rest.slice(TOKEN.length));
};

let m;
beforeAll(async () => {
    globalThis.__host_reply = (call, text) => {
        activityPort.postMessage(`${pageIds.get(call)}|${text}`);
        pageIds.delete(call);
    };
    installHost(fakeModule, {});
    // What the activity's script gives the top frame before the page's own scripts run.
    globalThis.__crossbind_token = TOKEN;
    globalThis.__crossbind_port = Promise.resolve(pagePort);
    await import('../../app-host/js/page.js');
    m = await globalThis.Crossbind.initNative();
});

afterAll(() => {
    pagePort.close();
    activityPort.close();
});

describe('the page of an Android app', () => {
    test('calls the module over the port the activity handed it', async () => {
        expect(await m.add(2, 3)).toBe(5);
        expect(seen).toContain('message');
    });

    test('sends a large byte array in one frame, and takes a large result as one buffer', async () => {
        seen.length = 0;
        const bytes = Uint8Array.from({ length: 20000 }, (_, i) => i % 256);

        expect(await m.sum(bytes)).toBe(bytes.reduce((total, byte) => total + byte, 0));
        const filled = await m.filled(8192);

        expect(filled).toBeInstanceOf(Uint8Array);
        expect(filled.length).toBe(8192);
        expect(filled.every((byte) => byte === 7)).toBe(true);
        expect(seen).toEqual(['frame', 'message', 'result']);
    });

    test('matches each answer to its own call when calls run at once', async () => {
        expect(await Promise.all([1, 2, 3, 4].map((n) => m.add(n, n)))).toEqual([2, 4, 6, 8]);
    });

    test("calls one of the app's own functions, which the host answers itself", async () => {
        // As the host does once the main thread has done the work.
        globalThis.__app_call = (call, name, options) => {
            const answer = name === 'app.paths' ? [0, { data: '/data', asked: options }] : [1, { name: 'Error', message: `no ${name}` }];
            globalThis.__host_reply(call, JSON.stringify(answer));
        };

        await expect(globalThis.Crossbind.app('app.paths', { a: 1 })).resolves.toEqual({ data: '/data', asked: { a: 1 } });
        await expect(globalThis.Crossbind.app('app.none', {})).rejects.toThrow('no app.none');
    });

    test('rejects a call whose frame the activity refuses, with what it answered, and goes on', async () => {
        refusesFrames = true;
        try {
            await expect(m.sum(new Uint8Array(20000))).rejects.toThrow(REFUSED);
        } finally {
            refusesFrames = false;
        }
        expect(await m.add(1, 2)).toBe(3);
    });
});

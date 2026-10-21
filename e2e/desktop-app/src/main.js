// The conformance suite inside an app: the page reaches the module the app's host runs as a worker-backed web build
// reaches its worker, and the host runs embind-jsi as React Native does.
import { runConformance } from '@crossbind/conformance/spec/run.mjs';
import { app as host, shell } from 'crossbind/app';
// Constants bind only for the names imported here; the header also defines one no leg imports.
import {
    initNative, AllSymbols as confConstantsModule, CONF_BASE, CONF_BASE_NAME, CONF_CHAR, CONF_DOUBLE, CONF_EXPRESSION,
    CONF_HEX, CONF_INT, CONF_NEGATIVE, CONF_PLATFORM, CONF_STRING, CONF_TRUE, CONF_WIDE, confGlobal, confGlobalName,
} from '@crossbind/conformance/native/confconstants.h';
// Variadic functions, function-like and renaming macros and mutable globals bind only for the names imported here.
import {
    ConfVaBuffer, confCounter, confCounterValue, confGreeting, confGreetingValue, confMacroAdd, confMacroAdd_, confMacroWide, confMacroWide_, confVaNoexcept, confMacroHalf,
    confMacroHalf_, confMacroLength, confMacroLength_, confRenamed, confRenamedTarget, confVaFormat, confVaSum, vaDouble,
    allocBuffer, cstring, readCString, readNumberAt, readPointerAt, writeNumberAt, writePointerAt,
} from '@crossbind/conformance/native/confextras.h';
import { Counter } from './native/counter.rs';
// Direct crate imports: bridged from the crates' own sources, no surface file.
import { Uuid } from 'cargo:uuid';
import { Version, VersionReq } from 'cargo:semver';
import { Regex } from 'cargo:regex';
import { xxh364, Xxh3 } from 'cargo:xxhash-rust/xxh3';
import { xxh64, Xxh64 } from 'cargo:xxhash-rust/xxh64';
import { xxh32, Xxh32 } from 'cargo:xxhash-rust/xxh32';
import { Argon2, Params as Argon2Params, Algorithm as Argon2Algorithm, Version as Argon2Version } from 'cargo:argon2-rust';
import { Params as Argon2ModuleParams, Memory as Argon2Memory } from 'cargo:argon2-rust/params';
import { XzOptions, XzWriter, XzReader, LzmaOptions, LzmaWriter, Lzma2Reader, LzmaReader } from 'cargo:lzma-rust2';

// A sandboxed frame of the page reaches the module's channel too, but not the token of the page's top frame; on Android
// it gets neither the token nor the port, nor the object a page asks for its port with.
function callFromSandboxedFrame() {
    const frame = document.createElement('iframe');
    frame.sandbox = 'allow-scripts';
    frame.srcdoc = `<script>
        const post = (text) => parent.postMessage(text, '*');
        try {
            if (window.__crossbind_token || window.__crossbind_port || window.__crossbind_ready) post('[0,"a sandboxed frame got the port"]');
            else window.webkit.messageHandlers.crossbind.postMessage('["get",0,["ConfBox"],[]]').then(String, () => 'refused').then(post);
        } catch {
            post('refused');
        }
    </script>`;
    const answer = new Promise((resolve) => {
        addEventListener('message', (event) => resolve(String(event.data)), { once: true });
    });
    document.body.append(frame);
    return answer.finally(() => frame.remove());
}

// On Android a frame of the page's own origin has the object a page asks for its port with, and the app answers the top
// frame alone: the page keeps its port, and the module the objects the page holds.
async function askFromSameOriginFrame(m) {
    const box = await new m.ConfBox(2, 3);
    const frame = document.createElement('iframe');
    // A frame's empty first document gets no such object; a blob URL's document has the page's origin and does.
    frame.src = URL.createObjectURL(new Blob(['<p>a frame of the page</p>'], { type: 'text/html' }));
    const loaded = new Promise((resolve) => { frame.onload = resolve; });
    document.body.append(frame);
    await loaded;
    const ready = frame.contentWindow.__crossbind_ready;
    if (!ready) throw new Error("a frame of the page's origin has no object to ask for a port with, so nothing was checked");
    ready.postMessage('frame');
    await new Promise((resolve) => { setTimeout(resolve, 300); });
    frame.remove();
    const area = await Promise.race([box.area(), new Promise((resolve) => { setTimeout(() => resolve('no answer'), 3000); })]);
    if (area !== 6) throw new Error(`after a frame asked for a port, an object of the page answered ${area}`);
}

initNative().then(async (m) => {
    try {
        // Markup can make a crossbind:// request as well, so one without the page's token must be refused. On Android the
        // bytes travel over the page's port alone, and the page's origin serves no such request; during development that
        // origin is the dev server's, which answers any path with the page.
        const isAndroid = Boolean(globalThis.__crossbind_port);
        // The desktop window opens the page at the size app.window gives, whatever frame it adds around it.
        const isDesktop = !isAndroid && navigator.maxTouchPoints === 0;
        if (isDesktop && (innerWidth !== 800 || innerHeight !== 600)) {
            throw new Error(`the page is ${innerWidth} × ${innerHeight}, not the 800 × 600 app.window gives`);
        }
        // The app's own functions answer over the page's channel on every platform, and the host checks what it opens.
        const folders = await host.paths();
        if (![folders.data, folders.cache, folders.logs].every((folder) => /^(\/|[A-Za-z]:\\)/.test(folder))) {
            throw new Error(`the app's folders are no absolute paths: ${JSON.stringify(folders)}`);
        }
        const opened = await shell.openExternal('javascript:void 0').then(() => 'opened', (error) => error.message);
        if (!opened.includes('http, https and mailto')) throw new Error(`a javascript: address was not refused: ${opened}`);
        // The page opens files where app.openPath lets it, the data folder here, and shows the app's folders and what a
        // dialog picked alone.
        const separator = folders.data.includes('\\') ? '\\' : '/';
        const outside = await shell.openPath(folders.data.replace(/[^\\/]+$/, 'crossbind-outside')).then(() => 'opened', (error) => error.message);
        if (!outside.includes('app.openPath')) throw new Error(`a path outside the app's folders was not refused: ${outside}`);
        const unlisted = await shell.openPath(`${folders.cache}${separator}crossbind-missing`).then(() => 'opened', (error) => error.message);
        if (!unlisted.includes('app.openPath')) throw new Error(`a file in a folder app.openPath does not list was not refused: ${unlisted}`);
        const listed = await shell.openPath(`${folders.data}${separator}crossbind-missing`).then(() => 'opened', (error) => error.message);
        if (listed === 'opened' || listed.includes('app.openPath')) throw new Error(`a missing file where app.openPath lets the page: ${listed}`);
        const inside = await shell.revealInFolder(`${folders.data}${separator}crossbind-missing`).then(() => 'shown', (error) => error.message);
        if (inside === 'shown' || inside.includes("reaches the app's folders")) throw new Error(`a missing file in the app's folder: ${inside}`);
        // A phone's system ends its apps.
        if (!isDesktop) {
            const quit = await host.quit().then(() => 'quit', (error) => error.message);
            if (!quit.includes('does not quit itself')) throw new Error(`app.quit() did not refuse on a phone: ${quit}`);
        }
        if (!isAndroid || !import.meta.env.DEV) {
            const { status } = await fetch(isAndroid ? '/b/result?id=1' : 'crossbind://app/b/result?id=1');
            if (status !== (isAndroid ? 404 : 403)) throw new Error(`the host answered ${status} to a request without the page's token`);
        }
        const framed = await callFromSandboxedFrame();
        if (framed.startsWith('[0,')) throw new Error(`a sandboxed frame called the module: ${framed}`);
        if (isAndroid) await askFromSameOriginFrame(m);
        const result = await runConformance({
            cpp: { ConfBox: m.ConfBox, ConfCircle: m.ConfCircle, ConfOps: m.ConfOps, ConfShape: m.ConfShape },
            rustPkg: {
                RustyCounter: m.RustyCounter,
                Widget: m.Widget,
                Gauge: m.Gauge,
                Mode: m.Mode,
                RustIntVector: m.RustIntVector,
                doubleIt: m.doubleIt,
                greet: m.greet,
                checkedParse: m.checkedParse,
                parseEven: m.parseEven,
                tag: m.tag,
                jsonEcho: m.jsonEcho,
                jsonTally: m.jsonTally,
                jsonPick: m.jsonPick,
                SharedDoc: m.SharedDoc,
                dupDoc: m.dupDoc,
                sharedDropCount: m.sharedDropCount,
            },
            rustAppLocal: { Counter },
            rustCrates: {
                Uuid, Version, VersionReq, Regex, xxh364, Xxh3, xxh64, Xxh64, xxh32, Xxh32,
                Argon2, Argon2Params, Argon2Algorithm, Argon2Version, Argon2ModuleParams, Argon2Memory,
                XzOptions, XzWriter, XzReader, LzmaOptions, LzmaWriter, Lzma2Reader, LzmaReader,
            },
            // A JS function cannot cross to the host, as it cannot cross to a worker.
            jsLive: null,
            pointers: m,
            callbacks: m,
            strings: m,
            wrappers: m,
            types: m,
            constants: {
                CONF_BASE, CONF_BASE_NAME, CONF_CHAR, CONF_DOUBLE, CONF_EXPRESSION, CONF_HEX, CONF_INT, CONF_NEGATIVE,
                CONF_PLATFORM, CONF_STRING, CONF_TRUE, CONF_WIDE, confGlobal, confGlobalName, module: confConstantsModule,
            },
            extras: {
                ConfVaBuffer, confCounter, confCounterValue, confGreeting, confGreetingValue, confMacroAdd, confMacroAdd_, confMacroWide, confMacroWide_, confVaNoexcept, confMacroHalf,
                confMacroHalf_, confMacroLength, confMacroLength_, confRenamed, confRenamedTarget, confVaFormat, confVaSum, vaDouble,
                allocBuffer, cstring, readCString, readNumberAt, readPointerAt, writeNumberAt, writePointerAt,
            },
            rustKit: m,
            caps: { worker: true, jsiNative: true },
        });
        // The summary comes last: the run ends the app once it reads it.
        if (result.pass !== result.run) console.log(result.lines.join('\n'));
        console.log(result.summary);
        document.getElementById('conf').textContent = result.summary;
    } catch (error) {
        console.error(`CONFORMANCE ERR: ${error?.message ?? error}`);
    }
});

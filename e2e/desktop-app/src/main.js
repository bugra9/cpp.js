// The conformance suite inside an app: the page reaches the module the app's host runs as a worker-backed web build
// reaches its worker, and the host runs embind-jsi as React Native does.
import { runConformance } from '@crossbind/conformance/spec/run.mjs';
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

// A sandboxed frame of the page reaches the module's channel too, but not the token of the page's top frame.
function callFromSandboxedFrame() {
    const frame = document.createElement('iframe');
    frame.sandbox = 'allow-scripts';
    frame.srcdoc = `<script>
        const post = (text) => parent.postMessage(text, '*');
        try {
            window.webkit.messageHandlers.crossbind.postMessage('["get",0,["ConfBox"],[]]').then(String, () => 'refused').then(post);
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

initNative().then(async (m) => {
    try {
        // Markup can make a crossbind:// request as well, so one without the page's token must be refused.
        const { status } = await fetch('crossbind://app/b/result?id=1');
        if (status !== 403) throw new Error(`the host answered ${status} to a request without the page's token`);
        const framed = await callFromSandboxedFrame();
        if (framed.startsWith('[0,')) throw new Error(`a sandboxed frame called the module: ${framed}`);
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

// SWIG registers _JSPI-suffixed methods with emscripten::async(). Registering
// such a binding in a build WITHOUT -sJSPI aborts emsdk 6 DEBUG builds at
// embind registration time ("Async bindings are only supported with JSPI"),
// killing the whole module before anything runs. One bridge .cpp is shared by
// every target of a package, so the guard has to be a compile-time condition:
// wrap each async registration in #ifdef CPPJS_JSPI, and let createLib define
// CPPJS_JSPI only for targets whose emccFlags carry -sJSPI.
export default function guardAsyncBindings(bridgeText) {
    if (!bridgeText.includes('emscripten::async()')) {
        return bridgeText;
    }

    const lines = bridgeText.split('\n');
    const out = [];
    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        const alreadyGuarded = i > 0 && lines[i - 1].trim() === '#ifdef CPPJS_JSPI';
        if (!line.includes('emscripten::async()') || alreadyGuarded) {
            out.push(line);
            continue;
        }
        // Registrations are one chained call per line, optionally closing the
        // statement. Keep any trailing `;` OUTSIDE the guard so the chain (or
        // an empty statement) stays valid when CPPJS_JSPI is undefined.
        const match = /^(\s*)(.*?);?\s*$/.exec(line);
        const indent = match[1];
        const call = match[2];
        const endsStatement = /;\s*$/.test(line);
        out.push('#ifdef CPPJS_JSPI');
        out.push(indent + call);
        out.push('#endif');
        if (endsStatement) {
            out.push(`${indent};`);
        }
    }
    return out.join('\n');
}

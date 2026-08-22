// SWIG's -embind backend emits functions and constructors but no member variables, so
// public fields never reach JS from the generated bridge alone. This post-pass injects
// embind .property lines for the value-semantics fields parseCppSurface captured - the
// same post-processing precedent as bridgeAsyncGuard.

export function buildFieldPropertyLines(cls) {
    return (cls.fields ?? []).map((f) => `.property("${f.name}", &${cls.name}::${f.name})`);
}

export function injectFieldBindings(bridgeContent, model) {
    let out = bridgeContent;
    for (const cls of model.classes ?? []) {
        const lines = buildFieldPropertyLines(cls)
            .filter((line) => !out.includes(line));
        if (!lines.length) continue;
        // Lazy template match still lands on the right opener: the first `>(\s*"Name")`
        // closes the template list even when it contains nested arguments like base<T>.
        const opener = new RegExp(`(emscripten::class_<[\\s\\S]*?>\\s*\\(\\s*"${cls.name}"\\s*\\))`);
        if (!opener.test(out)) continue;
        out = out.replace(opener, `$1\n    ${lines.join('\n    ')}`);
    }
    return out;
}

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import resolveEmbindRustRoot, { embindRustVersion } from './resolveEmbindRust.js';
import writeIfChanged from './writeIfChanged.js';

// Generates the embind bridge for a cargo package as a COMPANION CRATE, the Rust analog of the
// C++ .i.cpp bridges: the user's crate stays plain Rust (no embind-rs dependency, no macro line)
// and cpp.js emits <pkg>/.cppjs/bridge-crate/ which depends on the user crate by path and holds
// all registrations (newtype wrappers dodge the orphan rule; shim fns adapt &self and enum/value
// object types). buildCargo compiles the bridge crate; its staticlib bundles the user crate.
//
// v1 surface grammar (parsed from src/lib.rs, rustfmt-style):
//   #[repr(i32)] pub enum E { A = 0, .. }                  -> enum
//   #[repr(C)] #[derive(..Default..Copy..)] pub struct V   -> value object (pub fields)
//   pub struct C + inherent `impl C { pub fn .. }`         -> class
//     pub fn new(..) -> Self                               -> constructor (<=3 args)
//     pub fn other(..) -> Self                             -> smart_ptr factory (<=2 args)
//     pub fn m(&mut self / &self, ..) -> R                 -> method (<=4 args), JS name camelCase
//   top-level pub fn f(..) -> R                            -> free function (<=4 args)
//   impl Display for C                                     -> toString() on the class
//   params may also be &str / &String (String on the wire, borrowed at the call site)
//   i64 / u64 cross as JS BigInt; Result<T, E> in any return above throws in JS on Err
//   (E: Display); Option<Self> factories return JS null; Option<i32/f64/bool/String> works in
//   params (undefined/null -> None) and returns (None -> undefined); other Option shapes skip
//   vectors come from cppjs.config.mjs: export.bindings.vectors = [{ of: 'i32', name: '..' }]
// Anything outside this surface is skipped WITH a log line - never silently.

const PRIMITIVES = new Set(['i32', 'i64', 'u64', 'f64', 'bool', 'String', '()']);
const PARAM_ONLY = new Set(['&str', '&String']);
const OPTION_INNERS = new Set(['i32', 'f64', 'bool', 'String']);
const OPTION_PARAM_RE = /^Option<(i32|f64|bool|String)>$/;
const OPTIONAL_REG = { i32: 'register_optional_i32', f64: 'register_optional_f64', bool: 'register_optional_bool', String: 'register_optional_string' };
const VECTOR_ITEM_TYPES = new Set(['i32', 'f64', 'bool']);
// serde_json::Value params/returns cross as a deep JSON copy (adapter-side codec, canonical
// token 'Json'); the bare `Value` spelling counts only when the file imports serde_json.
const JSON_TY = 'Json';
const isJsonSpelling = (ty, ctx) => Boolean(ctx?.allowJson)
    && (ty === 'serde_json::Value' || (Boolean(ctx.hasSerdeUse) && ty === 'Value'));
// Arc<Class> params/returns (shared ownership): canonical token 'Arc<X>'; the bare `Arc`
// spelling counts only when the file imports std::sync::Arc. Same app-surface gate as Json.
const ARC_RE = /^Arc<(\w+)>$/;
const normalizeArc = (ty, ctx) => {
    if (!ctx?.allowJson) return ty;
    const m = ty.match(/^(?:std::sync::)?Arc<(\w+)>$/);
    if (!m) return ty;
    if (!ty.startsWith('std::sync::') && !ctx.hasArcUse) return ty;
    return `Arc<${m[1]}>`;
};
// Live JS handles (embind_rs::JsValue / JsFunction): bare spellings count only when the file
// imports from embind_rs - the one deliberate coupling of the E2 surface.
const JS_TOKS = new Set(['JsValue', 'JsFunction']);
// Returns the canonical token only when the spelling is ELIGIBLE (qualified, or bare with the
// embind_rs import present) - the token equals the bare name, so acceptance must key on this
// result, never on the raw string.
const matchJsTok = (ty, ctx) => {
    if (!ctx?.allowJson) return null;
    const m = String(ty).match(/^(?:embind_rs::)?(JsValue|JsFunction)$/);
    if (!m) return null;
    if (!String(ty).startsWith('embind_rs::') && !ctx.hasEmbindUse) return null;
    return m[1];
};
const FN_SIG_RE = /^pub (?:const )?fn (\w+)\s*\(([^)]*)\)\s*(?:->\s*([\w:<>(),& ]+?))?\s*\{/;

export default function generateRustBridge({ crateDir, vectors = [], dtsFile = null, keepName = null, dtsMode = 'sync', log = console.log }) {
    const libRsPath = `${crateDir}/src/lib.rs`;
    if (!fs.existsSync(libRsPath)) throw new Error(`cppjs: rust bridge: ${libRsPath} not found`);
    const rawCrateName = readCrateName(crateDir);
    const userCrate = rawCrateName.replaceAll('-', '_');
    const src = fs.readFileSync(libRsPath, 'utf8');

    const model = parseSurface(src, log);
    let bridge = emitBridge(model, { userCrate, vectors, log });
    // Rust archives are linked LAZILY (never force_load/whole-archive: each staticlib bundles its
    // own libstd, and fully loading two of them duplicates thousands of std symbols). Instead the
    // consumer pins this keep symbol (-u/--undefined); codegen-units=1 puts it in the same object
    // as the init-array constructor, so pulling it pulls the registrations - and only them.
    if (keepName) bridge += `\n#[no_mangle]\npub extern "C" fn cppjs_keep_${keepName}() {}\n`;
    if (dtsFile) writeIfChanged(dtsFile, emitDts(model, vectors, dtsMode));

    const bridgeDir = `${crateDir}/.cppjs/bridge-crate`;
    const embindRsDir = resolveEmbindRsDir();
    const manifest = [
        '# Generated by cpp.js rustBridgeGen - do not edit.',
        `# embind-rs from @cpp.js/core-embind-rust ${embindRustVersion()}`,
        '[package]',
        `name = "${userCrate.replaceAll('_', '-')}-cppjs-bridge"`,
        'version = "0.0.0"',
        'edition = "2021"',
        '',
        '[lib]',
        `name = "${userCrate}_cppjs_bridge"`,
        'crate-type = ["staticlib"]',
        '',
        '[dependencies]',
        `${userCrate} = { package = "${rawCrateName}", path = "${crateDir}" }`,
        `embind-rs = { path = "${embindRsDir}" }`,
        ...(model.usesJson ? ['serde_json = "1"'] : []),
        '',
        '[profile.release]',
        'panic = "abort"',
        '# One object per crate: the keep symbol and the init-array ctor must share an object.',
        'codegen-units = 1',
        '',
        '# Isolated on purpose: never join a surrounding workspace.',
        '[workspace]',
        '',
    ].join('\n');

    writeIfChanged(`${bridgeDir}/Cargo.toml`, manifest);
    writeIfChanged(`${bridgeDir}/src/lib.rs`, bridge);
    return { bridgeDir, crateName: `${userCrate}_cppjs_bridge` };
}

// App-local .rs files (the Rust analog of an app's own .h) get a SELF-CONTAINED synthesized
// crate: the user file is embedded via `#[path] mod user;` (no copy) and the bridge lives in the
// same crate, so registrations reference `user::Type` directly. The bundler transformer calls
// this on import (like createBridgeFile for C++); the native builds compile every crate under
// <project>/.cppjs/rust-bridges/ and link the staticlibs whole-archive.
export function createRustBridgeCrate({ rsFile, cacheDir, projectPath, vectors = [], cargoDependencies = {}, dtsMode = 'sync', log = console.log }) {
    const stem = path.basename(rsFile, '.rs').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    const dir = `${cacheDir}/rust-bridges/${stem}`;
    const model = parseSurface(fs.readFileSync(rsFile, 'utf8'), log);
    const bridge = emitBridge(model, {
        userCrate: 'user',
        vectors,
        log,
        prelude: `#[path = "${rsFile}"]\nmod user;`,
    });

    const manifest = [
        '# Generated by cpp.js rustBridgeGen - do not edit.',
        `# embind-rs from @cpp.js/core-embind-rust ${embindRustVersion()}`,
        '[package]',
        `name = "${stem.replaceAll('_', '-')}-cppjs-app"`,
        'version = "0.0.0"',
        'edition = "2021"',
        '',
        '[lib]',
        `name = "${stem}_cppjs_app"`,
        '# rlib: bundled into the single app super-crate (one libstd for all app-local surfaces).',
        'crate-type = ["rlib"]',
        '',
        '[dependencies]',
        `embind-rs = { path = "${resolveEmbindRsDir()}" }`,
        // The app config's top-level cargoDependencies, so an app-local surface can use
        // upstream crates directly (values: a version string, or a verbatim `{ ... }` spec).
        ...Object.entries(cargoDependencies).map(([name, spec]) => (
            String(spec).trim().startsWith('{') ? `${name} = ${spec}` : `${name} = "${spec}"`
        )),
        ...(model.usesJson && !cargoDependencies.serde_json ? ['serde_json = "1"'] : []),
        '',
        '[profile.release]',
        'panic = "abort"',
        'codegen-units = 1',
        '',
        '# Isolated on purpose: never join a surrounding workspace.',
        '[workspace]',
        '',
    ].join('\n');

    writeIfChanged(`${dir}/Cargo.toml`, manifest);
    writeIfChanged(`${dir}/src/lib.rs`, bridge);
    // Relative `./x.rs` imports are typed by path resolution (ambient declarations only work
    // for non-relative names like `cargo:x`), so the declaration mirrors the project-relative
    // path under the language-neutral <cache>/types/ overlay (same home as .h declarations);
    // @cpp.js/typescript-config wires the rootDirs and keeps user folders free of generated files.
    writeIfChanged(`${cacheDir}/types/${path.relative(projectPath, rsFile)}.d.ts`, emitDts(model, vectors, dtsMode));
    return { bridgeDir: dir, crateName: `${stem}_cppjs_app`, model };
}

// Direct CRATE import (`import { X } from 'cargo:uuid'` with top-level `cargoDependencies`
// declaring `uuid`): no surface file and no package - the bridge is generated from the
// upstream crate's OWN multi-file source. cargo metadata (which fetches on first run) locates
// the source and the resolved feature set; the bridge crate is a normal rlib under
// rust-bridges/, so the app super-staticlib flow links it like any app-local surface.
const crateModelCache = new Map();
export function createCrateImportBridge({ crateName, spec, cacheDir, dtsMode = 'sync', log = console.log }) {
    const stem = `crate_${crateName.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}`;
    const dir = `${cacheDir}/rust-bridges/${stem}`;
    const depLine = String(spec).trim().startsWith('{') ? `${crateName} = ${spec}` : `${crateName} = "${spec}"`;
    const manifest = [
        '# Generated by cpp.js rustBridgeGen - do not edit.',
        `# embind-rs from @cpp.js/core-embind-rust ${embindRustVersion()}`,
        '[package]',
        `name = "${stem.replaceAll('_', '-')}-cppjs-app"`,
        'version = "0.0.0"',
        'edition = "2021"',
        '',
        '[lib]',
        `name = "${stem}_cppjs_app"`,
        '# rlib: bundled into the single app super-crate (one libstd for all app-local surfaces).',
        'crate-type = ["rlib"]',
        '',
        '[dependencies]',
        depLine,
        `embind-rs = { path = "${resolveEmbindRsDir()}" }`,
        '',
        '[profile.release]',
        'panic = "abort"',
        'codegen-units = 1',
        '',
        '# Isolated on purpose: never join a surrounding workspace.',
        '[workspace]',
        '',
    ].join('\n');
    writeIfChanged(`${dir}/Cargo.toml`, manifest);
    // cargo metadata needs a resolvable lib target before the real bridge exists.
    if (!fs.existsSync(`${dir}/src/lib.rs`)) writeIfChanged(`${dir}/src/lib.rs`, '// cpp.js placeholder\n');

    const cacheKey = `${dir}|${depLine}`;
    let model = crateModelCache.get(cacheKey);
    if (!model) {
        let meta;
        try {
            meta = JSON.parse(execSync(`cargo metadata --format-version 1 --manifest-path ${dir}/Cargo.toml`, {
                encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 128 * 1024 * 1024,
            }));
        } catch (e) {
            throw new Error(`cppjs: crate import '${crateName}': cargo metadata failed (${e.stderr?.toString().trim() ?? e.message})`, { cause: e });
        }
        const pkg = meta.packages.find((p) => p.name === crateName);
        if (!pkg) throw new Error(`cppjs: crate import '${crateName}': crate not found in the cargo dependency graph`);
        const features = meta.resolve?.nodes?.find((n) => n.id === pkg.id)?.features ?? [];
        model = parseCrateSurface({ srcDir: path.join(path.dirname(pkg.manifest_path), 'src'), features, log });
        // Always audible (the transformer silences routine skip-noise): an empty surface means
        // the import will bind NOTHING - generic/re-export-style crates need an app-local .rs.
        if (!model.classes.length && !model.enums.length && !model.freeFns.length) {
            console.warn(`cppjs: crate import '${crateName}' has no bindable surface (its lib.rs defines no in-grammar types) - write an app-local surface .rs over it instead`);
        }
        crateModelCache.set(cacheKey, model);
    }

    const bridge = emitBridge(model, { userCrate: crateName.replaceAll('-', '_'), vectors: [], log });
    writeIfChanged(`${dir}/src/lib.rs`, bridge);
    // Editor types for the `cargo:<crate>` import: an ambient module the app's tsconfig
    // includes (e.g. "include": ["**/*", ".cppjs/rust-crates/types/**/*.d.ts"]). The scheme
    // keeps the module name unique, so npm packages/@types of the same name never clash.
    const dtsBody = emitDts(model, [], dtsMode).split('\n').map((l) => (l ? `    ${l}` : l)).join('\n');
    writeIfChanged(`${cacheDir}/rust-crates/types/${crateName}.d.ts`, `declare module 'cargo:${crateName}' {\n${dtsBody}\n}\n`);
    return { bridgeDir: dir, crateName: `${stem}_cppjs_app`, model };
}

// The embind-rs runtime crate ships inside @cpp.js/core-embind-rust; the consumer (a plugin
// or the package itself) declares that dependency and resolveEmbindRust finds it.
function resolveEmbindRsDir() {
    return `${resolveEmbindRustRoot()}/crate`;
}

// Returns the RAW [package] name (dashes kept): cargo dependency lookups need it verbatim.
// Callers wanting the crate/lib identifier convert dashes to underscores themselves.
export function readCrateName(crateDir) {
    const toml = fs.readFileSync(`${crateDir}/Cargo.toml`, 'utf8');
    const name = toml.match(/^\s*name\s*=\s*"([^"]+)"/m)?.[1];
    if (!name) throw new Error(`cppjs: could not read [package] name from ${crateDir}/Cargo.toml`);
    return name;
}


// ---------------- parser ----------------

export function parseSurface(src, log) {
    const acc = newAcc();
    scanSource(src, acc, { collectTypes: true, log });
    return finalizeModel(acc, log);
}

// Parses an UPSTREAM crate for a direct crate import (`import .. from '<crate>'`): exported
// types come from lib.rs; inherent impls and `impl Display` are collected across the crate's
// `mod`-declared files, following the resolved feature set for cfg-gated modules.
export function parseCrateSurface({ srcDir, features = [], log = console.log }) {
    const acc = newAcc();
    const enabled = new Set(features);
    const seen = new Set();
    const walk = (file, modPath) => {
        if (seen.has(file) || !fs.existsSync(file)) return;
        seen.add(file);
        // Root and glob-re-exported modules collect their pub types; other modules only
        // contribute impls (plus types individually re-exported by name).
        const collectTypes = modPath.length === 0 || acc.globModules.has(modPath.join('::'));
        const mods = scanSource(fs.readFileSync(file, 'utf8'), acc, { collectTypes, log });
        const childBase = file.endsWith('lib.rs') || file.endsWith('mod.rs') ? path.dirname(file) : file.slice(0, -3);
        for (const m of mods) {
            if (!cfgEnabled(m.cfg, enabled)) continue;
            walk(path.join(childBase, `${m.name}.rs`), [...modPath, m.name]);
            walk(path.join(childBase, m.name, 'mod.rs'), [...modPath, m.name]);
        }
    };
    walk(path.join(srcDir, 'lib.rs'), []);
    return finalizeModel(acc, log);
}

function newAcc() {
    return {
        enums: [],        // { name, variants: [{ name, value }] }
        valueObjects: [], // { name, fields: [{ name, type }] }
        classes: new Map(), // name -> { name, ctor, factories: [], methods: [], hasDisplay }
        freeFns: [],      // { name, jsName, args, ret, throws }
        displayNames: new Set(),
        wantedTypes: new Set(),  // type names re-exported from lib.rs (`pub use ..::{X}`)
        globModules: new Set(),  // module paths glob-re-exported from lib.rs (`pub use ..::m::*`)
    };
}

// `#[cfg(..)]` on a `mod` line: null = ungated; no feature tokens = never enabled (so
// cfg(test) / cfg(target_os = ..) modules are skipped).
function cfgOf(attrs) {
    const cfg = attrs.find((a) => a.startsWith('#[cfg('));
    if (!cfg) return null;
    const features = [...cfg.matchAll(/feature\s*=\s*"([^"]+)"/g)].map((m) => m[1]);
    return { features, any: /cfg\(any/.test(cfg) };
}

function cfgEnabled(cfg, enabled) {
    if (cfg === null) return true;
    if (cfg.features.length === 0) return false;
    return cfg.any ? cfg.features.some((f) => enabled.has(f)) : cfg.features.every((f) => enabled.has(f));
}

// Scans ONE source file into the accumulator; returns the `mod name;` declarations found.
// collectTypes: types and free fns register only from the crate root (lib.rs) - module files
// contribute impls (methods, factories, Display) for already-known types.
function scanSource(src, acc, { collectTypes, log }) {
    const { enums, valueObjects, classes, freeFns, displayNames, wantedTypes } = acc;
    acc.hasSerdeUse ||= /\buse\s+serde_json\b/.test(src);
    acc.hasArcUse ||= /\buse\s+std::sync::(?:Arc\b|\{[^}]*\bArc\b)/.test(src);
    acc.hasEmbindUse ||= /\buse\s+embind_rs::/.test(src);
    const mods = [];
    // Strip line comments; join multi-line `pub fn` signatures (to their brace) and multi-line
    // `pub use` re-export lists (to their semicolon).
    const rawLines = src.split('\n').map((l) => l.replace(/\/\/.*$/, ''));
    const lines = [];
    for (let i = 0; i < rawLines.length; i += 1) {
        let line = rawLines[i];
        if (/\bpub (?:const )?fn\b/.test(line)) {
            while (!line.includes('{') && !line.includes(';') && i + 1 < rawLines.length) {
                i += 1;
                line = `${line} ${rawLines[i].trim()}`;
            }
        } else if (/^\s*pub use\b/.test(line)) {
            while (!line.includes(';') && i + 1 < rawLines.length) {
                i += 1;
                line = `${line} ${rawLines[i].trim()}`;
            }
        }
        lines.push(line);
    }

    let attrs = [];
    for (let i = 0; i < lines.length; i += 1) {
        const t = lines[i].trim();
        if (t.startsWith('#[') || t.startsWith('#![')) { attrs.push(t); continue; }
        if (t === '') continue;

        // Crate-root re-exports make module-defined types part of the surface: capitalized
        // leaves of `pub use ..::{X, Y};` are collected when the defining module is scanned.
        if (collectTypes && t.startsWith('pub use ')) {
            // Named re-exports mark module types as surface; glob re-exports mark their whole
            // module as root-like (its pub types are collected when the walk reaches it).
            const body = t.replace(/^pub use\s+/, '').replace(/;.*$/, '').trim();
            const items = [];
            const braced = body.match(/^(?:crate::|self::)?(?:([\w:]+)::)?\{(.*)\}$/);
            if (braced) {
                const prefix = braced[1] ? `${braced[1]}::` : '';
                braced[2].split(',').map((s) => s.trim()).filter(Boolean)
                    .forEach((s) => items.push(prefix + s.replace(/^(?:crate::|self::)/, '')));
            } else {
                items.push(body.replace(/^(?:crate::|self::)/, ''));
            }
            for (const item of items) {
                if (item.endsWith('::*')) {
                    acc.globModules.add(item.slice(0, -3));
                } else {
                    const leaf = (item.split('::').pop() ?? '').replace(/\s+as\s+\w+$/, '');
                    if (/^[A-Z]\w*$/.test(leaf)) wantedTypes.add(leaf);
                }
            }
            attrs = [];
            continue;
        }

        let enumM = t.match(/^pub enum (\w+)/);
        if (enumM && !collectTypes && !wantedTypes.has(enumM[1])) enumM = null;
        let structM = t.match(/^pub struct (\w+)/);
        if (structM && !collectTypes && !wantedTypes.has(structM[1])) structM = null;
        const modM = t.match(/^(?:pub(?:\([^)]*\))?\s+)?mod (\w+)\s*([;{])/);
        const displayM = t.match(/^impl (?:[\w:]+::)?Display for (\w+)/);
        const traitImplM = !displayM && /^impl\b[^{]*\bfor\b/.test(t);
        const implM = displayM || traitImplM ? null : t.match(/^impl (\w+)\s*\{/);
        const freeFnM = collectTypes && !enumM && !structM && !modM && !displayM && !traitImplM && !implM
            ? t.match(FN_SIG_RE) : null;

        if (enumM) {
            const isReprI32 = attrs.some((a) => /repr\(i32\)/.test(a));
            const variants = [];
            let idx = 0;
            for (i += 1; i < lines.length && !/^\}/.test(lines[i].trim()); i += 1) {
                const v = lines[i].trim().match(/^(\w+)(?:\s*=\s*(-?\d+))?\s*,?$/);
                if (v) { variants.push({ name: v[1], value: v[2] !== undefined ? Number(v[2]) : idx }); idx = variants.at(-1).value + 1; }
            }
            if (isReprI32 && variants.length) enums.push({ name: enumM[1], variants });
            else log(`cppjs: rust bridge: enum ${enumM[1]} skipped (needs #[repr(i32)] and unit variants)`);
        } else if (structM) {
            const isReprC = attrs.some((a) => /repr\(C\)/.test(a));
            const derive = attrs.find((a) => a.startsWith('#[derive')) ?? '';
            if (isReprC) {
                const ok = derive.includes('Default') && derive.includes('Copy');
                const fields = [];
                for (i += 1; i < lines.length && !/^\}/.test(lines[i].trim()); i += 1) {
                    const f = lines[i].trim().match(/^pub (\w+)\s*:\s*([\w()]+)\s*,?$/);
                    if (f && PRIMITIVES.has(f[2])) fields.push({ name: f[1], type: f[2] });
                }
                if (ok && fields.length) valueObjects.push({ name: structM[1], fields });
                else log(`cppjs: rust bridge: struct ${structM[1]} skipped (repr(C) needs derive(Default, Copy) and pub primitive fields)`);
            } else {
                if (!classes.has(structM[1])) classes.set(structM[1], { name: structM[1], ctor: null, factories: [], methods: [] });
                if (t.endsWith('{')) { for (i += 1; i < lines.length && !/^\}/.test(lines[i].trim()); i += 1); }
            }
        } else if (modM) {
            // `mod x;` is followed for crate imports; inline `mod x { .. }` bodies are opaque.
            if (modM[2] === ';') mods.push({ name: modM[1], cfg: cfgOf(attrs) });
            else i = skipBlock(lines, i);
        } else if (displayM) {
            // `impl Display for X` -> a JS toString(); the block body itself is not parsed.
            displayNames.add(displayM[1]);
            i = skipBlock(lines, i);
        } else if (traitImplM) {
            i = skipBlock(lines, i);
        } else if (implM && classes.has(implM[1])) {
            const cls = classes.get(implM[1]);
            let depth = 1;
            for (i += 1; i < lines.length && depth > 0; i += 1) {
                const s = lines[i];
                const sig = s.trim().match(FN_SIG_RE);
                if (sig && depth === 1) parseFn(cls, sig, { enums, valueObjects, classes, allowJson: collectTypes, hasSerdeUse: acc.hasSerdeUse, hasArcUse: acc.hasArcUse, hasEmbindUse: acc.hasEmbindUse }, log);
                depth += (s.match(/\{/g) ?? []).length - (s.match(/\}/g) ?? []).length;
            }
            i -= 1;
        } else if (implM) {
            // Consume unknown-impl bodies so their fns are never misread as free functions.
            i = skipBlock(lines, i);
        } else if (freeFnM) {
            parseFreeFn(freeFns, freeFnM, { enums, valueObjects, classes, allowJson: collectTypes, hasSerdeUse: acc.hasSerdeUse, hasArcUse: acc.hasArcUse, hasEmbindUse: acc.hasEmbindUse }, log);
        }
        attrs = [];
    }
    return mods;
}

function finalizeModel(acc, log) {
    const { enums, valueObjects, classes, freeFns, displayNames } = acc;
    // A class with no exported surface is dropped (with a note), mirroring the C++ generator.
    for (const [name, cls] of classes) {
        if (!cls.ctor && !cls.factories.length && !cls.methods.length) {
            classes.delete(name);
            log(`cppjs: rust bridge: struct ${name} has no exportable pub fns - not registered`);
        }
    }
    for (const cls of classes.values()) {
        const collides = cls.methods.some((m) => camel(m.name) === 'toString');
        if (displayNames.has(cls.name) && collides) log(`cppjs: rust bridge: ${cls.name} Display->toString skipped (a toString method already exists)`);
        cls.hasDisplay = displayNames.has(cls.name) && !collides;
    }
    const anyJson = (args, ret) => args.some((p) => p.ty === JSON_TY) || ret === JSON_TY;
    const usesJson = freeFns.some((f) => anyJson(f.args, f.ret))
        || [...classes.values()].some((c) => (c.ctor && anyJson(c.ctor.args, '()'))
            || c.factories.some((f) => anyJson(f.args, '()'))
            || c.methods.some((m) => anyJson(m.args, m.ret)));

    // Shared (Arc) classes: collect every class named by an Arc<...> surface anywhere, then
    // enforce the shapes whose Box paths would corrupt the Arc-based delete()/share machinery.
    const sharedOf = new Set();
    const noteArc = (ty) => { const m = String(ty).match(ARC_RE); if (m) sharedOf.add(m[1]); };
    const noteAll = (args, ret) => { args.forEach((p) => noteArc(p.ty)); noteArc(ret); };
    freeFns.forEach((f) => noteAll(f.args, f.ret));
    for (const c of classes.values()) {
        if (c.factories.some((f) => f.shared)) sharedOf.add(c.name);
        if (c.ctor) noteAll(c.ctor.args, '()');
        c.factories.forEach((f) => noteAll(f.args, '()'));
        c.methods.forEach((m) => noteAll(m.args, m.ret));
    }
    for (const c of classes.values()) {
        if (!sharedOf.has(c.name)) continue;
        c.shared = true;
        if (c.ctor) {
            throw new Error(`cppjs: rust bridge: ${c.name} has Arc<...> surfaces, so a plain 'new' constructor cannot exist (its Box allocation would corrupt the shared delete()) - use a named factory returning Arc<Self>`);
        }
        const mut = c.methods.find((m) => !m.byRef);
        if (mut) {
            throw new Error(`cppjs: rust bridge: ${c.name} is shared via Arc<...>, so its methods must take &self ('${mut.name}' takes &mut self) - use interior mutability or drop the Arc surface`);
        }
        const boxed = c.factories.find((f) => !f.shared);
        if (boxed) {
            throw new Error(`cppjs: rust bridge: ${c.name} is shared via Arc<...>, so every factory must return Arc<Self> ('${boxed.name}' returns Self)`);
        }
    }
    return { enums, valueObjects, classes: [...classes.values()], freeFns, usesJson, sharedOf: [...sharedOf].sort() };
}

// Consumes a brace-delimited block starting at line i; returns the closing line's index.
function skipBlock(lines, i) {
    let depth = 0;
    let started = false;
    for (; i < lines.length; i += 1) {
        const opens = (lines[i].match(/\{/g) ?? []).length;
        depth += opens - ((lines[i].match(/\}/g) ?? []).length);
        if (opens > 0) started = true;
        if (started && depth <= 0) break;
    }
    return i;
}

// Splits `Result<T, E>` / `Option<T>` off a return type; `Result<T>` (an alias like
// anyhow/io::Result) also matches - the shim's Ok/Err arms work on any core Result underneath.
function analyzeReturn(raw) {
    const r = raw.trim();
    const res = r.match(/^Result\s*<\s*(.+?)\s*(?:,\s*([^<>]+?)\s*)?>$/);
    if (res) return { inner: res[1], throws: true, optional: false };
    const opt = r.match(/^Option\s*<\s*(.+?)\s*>$/);
    if (opt) return { inner: opt[1], throws: false, optional: true };
    return { inner: r, throws: false, optional: false };
}

function parseFn(cls, sig, ctx, log) {
    const { enums, valueObjects, classes } = ctx;
    const [, name, rawParams, rawRet] = sig;
    const known = (ty) => PRIMITIVES.has(ty)
        || enums.some((e) => e.name === ty) || valueObjects.some((v) => v.name === ty);
    // `&OtherClass` params: the referenced struct must already be declared (parsed) above.
    const isClassRef = (ty) => ty.startsWith('&') && !PARAM_ONLY.has(ty) && classes.has(ty.slice(1));

    const params = rawParams.split(',').map((p) => p.trim()).filter(Boolean);
    let selfKind = null;
    if (params[0] === '&mut self' || params[0] === '&self') selfKind = params.shift();
    else if (params[0] === 'self' || params[0] === 'mut self') {
        log(`cppjs: rust bridge: ${cls.name}::${name} skipped (consuming self is not supported)`);
        return;
    }

    const args = [];
    for (const p of params) {
        const m = p.match(/^(\w+)\s*:\s*(&\s*(?:str|String)|Option\s*<\s*(?:i32|f64|bool|String)\s*>|serde_json\s*::\s*Value|(?:std\s*::\s*sync\s*::\s*)?Arc\s*<\s*\w+\s*>|embind_rs\s*::\s*Js(?:Value|Function)|&\s*\w+|[\w()]+)$/);
        let ty = m?.[2].replace(/\s+/g, '');
        if (ty && !known(ty) && isJsonSpelling(ty, ctx)) ty = JSON_TY;
        if (ty) ty = normalizeArc(ty, ctx);
        const jsTokP = ty ? matchJsTok(ty, ctx) : null;
        if (jsTokP) ty = jsTokP;
        const arcParam = ty?.match(ARC_RE)?.[1];
        if (!m || !(known(ty) || ty === JSON_TY || jsTokP || (arcParam && classes.has(arcParam)) || PARAM_ONLY.has(ty) || OPTION_PARAM_RE.test(ty) || isClassRef(ty))) {
            log(`cppjs: rust bridge: ${cls.name}::${name} skipped (unsupported parameter '${p}')`);
            return;
        }
        args.push({ name: m[1], ty });
    }
    let { inner: ret, throws, optional } = analyzeReturn(rawRet ?? '()');
    if (!known(ret) && isJsonSpelling(ret, ctx)) ret = JSON_TY;
    ret = normalizeArc(ret.replace(/\s+/g, ''), ctx);
    const jsTokR = matchJsTok(ret, ctx);
    if (jsTokR) ret = jsTokR;
    if (jsTokR && optional) {
        log(`cppjs: rust bridge: ${cls.name}::${name} skipped (Option<${ret}> returns are not supported - return JsValue::undefined() instead)`);
        return;
    }

    if (!selfKind) {
        const arcSelf = ret === 'Arc<Self>' || ret === `Arc<${cls.name}>`;
        if (!arcSelf && ret !== 'Self' && ret !== cls.name) {
            log(`cppjs: rust bridge: ${cls.name}::${name} skipped (associated fns must return Self, Result<Self, E> or Option<Self>)`);
            return;
        }
        if (name === 'new') {
            if (arcSelf) { log(`cppjs: rust bridge: ${cls.name}::new skipped (Arc<Self> has no ctor shape - use a named factory like 'create')`); return; }
            if (optional) { log(`cppjs: rust bridge: ${cls.name}::new skipped (Option<Self> has no ctor shape - use a named factory or Result<Self, E>)`); return; }
            if (args.length > 3) { log(`cppjs: rust bridge: ${cls.name}::new skipped (max 3 args)`); return; }
            cls.ctor = { args, throws };
        } else {
            if (arcSelf && optional) { log(`cppjs: rust bridge: ${cls.name}::${name} skipped (Option<Arc<Self>> is not supported in this wave)`); return; }
            if (args.length > 2) { log(`cppjs: rust bridge: ${cls.name}::${name} skipped (factories take max 2 args)`); return; }
            cls.factories.push({ name, args, throws, optional, shared: arcSelf });
        }
        return;
    }
    const retArcInner = ret.match(ARC_RE)?.[1];
    if (retArcInner) {
        const target = retArcInner === 'Self' ? cls.name : retArcInner;
        if (!classes.has(target)) {
            log(`cppjs: rust bridge: ${cls.name}::${name} skipped (unsupported return '${ret}')`);
            return;
        }
        if (optional || throws) {
            log(`cppjs: rust bridge: ${cls.name}::${name} skipped (Arc returns on methods support neither Option nor Result in this wave)`);
            return;
        }
        if (args.length > 4) { log(`cppjs: rust bridge: ${cls.name}::${name} skipped (max 4 args)`); return; }
        cls.methods.push({ name, args, ret: `Arc<${target}>`, byRef: selfKind === '&self', throws: false, optionalRet: false });
        return;
    }
    if (optional && !OPTION_INNERS.has(ret)) {
        log(`cppjs: rust bridge: ${cls.name}::${name} skipped (Option<${ret}> return is not representable - inners: i32, f64, bool, String; or an Option<Self> factory)`);
        return;
    }
    if (!known(ret) && ret !== JSON_TY && !jsTokR) {
        log(`cppjs: rust bridge: ${cls.name}::${name} skipped (unsupported return '${ret}')`);
        return;
    }
    if (args.length > 4) { log(`cppjs: rust bridge: ${cls.name}::${name} skipped (max 4 args)`); return; }
    cls.methods.push({ name, args, ret, byRef: selfKind === '&self', throws, optionalRet: optional });
}

function parseFreeFn(freeFns, sig, ctx, log) {
    const { enums, valueObjects, classes } = ctx;
    const [, name, rawParams, rawRet] = sig;
    const known = (ty) => PRIMITIVES.has(ty)
        || enums.some((e) => e.name === ty) || valueObjects.some((v) => v.name === ty);
    const isClassRef = (ty) => ty.startsWith('&') && !PARAM_ONLY.has(ty) && classes.has(ty.slice(1));

    const args = [];
    for (const p of rawParams.split(',').map((s) => s.trim()).filter(Boolean)) {
        const m = p.match(/^(\w+)\s*:\s*(&\s*(?:str|String)|Option\s*<\s*(?:i32|f64|bool|String)\s*>|serde_json\s*::\s*Value|(?:std\s*::\s*sync\s*::\s*)?Arc\s*<\s*\w+\s*>|embind_rs\s*::\s*Js(?:Value|Function)|&\s*\w+|[\w()]+)$/);
        let ty = m?.[2].replace(/\s+/g, '');
        if (ty && !known(ty) && isJsonSpelling(ty, ctx)) ty = JSON_TY;
        if (ty) ty = normalizeArc(ty, ctx);
        const jsTokP = ty ? matchJsTok(ty, ctx) : null;
        if (jsTokP) ty = jsTokP;
        const arcParam = ty?.match(ARC_RE)?.[1];
        if (!m || !(known(ty) || ty === JSON_TY || jsTokP || (arcParam && classes.has(arcParam)) || PARAM_ONLY.has(ty) || OPTION_PARAM_RE.test(ty) || isClassRef(ty))) {
            log(`cppjs: rust bridge: fn ${name} skipped (unsupported parameter '${p}')`);
            return;
        }
        args.push({ name: m[1], ty });
    }
    let { inner: ret, throws, optional } = analyzeReturn(rawRet ?? '()');
    if (!known(ret) && isJsonSpelling(ret, ctx)) ret = JSON_TY;
    ret = normalizeArc(ret.replace(/\s+/g, ''), ctx);
    const jsTokR = matchJsTok(ret, ctx);
    if (jsTokR) ret = jsTokR;
    const retArc = ret.match(ARC_RE)?.[1];
    if (retArc) {
        if (!classes.has(retArc)) { log(`cppjs: rust bridge: fn ${name} skipped (unsupported return '${ret}')`); return; }
        if (optional || throws) { log(`cppjs: rust bridge: fn ${name} skipped (Arc returns support neither Option nor Result in this wave)`); return; }
    }
    if (jsTokR && optional) { log(`cppjs: rust bridge: fn ${name} skipped (Option<${ret}> returns are not supported - return JsValue::undefined() instead)`); return; }
    if (optional && !OPTION_INNERS.has(ret)) { log(`cppjs: rust bridge: fn ${name} skipped (Option<${ret}> return is not representable - inners: i32, f64, bool, String)`); return; }
    if (!known(ret) && ret !== JSON_TY && !retArc && !jsTokR) { log(`cppjs: rust bridge: fn ${name} skipped (unsupported return '${ret}')`); return; }
    if (args.length > 4) { log(`cppjs: rust bridge: fn ${name} skipped (max 4 args)`); return; }
    freeFns.push({ name, jsName: camel(name), args, ret, throws, optionalRet: optional });
}

// ---------------- emitter ----------------

const camel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

function emitBridge(model, { userCrate, vectors, log, prelude = '' }) {
    const U = userCrate;
    const isEnum = (ty) => model.enums.some((e) => e.name === ty);
    const isVo = (ty) => model.valueObjects.some((v) => v.name === ty);
    // Bridge-local wire type of a signature token, and the two directions of the shim adaptation.
    // &str/&String params cross as String (borrowed at the call site); &OtherClass params cross
    // as the class pointer via a bridge-local Ref wrapper (borrowed unsafely at the call site).
    const isRef = (ty) => ty.startsWith('&') && !PARAM_ONLY.has(ty);
    const arcInner = (ty) => String(ty).match(ARC_RE)?.[1];
    const wireTy = (ty) => (PARAM_ONLY.has(ty) ? 'String'
        : isRef(ty) ? `${ty.slice(1)}Ref`
            : ty === JSON_TY ? '__CppjsJson'
                : JS_TOKS.has(ty) ? `embind_rs::${ty}`
                    : arcInner(ty) ? `${arcInner(ty)}Shared`
                        : isEnum(ty) || isVo(ty) ? `${ty}W` : ty);
    const unwrap = (ty, expr) => (PARAM_ONLY.has(ty) ? `&${expr}`
        : isRef(ty) ? `unsafe { &*${expr}.0 }`
            : ty === JSON_TY || arcInner(ty) || isEnum(ty) || isVo(ty) ? `${expr}.0` : expr);
    const wrap = (ty, expr) => (ty === JSON_TY ? `__CppjsJson(${expr})`
        : arcInner(ty) ? `${arcInner(ty)}Shared(${expr})`
            : isEnum(ty) || isVo(ty) ? `${ty}W(${expr})` : expr);

    const out = [];
    out.push('// Generated by cpp.js rustBridgeGen - do not edit. The user crate stays plain Rust;');
    out.push('// newtype wrappers (orphan rule) + shim fns adapt its pub surface to embind-rs.');
    out.push('#![allow(clippy::all)]');
    out.push('#![allow(unused_imports)]');
    out.push('use embind_rs::{class_, enum_, enum_tid, register_vector, value_object_, value_object_tid, WireType};');
    out.push('use std::ffi::c_void;');
    out.push('');
    if (prelude) {
        out.push(prelude);
        out.push('');
    }

    for (const e of model.enums) {
        out.push('#[derive(Clone, Copy)]');
        out.push('#[repr(transparent)]');
        out.push(`pub struct ${e.name}W(pub ${U}::${e.name});`);
        out.push(`impl WireType for ${e.name}W {`);
        out.push('    type Wire = i32;');
        out.push("    const SIG: char = 'i';");
        out.push(`    fn tid() -> *const c_void { enum_tid::<${e.name}W>() }`);
        out.push(`    fn from_wire(w: i32) -> ${e.name}W {`);
        out.push('        match w {');
        for (const v of e.variants) out.push(`            ${v.value} => ${e.name}W(${U}::${e.name}::${v.name}),`);
        out.push(`            _ => ${e.name}W(${U}::${e.name}::${e.variants[0].name}),`);
        out.push('        }');
        out.push('    }');
        out.push('    fn to_wire(self) -> i32 { self.0 as i32 }');
        out.push('}');
        out.push(`impl embind_rs::ErrSentinel for ${e.name}W { fn err_sentinel() -> Self { <${e.name}W as WireType>::from_wire(0) } }`);
        out.push('');
    }

    for (const v of model.valueObjects) {
        out.push('#[derive(Clone, Copy)]');
        out.push('#[repr(transparent)]');
        out.push(`pub struct ${v.name}W(pub ${U}::${v.name});`);
        out.push(`impl Default for ${v.name}W { fn default() -> Self { ${v.name}W(${U}::${v.name}::default()) } }`);
        out.push(`impl WireType for ${v.name}W {`);
        out.push(`    type Wire = *mut ${v.name}W;`);
        out.push("    const SIG: char = 'p';");
        out.push(`    fn tid() -> *const c_void { value_object_tid::<${v.name}W>() }`);
        out.push(`    fn from_wire(w: *mut ${v.name}W) -> ${v.name}W { unsafe { *w } }`);
        out.push(`    fn to_wire(self) -> *mut ${v.name}W { Box::into_raw(Box::new(self)) }`);
        out.push('}');
        out.push(`impl embind_rs::ErrSentinel for ${v.name}W { fn err_sentinel() -> Self { Default::default() } }`);
        out.push('');
    }

    // `&OtherClass` params ride the class pointer wire through per-class Ref wrappers; collect
    // the referenced classes up front so the wrappers exist before the shims that use them.
    const classRefs = new Set();
    const scanRefs = (args) => args.forEach((p) => { if (isRef(p.ty)) classRefs.add(p.ty.slice(1)); });
    for (const cls of model.classes) {
        if (cls.ctor) scanRefs(cls.ctor.args);
        cls.factories.forEach((f) => scanRefs(f.args));
        cls.methods.forEach((m) => scanRefs(m.args));
    }
    (model.freeFns ?? []).forEach((f) => scanRefs(f.args));
    for (const name of [...classRefs].sort()) {
        out.push('#[derive(Clone, Copy)]');
        out.push('#[repr(transparent)]');
        out.push(`pub struct ${name}Ref(pub *mut ${U}::${name});`);
        out.push(`impl WireType for ${name}Ref {`);
        out.push('    type Wire = *mut c_void;');
        out.push("    const SIG: char = 'p';");
        out.push(`    fn tid() -> *const c_void { embind_rs::class_tid::<${U}::${name}>() }`);
        out.push(`    fn from_wire(w: *mut c_void) -> ${name}Ref { ${name}Ref(w as *mut ${U}::${name}) }`);
        out.push(`    fn to_wire(self) -> *mut c_void { self.0 as *mut c_void }`);
        out.push('}');
        out.push('');
    }

    if (model.usesJson) {
        out.push('// serde_json::Value crosses as a deep JSON copy: the adapter converts handle <->');
        out.push('// [u32 len][bytes] JSON text through the host JSON codec; serde maps text <-> Value here.');
        out.push('#[repr(transparent)]');
        out.push('pub struct __CppjsJson(pub serde_json::Value);');
        out.push('extern "C" {');
        out.push('    fn cppjs_tid_emval() -> *const c_void;');
        out.push('    fn cppjs_emval_json_to_handle(w: *mut u8) -> usize;');
        out.push('    fn cppjs_emval_handle_to_json(h: usize) -> *mut u8;');
        out.push('    fn malloc(n: usize) -> *mut u8;');
        out.push('    fn free(p: *mut u8);');
        out.push('}');
        out.push('impl WireType for __CppjsJson {');
        out.push('    type Wire = usize;');
        out.push('    // Handles are i32 table indexes on wasm but BigInt-marshalled 64-bit values on');
        out.push("    // native (the jsi adapter's pointer slots), so the sig letter is per-family.");
        out.push('    #[cfg(target_family = "wasm")]');
        out.push("    const SIG: char = 'i';");
        out.push('    #[cfg(not(target_family = "wasm"))]');
        out.push("    const SIG: char = 'p';");
        out.push('    fn tid() -> *const c_void { unsafe { cppjs_tid_emval() } }');
        out.push('    fn from_wire(w: usize) -> Self {');
        out.push('        unsafe {');
        out.push('            let p = cppjs_emval_handle_to_json(w);');
        out.push('            let len = *(p as *const u32) as usize;');
        out.push('            let bytes = std::slice::from_raw_parts(p.add(4), len);');
        out.push('            let v = serde_json::from_slice(bytes).unwrap_or(serde_json::Value::Null);');
        out.push('            free(p);');
        out.push('            __CppjsJson(v)');
        out.push('        }');
        out.push('    }');
        out.push('    fn to_wire(self) -> usize {');
        out.push('        let s = self.0.to_string();');
        out.push('        unsafe {');
        out.push('            let bytes = s.as_bytes();');
        out.push('            let base = malloc(4 + bytes.len());');
        out.push('            *(base as *mut u32) = bytes.len() as u32;');
        out.push('            std::ptr::copy_nonoverlapping(bytes.as_ptr(), base.add(4), bytes.len());');
        out.push('            cppjs_emval_json_to_handle(base)');
        out.push('        }');
        out.push('    }');
        out.push('}');
        out.push('impl embind_rs::ErrSentinel for __CppjsJson { fn err_sentinel() -> Self { __CppjsJson(serde_json::Value::Null) } }');
        out.push('');
    }

    // Arc<X> surfaces cross as the class's shared smart-pointer wire: the raw Arc::into_raw
    // pointer, one strong count per JS handle (given on to_wire, added on from_wire).
    for (const inner of model.sharedOf ?? []) {
        out.push('#[repr(transparent)]');
        out.push(`pub struct ${inner}Shared(pub std::sync::Arc<${U}::${inner}>);`);
        out.push(`impl WireType for ${inner}Shared {`);
        out.push('    type Wire = *mut c_void;');
        out.push("    const SIG: char = 'p';");
        out.push(`    fn tid() -> *const c_void { embind_rs::shared_tid::<${U}::${inner}>() }`);
        out.push('    fn from_wire(w: *mut c_void) -> Self {');
        out.push('        unsafe {');
        out.push(`            std::sync::Arc::increment_strong_count(w as *const ${U}::${inner});`);
        out.push(`            ${inner}Shared(std::sync::Arc::from_raw(w as *const ${U}::${inner}))`);
        out.push('        }');
        out.push('    }');
        out.push(`    fn to_wire(self) -> *mut c_void { std::sync::Arc::into_raw(self.0) as *mut c_void }`);
        out.push('}');
        out.push('');
    }

    const registrations = [];
    const usedOptionals = new Set();
    const noteOptionArgs = (args) => args.forEach((p) => {
        const m = p.ty.match(OPTION_PARAM_RE);
        if (m) usedOptionals.add(m[1]);
    });
    for (const e of model.enums) {
        registrations.push(`    enum_::<${e.name}W>("${e.name}")${e.variants.map((v) => `.value("${v.name}", ${v.value})`).join('')};`);
    }
    for (const v of model.valueObjects) {
        const fields = v.fields.map((f) => `.field::<${f.type}>("${f.name}", core::mem::offset_of!(${U}::${v.name}, ${f.name}))`).join('');
        registrations.push(`    value_object_::<${v.name}W>("${v.name}")${fields}.finalize();`);
    }
    for (const vec of vectors) {
        if (!VECTOR_ITEM_TYPES.has(vec.of)) { log(`cppjs: rust bridge: vector of '${vec.of}' skipped (supported: i32, f64, bool)`); continue; }
        registrations.push(`    register_vector::<${vec.of}>("${vec.name}");`);
    }

    for (const cls of model.classes) {
        const C = `${U}::${cls.name}`;
        const shim = (fnName) => `__${cls.name.toLowerCase()}_${fnName}`;
        const chain = [`    class_::<${C}>("${cls.name}")`];

        if (cls.shared) chain.push(`        .smart_ptr_shared("${cls.name}Shared")`);
        else if (cls.factories.length) chain.push(`        .smart_ptr("${cls.name}Ptr")`);
        if (cls.ctor) {
            const a = cls.ctor.args;
            noteOptionArgs(a);
            const ps = a.map((p, i) => `a${i}: ${wireTy(p.ty)}`).join(', ');
            const call = `${C}::new(${a.map((p, i) => unwrap(p.ty, `a${i}`)).join(', ')})`;
            if (cls.ctor.throws) {
                out.push(`fn ${shim('new')}(${ps}) -> *mut ${C} { match ${call} { Ok(v) => Box::into_raw(Box::new(v)), Err(e) => embind_rs::raise_err(e.to_string()) } }`);
                chain.push(`        .constructor_ptr${a.length}(${shim('new')})`);
            } else {
                out.push(`fn ${shim('new')}(${ps}) -> ${C} { ${call} }`);
                chain.push(`        .constructor${a.length}(${shim('new')})`);
            }
        }
        for (const f of cls.factories) {
            noteOptionArgs(f.args);
            const ps = f.args.map((p, i) => `a${i}: ${wireTy(p.ty)}`).join(', ');
            const call = `${C}::${f.name}(${f.args.map((p, i) => unwrap(p.ty, `a${i}`)).join(', ')})`;
            if (f.shared) {
                if (f.throws) {
                    out.push(`fn ${shim(f.name)}(${ps}) -> *mut ${C} { match ${call} { Ok(v) => std::sync::Arc::into_raw(v) as *mut ${C}, Err(e) => embind_rs::raise_err(e.to_string()) } }`);
                    chain.push(`        .create_ptr${f.args.length}("${camel(f.name)}", ${shim(f.name)})`);
                } else {
                    out.push(`fn ${shim(f.name)}(${ps}) -> std::sync::Arc<${C}> { ${call} }`);
                    chain.push(`        .create_arc${f.args.length}("${camel(f.name)}", ${shim(f.name)})`);
                }
                continue;
            }
            if (f.throws) {
                out.push(`fn ${shim(f.name)}(${ps}) -> *mut ${C} { match ${call} { Ok(v) => Box::into_raw(Box::new(v)), Err(e) => embind_rs::raise_err(e.to_string()) } }`);
                chain.push(`        .create_ptr${f.args.length}("${camel(f.name)}", ${shim(f.name)})`);
            } else if (f.optional) {
                out.push(`fn ${shim(f.name)}(${ps}) -> *mut ${C} { match ${call} { Some(v) => Box::into_raw(Box::new(v)), None => core::ptr::null_mut() } }`);
                chain.push(`        .create_ptr${f.args.length}("${camel(f.name)}", ${shim(f.name)})`);
            } else {
                out.push(`fn ${shim(f.name)}(${ps}) -> ${C} { ${call} }`);
                chain.push(`        .create${f.args.length}("${camel(f.name)}", ${shim(f.name)})`);
            }
        }
        for (const m of cls.methods) {
            noteOptionArgs(m.args);
            const params = [`t: &mut ${C}`, ...m.args.map((p, i) => `a${i}: ${wireTy(p.ty)}`)].join(', ');
            const callArgs = m.args.map((p, i) => unwrap(p.ty, `a${i}`)).join(', ');
            const recv = m.byRef ? '(&*t)' : 't';
            const call = `${recv}.${m.name}(${callArgs})`;
            const body = m.throws
                ? `match ${call} { Ok(v) => ${wrap(m.ret, 'v')}, Err(e) => embind_rs::raise_err(e.to_string()) }`
                : (m.ret === '()' ? call : wrap(m.ret, call));
            const retTy = m.optionalRet ? `Option<${m.ret}>` : (m.ret === '()' ? '()' : wireTy(m.ret));
            if (m.optionalRet) usedOptionals.add(m.ret);
            out.push(`fn ${shim(m.name)}(${params}) -> ${retTy} { ${body} }`);
            chain.push(`        .function${m.args.length}("${camel(m.name)}", ${shim(m.name)})`);
        }
        if (cls.hasDisplay) {
            out.push(`fn ${shim('display_tostring')}(t: &mut ${C}) -> String { format!("{}", (&*t)) }`);
            chain.push(`        .function0("toString", ${shim('display_tostring')})`);
        }
        registrations.push(`${chain.join('\n')};`);
    }

    for (const f of model.freeFns ?? []) {
        noteOptionArgs(f.args);
        const ps = f.args.map((p, i) => `a${i}: ${wireTy(p.ty)}`).join(', ');
        const call = `${U}::${f.name}(${f.args.map((p, i) => unwrap(p.ty, `a${i}`)).join(', ')})`;
        const retTy = f.optionalRet ? `Option<${f.ret}>` : (f.ret === '()' ? '()' : wireTy(f.ret));
        if (f.optionalRet) usedOptionals.add(f.ret);
        const body = f.throws
            ? `match ${call} { Ok(v) => ${wrap(f.ret, 'v')}, Err(e) => embind_rs::raise_err(e.to_string()) }`
            : (f.ret === '()' ? call : wrap(f.ret, call));
        out.push(`fn __free_${f.name}(${ps}) -> ${retTy} { ${body} }`);
        registrations.push(`    embind_rs::fn${f.args.length}("${f.jsName}", __free_${f.name});`);
    }

    // Optional inner types register once up front (the adapters dedupe across archives).
    for (const inner of [...usedOptionals].sort()) {
        registrations.unshift(`    embind_rs::${OPTIONAL_REG[inner]}();`);
    }

    out.push('');
    out.push('embind_rs::bindings! {');
    out.push(registrations.join('\n'));
    out.push('}');
    out.push('');
    return out.join('\n');
}

// ---------------- .d.ts emitter ----------------

const TS_TYPES = {
    i32: 'number', i64: 'bigint', u64: 'bigint', f64: 'number', bool: 'boolean',
    String: 'string', '&str': 'string', '&String': 'string', '()': 'void',
};

// Editor-facing types for the package import (`import { X } from '<pkg>'`): the metro/vite
// resolver serves the runtime proxy, this file serves TypeScript. Exports are typed post-init
// (null until any init() resolves, which binds every imported module - same as the C++ .h flow).
export function emitDts(model, vectors, mode = 'sync') {
    const wrap = (t) => (mode === 'promise' ? `Promise<${t}>` : t);
    const ts = (ty) => {
        const opt = ty.match(OPTION_PARAM_RE);
        if (opt) return `${TS_TYPES[opt[1]] ?? opt[1]} | null | undefined`;
        if (ty === JSON_TY) return 'JsonValue';
        const arc = ty.match(ARC_RE);
        if (arc) return arc[1];  // Arc<X> is transparent in JS: the shared instance itself
        if (ty === 'JsValue') return 'unknown';
        if (ty === 'JsFunction') return '(...args: unknown[]) => unknown';
        if (ty.startsWith('&')) return TS_TYPES[ty] ?? ty.slice(1);  // &OtherClass param
        return TS_TYPES[ty] ?? ty;
    };
    const out = ['// Generated by cpp.js rustBridgeGen - do not edit. Values are usable after init().', ''];
    if (model.usesJson) out.push('export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };', '');

    for (const v of model.valueObjects) {
        out.push(`export interface ${v.name} { ${v.fields.map((f) => `${f.name}: ${ts(f.type)};`).join(' ')} }`);
    }
    for (const e of model.enums) {
        out.push(`export interface ${e.name} { readonly __cppjsEnum?: '${e.name}'; }`);
        out.push(`export declare let ${e.name}: { ${e.variants.map((v) => `readonly ${v.name}: ${e.name};`).join(' ')} };`);
    }
    for (const cls of model.classes) {
        out.push(`export declare class ${cls.name} {`);
        if (cls.ctor) out.push(`    constructor(${cls.ctor.args.map((p) => `${p.name}: ${ts(p.ty)}`).join(', ')});`);
        else out.push('    private constructor();');
        for (const f of cls.factories) {
            out.push(`    static ${camel(f.name)}(${f.args.map((p) => `${p.name}: ${ts(p.ty)}`).join(', ')}): ${wrap(`${cls.name}${f.optional ? ' | null' : ''}`)};`);
        }
        for (const m of cls.methods) {
            out.push(`    ${camel(m.name)}(${m.args.map((p) => `${p.name}: ${ts(p.ty)}`).join(', ')}): ${wrap(`${ts(m.ret)}${m.optionalRet ? ' | undefined' : ''}`)};`);
        }
        if (cls.hasDisplay) out.push(`    toString(): ${wrap('string')};`);
        out.push(`    delete(): ${wrap('void')};`);
        out.push('}');
    }
    for (const f of model.freeFns ?? []) {
        out.push(`export declare function ${f.jsName}(${f.args.map((p) => `${p.name}: ${ts(p.ty)}`).join(', ')}): ${wrap(`${ts(f.ret)}${f.optionalRet ? ' | undefined' : ''}`)};`);
    }
    for (const vec of vectors) {
        if (!VECTOR_ITEM_TYPES.has(vec.of)) continue;
        out.push(`export declare class ${vec.name} {`);
        out.push('    constructor();');
        out.push(`    push_back(value: ${ts(vec.of)}): ${wrap('void')};`);
        out.push(`    get(index: number): ${wrap(ts(vec.of))};`);
        out.push(`    size(): ${wrap('number')};`);
        out.push(`    delete(): ${wrap('void')};`);
        out.push('}');
    }
    out.push('export declare let AllSymbols: Record<string, unknown>;');
    out.push('export declare function initNative(config?: Record<string, unknown>): Promise<unknown>;');
    out.push('');
    return out.join('\n');
}

// CLI: run inside a cargo package dir (reads its cppjs.config.mjs for crate path + vectors).
const isCli = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isCli) {
    const config = (await import(pathToFileURL(`${process.cwd()}/cppjs.config.mjs`).href)).default;
    const crateDir = path.resolve(process.cwd(), config.export?.crate ?? 'crate');
    const { bridgeDir } = generateRustBridge({
        crateDir,
        vectors: config.export?.bindings?.vectors ?? [],
        dtsFile: `${process.cwd()}/dist/js/index.d.ts`,
    });
    console.log(bridgeDir);
}

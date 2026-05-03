#!/usr/bin/env node
/**
 * Generate a new cppjs-package-<name>/ family by copying the cppjs-package-zlib
 * skeleton and rewriting "zlib" references.
 *
 * Usage:
 *   node scripts/scaffold-package.js <name> [options]
 *
 * Required:
 *   <name>            Package short name. Lowercase, no spaces. (e.g. libsodium)
 *
 * Options:
 *   --scope <scope>   Either "@cpp.js" (in-repo) or "" (unscoped community).
 *                     Default: "@cpp.js" if invoked from inside this repo,
 *                     otherwise prompts the user to be explicit.
 *   --license <id>    SPDX license identifier for the wrapper. Default: MIT.
 *   --lib <name>      Linked library short name (the "z" in libz.a). Default: <name>.
 *   --output <dir>    Where to create the package family. Default: cppjs-packages/.
 *   --force           Overwrite an existing target directory.
 *
 * Example:
 *   node scripts/scaffold-package.js libsodium --lib sodium
 *   node scripts/scaffold-package.js mylib --scope "" --license Apache-2.0
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATE_DIR = path.join(ROOT, 'cppjs-packages', 'cppjs-package-zlib');
const TEMPLATE_SHORT = 'zlib';
const TEMPLATE_LIB = 'z';

const args = process.argv.slice(2);
function arg(flag) {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : null;
}

const positional = args.find((a, i) => !a.startsWith('--') && (i === 0 || !args[i - 1]?.startsWith('--')));
const NAME = positional;
if (!NAME || !/^[a-z][a-z0-9-]*$/.test(NAME)) {
    process.stderr.write('error: missing or invalid <name> (must match [a-z][a-z0-9-]*)\n');
    process.stderr.write('usage: node scripts/scaffold-package.js <name> [--scope ""] [--license MIT] [--lib <name>]\n');
    process.exit(1);
}

const SCOPE = arg('--scope') ?? '@cpp.js';
const LICENSE = arg('--license') ?? 'MIT';
const LIB = arg('--lib') ?? NAME;
const OUTPUT_DIR = arg('--output') ?? path.join(ROOT, 'cppjs-packages');
const FORCE = args.includes('--force');

if (SCOPE && !/^@[a-z][a-z0-9.\-_]*$/.test(SCOPE)) {
    process.stderr.write(`error: --scope must be an npm scope like "@my-org" or "" for unscoped\n`);
    process.exit(1);
}

const targetFamily = path.join(OUTPUT_DIR, `cppjs-package-${NAME}`);
if (fs.existsSync(targetFamily) && !FORCE) {
    process.stderr.write(`error: ${path.relative(ROOT, targetFamily)} already exists. Use --force to overwrite.\n`);
    process.exit(1);
}

// ---- Filename + content rewrite rules ----
function rewriteName(s) {
    return s.replaceAll(`cppjs-package-${TEMPLATE_SHORT}`, `cppjs-package-${NAME}`);
}

function rewriteContent(s, relPath) {
    // package.json — special-case so we hit JSON keys cleanly
    if (path.basename(relPath) === 'package.json') {
        let pkg;
        try {
            pkg = JSON.parse(s);
        } catch {
            return s;
        }
        if (pkg.name) {
            pkg.name = pkg.name
                .replace(`cppjs-package-${TEMPLATE_SHORT}`, `cppjs-package-${NAME}`)
                .replace(`package-${TEMPLATE_SHORT}`, `package-${NAME}`);
            if (SCOPE === '') pkg.name = pkg.name.replace(/^@cpp\.js\//, '');
            else if (SCOPE !== '@cpp.js') pkg.name = pkg.name.replace(/^@cpp\.js\//, `${SCOPE}/`);
        }
        if ('version' in pkg) pkg.version = '0.1.0';
        if ('nativeVersion' in pkg) pkg.nativeVersion = '';
        if (pkg.license) pkg.license = LICENSE;
        if (pkg.description) pkg.description = pkg.description.replace(new RegExp(TEMPLATE_SHORT, 'gi'), NAME);
        if (Array.isArray(pkg.keywords)) {
            pkg.keywords = pkg.keywords.filter((k) => k !== TEMPLATE_SHORT && k !== TEMPLATE_LIB && k !== `lib${TEMPLATE_LIB}`).concat([NAME]);
            // dedupe
            pkg.keywords = [...new Set(pkg.keywords)];
        }
        // strip workspace deps that obviously don't apply yet
        if (pkg.dependencies) {
            for (const dep of Object.keys(pkg.dependencies)) {
                if (dep.startsWith(`@cpp.js/package-${TEMPLATE_SHORT}`)) delete pkg.dependencies[dep];
            }
        }
        return `${JSON.stringify(pkg, null, 4)}\n`;
    }

    // Generic text: replace zlib short and z lib token
    let out = s.replaceAll(`cppjs-package-${TEMPLATE_SHORT}`, `cppjs-package-${NAME}`);
    if (SCOPE === '') out = out.replaceAll(`@cpp.js/package-${NAME}`, `cppjs-package-${NAME}`);
    else if (SCOPE !== '@cpp.js') out = out.replaceAll('@cpp.js/package-', `${SCOPE}/package-`);

    // The lib short name "z" appears in cmake / podspec contexts. Be conservative
    // — replace it only when it sits alongside lib-style spellings.
    if (LIB !== TEMPLATE_LIB) {
        out = out.replaceAll(`lib${TEMPLATE_LIB}.a`, `lib${LIB}.a`);
        out = out.replaceAll(`lib${TEMPLATE_LIB}.so`, `lib${LIB}.so`);
        out = out.replaceAll(`${TEMPLATE_LIB}.xcframework`, `${LIB}.xcframework`);
        // cmake / podspec lib references like "z" in a libName array
        out = out.replaceAll(`'${TEMPLATE_LIB}'`, `'${LIB}'`);
        out = out.replaceAll(`"${TEMPLATE_LIB}"`, `"${LIB}"`);
    }

    return out;
}

// ---- Walk template, copy with rewrites, skip build artifacts ----
const SKIP_DIRS = new Set(['node_modules', '.cppjs', 'dist']);
const SKIP_SUFFIXES = ['.xcframework'];

let copied = 0;
let skipped = 0;

function copyDir(src, dst) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        if (SKIP_DIRS.has(entry.name)) {
            skipped++;
            continue;
        }
        if (SKIP_SUFFIXES.some((sfx) => entry.name.endsWith(sfx))) {
            skipped++;
            continue;
        }
        const srcPath = path.join(src, entry.name);
        const dstName = rewriteName(entry.name);
        const dstPath = path.join(dst, dstName);
        if (entry.isDirectory()) {
            copyDir(srcPath, dstPath);
        } else if (entry.isFile()) {
            const rel = path.relative(TEMPLATE_DIR, srcPath);
            const isBinary = /\.(a|so|dylib|wasm|jpg|png|gif|zip|tgz)$/i.test(entry.name);
            if (isBinary) {
                fs.copyFileSync(srcPath, dstPath);
            } else {
                const original = fs.readFileSync(srcPath, 'utf8');
                fs.writeFileSync(dstPath, rewriteContent(original, rel));
            }
            copied++;
        }
    }
}

if (fs.existsSync(targetFamily) && FORCE) {
    fs.rmSync(targetFamily, { recursive: true, force: true });
}

copyDir(TEMPLATE_DIR, targetFamily);

const finalName = SCOPE ? `${SCOPE}/package-${NAME}` : `cppjs-package-${NAME}`;

process.stdout.write(
    [
        '',
        `✓ Scaffolded ${finalName} (${copied} files copied, ${skipped} build artifacts skipped)`,
        `  → ${path.relative(ROOT, targetFamily)}`,
        '',
        'Next steps:',
        '  1. Edit cppjs.build.js in each sub-arch to fetch + build your library:',
        `     ${path.relative(ROOT, path.join(targetFamily, `cppjs-package-${NAME}-wasm/cppjs.build.js`))}`,
        '  2. Set the upstream version:',
        '     pnpm run check:native -- --update',
        `  3. Add C++ deps your library needs to each sub-arch's package.json "dependencies".`,
        '  4. Build:',
        `     pnpm --filter='${SCOPE || ''}${SCOPE ? '/' : ''}package-${NAME}*' run build`,
        '  5. See docs/playbooks/new-package.md for the full author flow.',
        '',
    ].join('\n'),
);

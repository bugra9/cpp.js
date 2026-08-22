import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { state, buildDependencies, getDependenciesStamp, getTargetParams } from 'crossbind';

const buildType = (process.argv[2] || 'Release').toLowerCase();
const archs = (process.argv[3] || '').split(',').map((s) => s.trim()).filter(Boolean);

await buildDependencies({
    targetParams: getTargetParams({
        platform: ['android'],
        ...(archs.length > 0 ? { arch: archs } : {}),
        runtime: ['mt'],
        buildType: [buildType],
    }, true),
});

// App-local Rust surfaces feed the configure-time super-staticlib (build_android.js), so their
// membership AND content must bust the configure too: a NEW bare-crate import used to link a
// super without its bridge until a manual .cxx wipe. embind-rs is the cargo-side runtime dep.
function appRustStamp() {
    const parts = [];
    for (const root of ['rust-bridges', 'rust-crates']) {
        const dir = `${state.config.paths.cache}/${root}`;
        if (!fs.existsSync(dir)) continue;
        for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
            const files = e.isDirectory()
                ? [`${dir}/${e.name}/Cargo.toml`, `${dir}/${e.name}/src/lib.rs`]
                : [`${dir}/${e.name}`];
            for (const f of files.filter((file) => fs.existsSync(file))) {
                parts.push(`${root}/${e.name}:${crypto.createHash('sha1').update(fs.readFileSync(f)).digest('hex')}`);
            }
        }
    }
    const embindRs = path.join(path.dirname(fs.realpathSync(
        createRequire(import.meta.url).resolve('@crossbind/core-embind-rust/package.json'),
    )), 'crate/src/lib.rs');
    if (fs.existsSync(embindRs)) parts.push(`embind-rs:${crypto.createHash('sha1').update(fs.readFileSync(embindRs)).digest('hex')}`);
    return crypto.createHash('sha1').update(parts.join('\n')).digest('hex');
}

// CMakeLists registers this file as CMAKE_CONFIGURE_DEPENDS: when the consumed
// rebuilt-dependency set changes, ninja re-runs the CMake configure on its own.
const stamp = `${getDependenciesStamp()}:${appRustStamp()}`;
const stampFile = `${state.config.paths.cache}/deps-stamp`;
fs.mkdirSync(state.config.paths.cache, { recursive: true });
// Only on change: a fresh mtime would make ninja re-run the configure every build.
if (!fs.existsSync(stampFile) || fs.readFileSync(stampFile, 'utf8') !== stamp) {
    fs.writeFileSync(stampFile, stamp);
}
console.log(`CROSSBIND_DEPS_STAMP=${stamp}`);

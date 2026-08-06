import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import state from '../state/index.js';
import logger from '../utils/logger.js';
import { cargoTripleFor } from '../utils/cargoTarget.js';
import generateRustBridge from '../utils/rustBridgeGen.js';

// buildType 'cargo': build a Rust staticlib on the host for the target's triple and stage it
// like any other prebuilt (lib/lib<name>.a + include/*), so the normal prebuilt-link machinery
// picks it up for every platform. The crate is local source; no download step (no buildExternal).
export default function buildCargo(target, libdir) {
    const triple = cargoTripleFor(target);
    if (!triple) {
        throw new Error(`cppjs: buildType 'cargo' does not support platform '${target.platform}/${target.arch}'.`);
    }
    const { paths, export: exp, general } = state.config;
    const crateDir = path.resolve(paths.project, exp.crate ?? 'crate');
    const libName = exp.libName?.[0] ?? general.name;

    const probe = spawnSync('cargo', ['--version'], { stdio: 'ignore' });
    if (probe.error) {
        throw new Error('cppjs: cargo not found on PATH - install Rust (https://rustup.rs) to build cargo packages.');
    }

    // Auto mode (the default): the user's crate is plain Rust and cpp.js generates a companion
    // bridge crate from its pub surface, then builds THAT (it bundles the user crate as a dep).
    // A crate that calls embind_rs::bindings! itself opts out and is built directly.
    const isManual = fs.readFileSync(`${crateDir}/src/lib.rs`, 'utf8').includes('bindings!');
    const buildDir = isManual
        ? crateDir
        : generateRustBridge({
            crateDir,
            vectors: exp.bindings?.vectors ?? [],
            dtsFile: `${paths.project}/dist/js/index.d.ts`,
            dtsMode: state.config.dts,
            keepName: libName,
            log: (m) => logger.info(m),
        }).bridgeDir;

    const t0 = performance.now();
    const build = spawnSync('cargo', [
        'build', '--release', '--target', triple, '--manifest-path', `${buildDir}/Cargo.toml`,
    ], { stdio: 'inherit' });
    if (build.status !== 0) {
        throw new Error(`cppjs: cargo build failed for ${triple} (is the target installed? rustup target add ${triple})`);
    }

    // Rust staticlib output is lib<crate>.a; stage it under the export libName the CMakeLists expects.
    const crateName = readCrateName(buildDir).replaceAll('-', '_');
    const built = `${buildDir}/target/${triple}/release/lib${crateName}.a`;
    if (!fs.existsSync(built)) {
        throw new Error(`cppjs: expected cargo output ${built} not found (is crate-type = ["staticlib"]?)`);
    }
    fs.mkdirSync(`${libdir}/lib`, { recursive: true });
    fs.copyFileSync(built, `${libdir}/lib/lib${libName}.a`);

    fs.mkdirSync(`${libdir}/include`, { recursive: true });
    (exp.headers ?? []).forEach((header) => {
        fs.copyFileSync(path.resolve(paths.project, header), `${libdir}/include/${path.basename(header)}`);
    });

    const ms = Math.round(performance.now() - t0);
    logger.doneStep(target, 'Source', `cargo ${ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`}, ${triple}`);
    return true;
}

function readCrateName(crateDir) {
    const toml = fs.readFileSync(`${crateDir}/Cargo.toml`, 'utf8');
    const name = toml.match(/^\s*name\s*=\s*"([^"]+)"/m)?.[1];
    if (!name) throw new Error(`cppjs: could not read [package] name from ${crateDir}/Cargo.toml`);
    return name.replaceAll('-', '_');
}

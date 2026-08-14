import { spawnSync } from 'node:child_process';

const MT_RUSTFLAGS = '-C target-feature=+atomics,+bulk-memory,+mutable-globals';

// mt (shared-memory) wasm needs every Rust object built with the atomics/bulk-memory features,
// std included - and rustup ships only a featureless std. The nightly-only -Zbuild-std rebuild
// below is the same recipe wasm-bindgen-rayon uses; probing first turns a cryptic wasm-ld error
// into an actionable install instruction. Shared by every cargo entry point (app-local super
// crate and cargo-type packages).
export function isMtWasm(target) {
    return target.platform === 'wasm' && target.runtime === 'mt';
}

export function assertMtRustToolchain() {
    const probe = spawnSync('rustup', ['component', 'list', '--toolchain', 'nightly', '--installed'], { encoding: 'utf8' });
    if (probe.status !== 0 || !String(probe.stdout ?? '').includes('rust-src')) {
        throw new Error(
            "cppjs: Rust on the wasm 'mt' runtime needs the Rust std rebuilt with "
            + 'atomics (nightly -Zbuild-std). Run `rustup toolchain install nightly '
            + "--component rust-src` and rebuild, or build with runtime 'st'.",
        );
    }
}

// st and mt share a cargo triple, so they must not share a target dir: cargo would happily
// serve featureless objects to a shared-memory link (or atomics objects to an st one).
export function cargoTargetDirFor(baseDir, target) {
    return `${baseDir}/${isMtWasm(target) ? 'target-mt' : 'target'}`;
}

export function cargoBuildInvocation({
    target, triple, targetDir, manifestPath,
}) {
    const isMt = isMtWasm(target);
    const args = [
        ...(isMt ? ['+nightly'] : []),
        'build', '--release', '--target', triple,
        ...(isMt ? ['-Zbuild-std=std,panic_abort'] : []),
        '--target-dir', targetDir, '--manifest-path', manifestPath,
    ];
    const env = isMt
        ? { ...process.env, RUSTFLAGS: [process.env.RUSTFLAGS, MT_RUSTFLAGS].filter(Boolean).join(' ') }
        : process.env;
    return { args, env, isMt };
}

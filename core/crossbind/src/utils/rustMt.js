import { spawnSync } from 'node:child_process';

// One argv per flag: runCargo joins these with cargo's 0x1F separator, so a flag must not
// contain a space of its own.
const MT_RUSTFLAGS = ['-Ctarget-feature=+atomics,+bulk-memory,+mutable-globals'];

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
            "crossbind: Rust on the wasm 'mt' runtime needs the Rust std rebuilt with "
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
    // Flags travel as data, not as an environment patch: cargo ignores RUSTFLAGS outright when
    // CARGO_ENCODED_RUSTFLAGS is set, so inheriting the caller's environment here used to let a
    // developer who has that variable exported silently link a featureless std into an mt module.
    // panic is the other half of the same contract - the std being linked is built with abort.
    return {
        args,
        rustflags: isMt ? MT_RUSTFLAGS : [],
        panic: target.platform === 'wasm' ? 'abort' : undefined,
        // Only the nightly build-std rebuild needs unstable flags; it goes away with the prebuilt
        // mt sysroot, and this opt-out goes with it.
        allowUnstable: isMt,
        isMt,
    };
}

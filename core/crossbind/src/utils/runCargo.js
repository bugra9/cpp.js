import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// Every cargo invocation crossbind makes goes through here.
//
// Cargo takes flags from three channels: the process environment, $CARGO_HOME/config.toml, and any
// .cargo/config.toml found by walking up from the CURRENT WORKING DIRECTORY. The last one is the
// dangerous leg - a file above the crate can hand rustc a different compiler, extra codegen flags
// or -Z unstable features, and cargo discovers it purely from cwd. So: rustflags are injected
// through the process environment (which wins over both config channels), and the config legs are
// closed by running from a neutral directory with a crossbind-owned CARGO_HOME.

// Cargo splits this variable on 0x1F, one argv per flag - never a space.
const RUSTFLAGS_SEPARATOR = String.fromCharCode(0x1f);

// The environment is rebuilt from nothing and only these survive, so a variable that can redirect
// the compiler - RUSTC_WRAPPER, CARGO_BUILD_RUSTC, CARGO_TARGET_<TRIPLE>_LINKER, RUSTFLAGS,
// RUSTUP_TOOLCHAIN, RUSTC_BOOTSTRAP - cannot reach cargo from the caller's environment.
const ALLOWED_ENV = [
    /^PATH$/, /^HOME$/, /^USER$/, /^LOGNAME$/, /^SHELL$/, /^TERM$/,
    /^TMPDIR$/, /^TEMP$/, /^TMP$/,
    /^LANG$/, /^LC_[A-Z_]+$/,
    /^RUSTUP_HOME$/,
    /^SSH_AUTH_SOCK$/, // git dependencies over ssh
    /^CARGO_NET_/, /^CARGO_REGISTRIES_/, // offline/vendored builds and private registries
    /^(HTTP|HTTPS|ALL|NO)_PROXY$/i,
    /^SYSTEMROOT$/i, /^WINDIR$/i, /^USERPROFILE$/i, /^PROGRAMDATA$/i, // windows cannot spawn without these
];

// Recent cargo applies config.toml only, but the extensionless name is still read by older
// versions - both are checked so a behaviour change between versions cannot open the gap.
const CONFIG_NAMES = ['config.toml', 'config'];

// Crossbind-owned and machine-wide: $CARGO_HOME/config.toml is one of the discovery legs, so the
// registry cache lives somewhere we can assert is clean instead of in the user's ~/.cargo.
export function cargoHome() {
    return path.join(os.homedir(), '.crossbind', 'cargo');
}

// Outside the project and outside $HOME, so the upward walk never reaches ~/.cargo or a config
// the project tree happens to carry.
export function neutralCwd() {
    return path.join(os.tmpdir(), 'crossbind-cargo');
}

export function assertCleanConfigChain(home, cwd) {
    for (const name of CONFIG_NAMES) {
        const file = path.join(home, name);
        if (fs.existsSync(file)) {
            throw new Error(`crossbind: unexpected cargo config at ${file} - crossbind owns this CARGO_HOME and never writes one. Remove it and build again.`);
        }
    }
    for (let dir = cwd; ; dir = path.dirname(dir)) {
        for (const name of CONFIG_NAMES) {
            const file = path.join(dir, '.cargo', name);
            if (fs.existsSync(file)) {
                throw new Error(`crossbind: ${file} would apply to this build - cargo discovers config by walking up from the working directory. crossbind builds from a neutral directory to avoid that; move the file or report this.`);
            }
        }
        if (path.dirname(dir) === dir) return;
    }
}

export default function runCargo(args, {
    cwd, rustflags = [], panic, capture = false, maxBuffer, allowUnstable = false,
} = {}) {
    const home = cargoHome();
    const workdir = cwd ?? neutralCwd();
    fs.mkdirSync(home, { recursive: true });
    fs.mkdirSync(workdir, { recursive: true });
    assertCleanConfigChain(home, workdir);

    const env = {};
    Object.entries(process.env).forEach(([key, value]) => {
        if (ALLOWED_ENV.some((allowed) => allowed.test(key))) env[key] = value;
    });
    env.CARGO_HOME = home;
    // Depth defence: -Z fails with E0554 instead of quietly enabling unstable behaviour. The
    // value -1 disables unstable features on EVERY channel, nightly included, so the one caller
    // that still needs -Zbuild-std has to opt out - and only until that path is deleted. Leaving
    // it unset is still safe: the caller's own RUSTC_BOOTSTRAP never survives the allowlist.
    if (!allowUnstable) env.RUSTC_BOOTSTRAP = '-1';
    if (rustflags.length) env.CARGO_ENCODED_RUSTFLAGS = rustflags.join(RUSTFLAGS_SEPARATOR);
    // The environment beats the crate's own [profile.release], so a hand-written crate cannot opt
    // out of the panic strategy the std it links against was built with.
    if (panic) env.CARGO_PROFILE_RELEASE_PANIC = panic;

    return spawnSync('cargo', args, {
        cwd: workdir,
        env,
        stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
        ...(capture ? { encoding: 'utf8' } : {}),
        ...(maxBuffer ? { maxBuffer } : {}),
    });
}

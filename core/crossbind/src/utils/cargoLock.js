import fs from 'node:fs';
import path from 'node:path';
import writeIfChanged from './writeIfChanged.js';

// The versions of every crate the app's Rust links, next to crossbind.config.js and committed like conan.lock, since
// the manifests cargo resolves are generated under the cache. Not Cargo.lock: a package whose crate sits at the
// project root already has one.
const lockOf = (projectDir) => path.join(projectDir, 'crossbind.cargo.lock');

// Before cargo resolves a generated manifest, so it keeps every version the project pins.
export function followCargoLock(projectDir, manifestDir) {
    const lock = lockOf(projectDir);
    if (fs.existsSync(lock)) writeIfChanged(path.join(manifestDir, 'Cargo.lock'), fs.readFileSync(lock, 'utf8'));
}

// After a build: what cargo resolved, a crate the lock did not list yet included.
export function recordCargoLock(projectDir, manifestDir) {
    writeIfChanged(lockOf(projectDir), fs.readFileSync(path.join(manifestDir, 'Cargo.lock'), 'utf8'));
}

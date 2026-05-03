#!/usr/bin/env node
/**
 * Verifies that every platform-specific package under cppjs-packages/ has a
 * `dist/` folder that contains the expected prebuilt libraries.
 *
 * For each `cppjs-package-<name>-<platform>` directory the script:
 *   1. Reads `cppjs.config.js` to determine the library name(s)
 *      (`export.libName`, falling back to `general.name`).
 *   2. Checks the expected prebuilt targets exist:
 *        wasm    → wasm-wasm32-mt-release, wasm-wasm32-st-release
 *        ios     → ios-iphoneos-mt-release, ios-iphonesimulator-mt-release
 *        android → android-arm64-v8a-mt-release, android-x86_64-mt-release
 *   3. Verifies each target contains:
 *        - lib/lib<libName>.<ext>   (.a for wasm/ios, .so for android)
 *        - include/  (non-empty)
 *   4. Verifies dist/prebuilt/CMakeLists.txt exists.
 *
 * Usage:
 *   node check-dist.js          # Print a report and exit non-zero on failure
 *   node check-dist.js --quiet  # Print only the summary line and failures
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PACKAGES_DIR = path.join(ROOT, 'cppjs-packages');

const QUIET = process.argv.includes('--quiet');

const PLATFORM_TARGETS = {
    wasm: ['wasm-wasm32-mt-release', 'wasm-wasm32-st-release'],
    ios: ['ios-iphoneos-mt-release', 'ios-iphonesimulator-mt-release'],
    android: ['android-arm64-v8a-mt-release', 'android-x86_64-mt-release'],
};

const PLATFORM_LIB_EXT = {
    wasm: '.a',
    ios: '.a',
    android: '.so',
};

function detectPlatform(pkgDirName) {
    if (pkgDirName.endsWith('-wasm')) return 'wasm';
    if (pkgDirName.endsWith('-ios')) return 'ios';
    if (pkgDirName.endsWith('-android')) return 'android';
    return null;
}

// Extracts `general.name` and `export.libName` from a cppjs.config.js file
// without executing it (avoids resolving workspace ESM imports).
function parseConfig(configPath) {
    const src = fs.readFileSync(configPath, 'utf8');

    const nameMatch = src.match(/general\s*:\s*\{[^}]*?name\s*:\s*['"]([^'"]+)['"]/s);
    const generalName = nameMatch ? nameMatch[1] : null;

    const exportBlockMatch = src.match(/export\s*:\s*\{([\s\S]*?)\n\s*\}/);
    let libNames = null;
    if (exportBlockMatch) {
        const arrMatch = exportBlockMatch[1].match(/libName\s*:\s*\[([\s\S]*?)\]/);
        if (arrMatch) {
            libNames = arrMatch[1]
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
                .map((s) => s.replace(/^['"]|['"]$/g, ''));
        }
    }

    // Each platform-specific package contains a single platform entry in
    // targetSpecs, so a global libType match is unambiguous here.
    const libTypeMatch = src.match(/libType\s*:\s*['"]([^'"]+)['"]/);
    const libType = libTypeMatch ? libTypeMatch[1] : null;

    return {
        name: generalName,
        libNames: libNames && libNames.length > 0 ? libNames : generalName ? [generalName] : [],
        libType,
    };
}

function findPlatformPackages() {
    const groups = fs
        .readdirSync(PACKAGES_DIR, { withFileTypes: true })
        .filter((e) => e.isDirectory() && e.name.startsWith('cppjs-package-'))
        .map((e) => path.join(PACKAGES_DIR, e.name));

    const out = [];
    for (const group of groups) {
        const subs = fs.readdirSync(group, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name.startsWith('cppjs-package-'));
        for (const sub of subs) {
            const platform = detectPlatform(sub.name);
            if (!platform) continue;
            out.push({
                name: sub.name,
                platform,
                dir: path.join(group, sub.name),
            });
        }
    }
    out.sort((a, b) => a.name.localeCompare(b.name));
    return out;
}

function checkPackage(pkg) {
    const issues = [];
    const distDir = path.join(pkg.dir, 'dist');
    const prebuiltDir = path.join(distDir, 'prebuilt');

    if (!fs.existsSync(distDir)) {
        issues.push('dist/ folder missing');
        return { issues, libNames: [] };
    }

    if (!fs.existsSync(prebuiltDir)) {
        issues.push('dist/prebuilt/ folder missing');
        return { issues, libNames: [] };
    }

    const configPath = path.join(pkg.dir, 'cppjs.config.js');
    if (!fs.existsSync(configPath)) {
        issues.push('cppjs.config.js missing');
        return { issues, libNames: [] };
    }

    const { libNames, libType } = parseConfig(configPath);
    if (libNames.length === 0) {
        issues.push('could not parse libName from cppjs.config.js');
        return { issues, libNames };
    }

    if (!fs.existsSync(path.join(prebuiltDir, 'CMakeLists.txt'))) {
        issues.push('dist/prebuilt/CMakeLists.txt missing');
    }

    const targets = PLATFORM_TARGETS[pkg.platform];
    const ext = libType === 'static' ? '.a' : PLATFORM_LIB_EXT[pkg.platform];

    for (const target of targets) {
        const targetDir = path.join(prebuiltDir, target);
        if (!fs.existsSync(targetDir)) {
            issues.push(`target ${target}/ missing`);
            continue;
        }

        const includeDir = path.join(targetDir, 'include');
        if (!fs.existsSync(includeDir) || fs.readdirSync(includeDir).length === 0) {
            issues.push(`${target}/include/ missing or empty`);
        }

        const libDir = path.join(targetDir, 'lib');
        if (!fs.existsSync(libDir)) {
            issues.push(`${target}/lib/ missing`);
            continue;
        }

        for (const libName of libNames) {
            const libFile = path.join(libDir, `lib${libName}${ext}`);
            if (!fs.existsSync(libFile)) {
                issues.push(`${target}/lib/lib${libName}${ext} missing`);
            }
        }
    }

    return { issues, libNames };
}

function main() {
    const packages = findPlatformPackages();
    const results = packages.map((pkg) => ({ pkg, ...checkPackage(pkg) }));

    const ok = results.filter((r) => r.issues.length === 0);
    const failed = results.filter((r) => r.issues.length > 0);

    const ordered = QUIET ? failed : [...ok, ...failed];

    for (const r of ordered) {
        const status = r.issues.length === 0 ? 'OK' : 'FAIL';
        const libs = r.libNames.length > 0 ? ` [${r.libNames.join(', ')}]` : '';
        console.log(`${status.padEnd(4)} ${r.pkg.name}${libs}`);
        for (const issue of r.issues) {
            console.log(`     - ${issue}`);
        }
    }
    if (!QUIET) console.log('');

    console.log(`Summary: ${ok.length}/${results.length} packages OK, ${failed.length} failed.`);

    process.exit(failed.length > 0 ? 1 : 0);
}

main();

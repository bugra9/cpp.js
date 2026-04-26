#!/usr/bin/env node
/**
 * Scans every package.json under cppjs-packages/ for the `nativeVersion` field,
 * resolves the latest upstream version of each native library, and writes a
 * report file comparing the two.
 *
 * Usage:
 *   node check-native-versions.js            # Write native-versions.md
 *   node check-native-versions.js --check    # Also exit non-zero if any
 *                                            # package is outdated (exit 1)
 *                                            # or could not be checked (exit 2)
 *   node check-native-versions.js --update   # Rewrite `nativeVersion` in every
 *                                            # outdated package.json to the
 *                                            # latest upstream version
 *
 * Set GITHUB_TOKEN in the environment to avoid GitHub API rate limits.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PACKAGES_DIR = path.join(ROOT, 'cppjs-packages');
const REPORT_PATH = path.join(ROOT, 'native-versions.md');

const BASE_HEADERS = {
    'User-Agent': 'cppjs-native-version-check',
};

// GitHub-only headers. MUST NOT be sent to any other host: GitLab (and other
// APIs) will reject a GitHub-shaped Authorization header with HTTP 401.
const GH_HEADERS = {
    ...BASE_HEADERS,
    Accept: 'application/vnd.github+json',
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
};

// ---------------------------------------------------------------------------
// Version comparison (zero-dep, semver-lite).
// Returns 1 if a > b, -1 if a < b, 0 if equal.
// Treats a non-prerelease as newer than any prerelease sharing the same core.
// ---------------------------------------------------------------------------
function splitVersion(v) {
    const [mainStr, ...preParts] = String(v).split('-');
    const main = mainStr.split('.').map((x) => {
        const n = parseInt(x, 10);
        return Number.isNaN(n) ? x : n;
    });
    return { main, pre: preParts.join('-') || null };
}

function compareVersions(a, b) {
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    const pa = splitVersion(a);
    const pb = splitVersion(b);
    const len = Math.max(pa.main.length, pb.main.length);
    for (let i = 0; i < len; i++) {
        const av = pa.main[i] ?? 0;
        const bv = pb.main[i] ?? 0;
        if (av === bv) continue;
        if (typeof av === 'number' && typeof bv === 'number') return av > bv ? 1 : -1;
        return String(av) > String(bv) ? 1 : -1;
    }
    if (!pa.pre && pb.pre) return 1;
    if (pa.pre && !pb.pre) return -1;
    if (!pa.pre && !pb.pre) return 0;
    return pa.pre.localeCompare(pb.pre);
}

// ---------------------------------------------------------------------------
// Network helpers
// ---------------------------------------------------------------------------
async function fetchJson(url) {
    const isGitHub = url.startsWith('https://api.github.com/');
    const res = await fetch(url, { headers: isGitHub ? GH_HEADERS : BASE_HEADERS });
    if (!res.ok) {
        if (res.status === 403 && isGitHub && !process.env.GITHUB_TOKEN) {
            throw new Error('GitHub API rate limit hit (HTTP 403). Export GITHUB_TOKEN (e.g. `export GITHUB_TOKEN=$(gh auth token)`) and retry.');
        }
        throw new Error(`GET ${url} -> HTTP ${res.status}`);
    }
    return res.json();
}

async function fetchText(url) {
    const res = await fetch(url, { headers: BASE_HEADERS });
    if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
    return res.text();
}

// Given a stream of candidate version strings, return
// { stable, any } where `any` is the highest version overall and
// `stable` is the highest version without a prerelease suffix. A prerelease
// is detected by the presence of a "-" in the normalized version string
// (e.g. "4.0.0-alpha1").
function pickMaxVersions(candidates) {
    let maxStable = null;
    let maxAny = null;
    for (const v of candidates) {
        if (!v) continue;
        if (!maxAny || compareVersions(v, maxAny) > 0) maxAny = v;
        if (!v.includes('-')) {
            if (!maxStable || compareVersions(v, maxStable) > 0) maxStable = v;
        }
    }
    return { stable: maxStable, any: maxAny };
}

// Pick both the highest stable tag and the highest tag overall from a GitHub
// repo. `filter` is applied against the raw tag name; `normalize` converts it
// into a plain version string. To include prereleases in `any`, the filter
// must accept those tag names too.
//
// Walks at most TAG_PAGES pages (per_page=100 each). Tags on GitHub come
// back in roughly reverse-chronological order, so 200 tags is plenty to find
// the newest version without paging through history.
const TAG_PAGES = 2;
const TAG_PAGE_SIZE = 100;

async function ghMaxTag(repo, normalize, filter) {
    const versions = [];
    for (let page = 1; page <= TAG_PAGES; page++) {
        const tags = await fetchJson(
            `https://api.github.com/repos/${repo}/tags?per_page=${TAG_PAGE_SIZE}&page=${page}`,
        );
        if (!Array.isArray(tags) || tags.length === 0) break;
        for (const t of tags) {
            if (filter && !filter(t.name)) continue;
            const v = normalize(t.name);
            if (v) versions.push(v);
        }
        if (tags.length < TAG_PAGE_SIZE) break;
    }
    return pickMaxVersions(versions);
}

// Parse an Apache-style HTML directory listing and return both the highest
// stable version and the highest version overall whose filename matches the
// provided regex (must have one capture group for the version).
async function scrapeLatestFromDir(url, regex) {
    const html = await fetchText(url);
    const versions = [];
    for (const match of html.matchAll(regex)) versions.push(match[1]);
    return pickMaxVersions(versions);
}

// ---------------------------------------------------------------------------
// Library sources. Key is the short library name derived from the package
// directory (e.g. "cppjs-package-curl-wasm" -> "curl").
// ---------------------------------------------------------------------------
const LIBRARIES = {
    curl: {
        homepage: 'https://github.com/curl/curl',
        fetchLatest: () => ghMaxTag(
            'curl/curl',
            (t) => t.replace(/^curl-/, '').replaceAll('_', '.'),
            (t) => /^curl-\d+_\d+_\d+$/.test(t),
        ),
    },
    expat: {
        homepage: 'https://github.com/libexpat/libexpat',
        fetchLatest: () => ghMaxTag(
            'libexpat/libexpat',
            (t) => t.replace(/^R_/, '').replaceAll('_', '.'),
            (t) => /^R_\d+_\d+_\d+$/.test(t),
        ),
    },
    gdal: {
        homepage: 'https://github.com/OSGeo/gdal',
        fetchLatest: () => ghMaxTag(
            'OSGeo/gdal',
            (t) => t.replace(/^v/, ''),
            (t) => /^v\d+\.\d+\.\d+$/.test(t),
        ),
    },
    geos: {
        homepage: 'https://github.com/libgeos/geos',
        fetchLatest: () => ghMaxTag(
            'libgeos/geos',
            (t) => t,
            (t) => /^\d+\.\d+\.\d+$/.test(t),
        ),
    },
    geotiff: {
        homepage: 'https://github.com/OSGeo/libgeotiff',
        fetchLatest: () => ghMaxTag(
            'OSGeo/libgeotiff',
            (t) => t,
            (t) => /^\d+\.\d+\.\d+$/.test(t),
        ),
    },
    iconv: {
        homepage: 'https://www.gnu.org/software/libiconv/',
        fetchLatest: () => scrapeLatestFromDir(
            'https://ftp.gnu.org/pub/gnu/libiconv/',
            /libiconv-(\d+(?:\.\d+)+)\.tar\.gz/g,
        ),
    },
    openssl: {
        // OpenSSL tags are "openssl-3.6.2" (stable) or "openssl-4.0.0-alpha1"
        // (prerelease). Both shapes are captured; callers decide which one to
        // compare against based on the package's own nativeVersion.
        homepage: 'https://github.com/openssl/openssl',
        fetchLatest: () => ghMaxTag(
            'openssl/openssl',
            (t) => t.replace(/^openssl-/, ''),
            (t) => /^openssl-\d+\.\d+\.\d+(?:-[A-Za-z0-9.]+)?$/.test(t),
        ),
    },
    proj: {
        homepage: 'https://github.com/OSGeo/PROJ',
        fetchLatest: () => ghMaxTag(
            'OSGeo/PROJ',
            (t) => t,
            (t) => /^\d+\.\d+\.\d+$/.test(t),
        ),
    },
    spatialite: {
        homepage: 'https://www.gaia-gis.it/fossil/libspatialite/',
        fetchLatest: () => scrapeLatestFromDir(
            'https://www.gaia-gis.it/gaia-sins/libspatialite-sources/',
            /libspatialite-(\d+(?:\.\d+)+)\.tar\.gz/g,
        ),
    },
    sqlite3: {
        homepage: 'https://github.com/sqlite/sqlite',
        fetchLatest: () => ghMaxTag(
            'sqlite/sqlite',
            (t) => t.replace(/^version-/, ''),
            (t) => /^version-\d+\.\d+\.\d+$/.test(t),
        ),
    },
    tiff: {
        homepage: 'https://gitlab.com/libtiff/libtiff',
        fetchLatest: async () => {
            const versions = [];
            for (let page = 1; page <= TAG_PAGES; page++) {
                const tags = await fetchJson(
                    `https://gitlab.com/api/v4/projects/libtiff%2Flibtiff/repository/tags?per_page=${TAG_PAGE_SIZE}&page=${page}`,
                );
                if (!Array.isArray(tags) || tags.length === 0) break;
                for (const t of tags) {
                    const clean = t.name.replace(/^v/, '');
                    if (!/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.]+)?$/.test(clean)) continue;
                    versions.push(clean);
                }
                if (tags.length < TAG_PAGE_SIZE) break;
            }
            return pickMaxVersions(versions);
        },
    },
    webp: {
        homepage: 'https://github.com/webmproject/libwebp',
        fetchLatest: () => ghMaxTag(
            'webmproject/libwebp',
            (t) => t.replace(/^v/, ''),
            (t) => /^v\d+\.\d+\.\d+$/.test(t),
        ),
    },
    zlib: {
        homepage: 'https://github.com/madler/zlib',
        fetchLatest: () => ghMaxTag(
            'madler/zlib',
            (t) => t.replace(/^v/, ''),
            (t) => /^v\d+\.\d+\.\d+$/.test(t),
        ),
    },
};

// ---------------------------------------------------------------------------
// Filesystem walk
// ---------------------------------------------------------------------------
function walkPackageJsons(dir) {
    const out = [];
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
        return out;
    }
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            out.push(...walkPackageJsons(full));
        } else if (entry.name === 'package.json') {
            out.push(full);
        }
    }
    return out;
}

function deriveLibraryKey(pkgPath) {
    // .../cppjs-packages/cppjs-package-X/cppjs-package-X[-platform]/package.json
    const parent = path.basename(path.dirname(pkgPath));
    return parent.replace(/^cppjs-package-/, '').replace(/-(wasm|ios|android)$/, '');
}

// Rewrite the `"nativeVersion": "X"` line in-place, preserving all other
// formatting (indentation, key order, trailing newline).
function rewriteNativeVersion(pkgPath, newVersion) {
    const original = fs.readFileSync(pkgPath, 'utf8');
    const re = /("nativeVersion"\s*:\s*")([^"]*)(")/;
    if (!re.test(original)) {
        throw new Error(`nativeVersion field not found in ${pkgPath}`);
    }
    const updated = original.replace(re, (_, pre, _old, post) => `${pre}${newVersion}${post}`);
    if (updated === original) return false;
    fs.writeFileSync(pkgPath, updated);
    return true;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
    const args = process.argv.slice(2);
    const checkMode = args.includes('--check') || args.includes('--ci');
    const updateMode = args.includes('--update');

    const pkgPaths = walkPackageJsons(PACKAGES_DIR);
    const packages = [];
    for (const p of pkgPaths) {
        try {
            const json = JSON.parse(fs.readFileSync(p, 'utf8'));
            if (!json.nativeVersion) continue;
            packages.push({
                name: json.name,
                nativeVersion: json.nativeVersion,
                library: deriveLibraryKey(p),
                absPath: p,
                relativePath: path.relative(ROOT, p),
            });
        } catch (e) {
            console.error(`Failed to parse ${p}: ${e.message}`);
        }
    }

    const libraryKeys = [...new Set(packages.map((p) => p.library))].sort();
    console.error(`Found ${packages.length} package(s) across ${libraryKeys.length} libraries. Resolving latest upstream versions...`);

    const latestByLibrary = {};
    await Promise.all(libraryKeys.map(async (key) => {
        const src = LIBRARIES[key];
        if (!src) {
            latestByLibrary[key] = { stable: null, any: null, error: `No upstream source mapped for '${key}'`, homepage: null };
            return;
        }
        try {
            const { stable, any } = await src.fetchLatest();
            if (!stable && !any) throw new Error('No matching tag/version found');
            latestByLibrary[key] = { stable, any, error: null, homepage: src.homepage };
            if (stable && any && stable !== any) {
                console.error(`  ${key}: ${stable} (stable) / ${any} (incl. prerelease)`);
            } else {
                console.error(`  ${key}: ${stable || any}`);
            }
        } catch (e) {
            latestByLibrary[key] = { stable: null, any: null, error: e.message, homepage: src.homepage };
            console.error(`  ${key}: FAILED (${e.message})`);
        }
    }));

    const rows = packages.map((pkg) => {
        const info = latestByLibrary[pkg.library] || {};
        const isPrerelease = String(pkg.nativeVersion).includes('-');
        // Prerelease packages compare against the highest version overall
        // (which may itself be a prerelease). Stable packages compare against
        // the highest stable release only, so we never suggest downgrading to
        // or "upgrading" onto a prerelease.
        const latest = isPrerelease
            ? (info.any ?? info.stable ?? null)
            : (info.stable ?? info.any ?? null);
        let status;
        if (info.error || !latest) {
            status = 'unknown';
        } else {
            status = compareVersions(pkg.nativeVersion, latest) >= 0 ? 'up-to-date' : 'outdated';
        }
        return {
            package: pkg.name,
            library: pkg.library,
            nativeVersion: pkg.nativeVersion,
            latestVersion: latest || null,
            latestChannel: isPrerelease ? 'prerelease' : 'stable',
            status,
            error: info.error || null,
            homepage: info.homepage || null,
            absPath: pkg.absPath,
            path: pkg.relativePath,
        };
    });

    rows.sort((a, b) => a.package.localeCompare(b.package));

    if (updateMode) {
        const toUpdate = rows.filter((r) => r.status === 'outdated');
        if (toUpdate.length === 0) {
            console.error('\nNothing to update — no outdated packages.');
        } else {
            console.error(`\nUpdating nativeVersion in ${toUpdate.length} package.json file(s)...`);
            for (const r of toUpdate) {
                try {
                    rewriteNativeVersion(r.absPath, r.latestVersion);
                    console.error(`  ${r.package}: ${r.nativeVersion} -> ${r.latestVersion}`);
                    r.previousNativeVersion = r.nativeVersion;
                    r.nativeVersion = r.latestVersion;
                    r.status = 'updated';
                } catch (e) {
                    console.error(`  ${r.package}: update failed (${e.message})`);
                    r.updateError = e.message;
                }
            }
        }
    }

    const outdated = rows.filter((r) => r.status === 'outdated');
    const upToDate = rows.filter((r) => r.status === 'up-to-date');
    const unknown = rows.filter((r) => r.status === 'unknown');
    const updated = rows.filter((r) => r.status === 'updated');

    const renderTable = (list) => {
        let s = '| Package | Library | nativeVersion | Latest | Status |\n';
        s += '|---|---|---|---|---|\n';
        for (const r of list) {
            const libCell = r.homepage ? `[${r.library}](${r.homepage})` : r.library;
            let statusCell;
            if (r.status === 'updated') statusCell = `updated (was ${r.previousNativeVersion})`;
            else if (r.status === 'up-to-date') statusCell = 'up-to-date';
            else if (r.status === 'outdated') statusCell = 'outdated';
            else statusCell = 'unknown';
            const latestCell = r.latestVersion
                ? (r.latestChannel === 'prerelease' ? `${r.latestVersion} (incl. prerelease)` : r.latestVersion)
                : '—';
            s += `| ${r.package} | ${libCell} | ${r.nativeVersion} | ${latestCell} | ${statusCell} |\n`;
        }
        return s;
    };

    let md = '# Native Library Versions\n\n';
    md += `Generated on: ${new Date().toISOString()}\n\n`;
    md += `- Total packages: ${rows.length}\n`;
    md += `- Up to date: ${upToDate.length}\n`;
    md += `- Outdated: ${outdated.length}\n`;
    if (updated.length > 0) md += `- Updated: ${updated.length}\n`;
    md += `- Unknown: ${unknown.length}\n\n`;

    if (updated.length > 0) {
        md += `## Updated (${updated.length})\n\n`;
        md += renderTable(updated);
        md += '\n';
    }
    if (outdated.length > 0) {
        md += `## Outdated (${outdated.length})\n\n`;
        md += renderTable(outdated);
        md += '\n';
    }
    if (unknown.length > 0) {
        md += `## Unknown (${unknown.length})\n\n`;
        md += renderTable(unknown);
        md += '\n';
        for (const r of unknown) {
            if (r.error) md += `- ${r.package}: ${r.error}\n`;
        }
        md += '\n';
    }
    md += `## Up to date (${upToDate.length})\n\n`;
    md += renderTable(upToDate);
    md += '\n';

    fs.writeFileSync(REPORT_PATH, md);
    console.error(`\nReport written to ${path.relative(ROOT, REPORT_PATH)}`);
    console.error(`Summary: ${upToDate.length} up-to-date, ${outdated.length} outdated, ${unknown.length} unknown${updated.length ? `, ${updated.length} updated` : ''}`);

    if (checkMode) {
        if (outdated.length > 0) {
            console.error(`\n${outdated.length} package(s) are outdated:`);
            for (const r of outdated) {
                console.error(`  - ${r.package}: ${r.nativeVersion} -> ${r.latestVersion}`);
            }
            process.exit(1);
        }
        if (unknown.length > 0) {
            console.error(`\n${unknown.length} package(s) could not be checked:`);
            for (const r of unknown) {
                console.error(`  - ${r.package}: ${r.error || 'no latest version resolved'}`);
            }
            process.exit(2);
        }
        console.error('\nAll packages are up to date.');
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

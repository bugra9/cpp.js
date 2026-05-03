#!/usr/bin/env node
/**
 * Scans every package.json under the workspace for external (non-workspace)
 * npm dependencies, resolves the latest version of each from the npm
 * registry, and writes a report file comparing the two.
 *
 * Usage:
 *   node check-external-dependencies.js            # Write external-dependencies.md
 *   node check-external-dependencies.js --check    # Also exit non-zero if any
 *                                                  # dependency is outdated (1)
 *                                                  # or could not be resolved (2)
 *   node check-external-dependencies.js --update   # Rewrite outdated dependency
 *                                                  # ranges in every package.json
 *                                                  # to the latest version
 *                                                  # (preserves the original
 *                                                  # range prefix: ^, ~, or none)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = (() => {
    const i = process.argv.indexOf('--report');
    return i !== -1 ? process.argv[i + 1] : null;
})();

function pad(s, n) {
    return String(s).padEnd(n);
}
function printTable(headers, rows, stream = process.stdout) {
    if (rows.length === 0) return;
    const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i] ?? '').length)));
    const fmt = (cells) => cells.map((c, i) => pad(c, widths[i])).join('  ');
    stream.write(`${fmt(headers)}\n`);
    stream.write(`${widths.map((w) => '-'.repeat(w)).join('  ')}\n`);
    rows.forEach((r) => stream.write(`${fmt(r)}\n`));
}

// Roots that contain workspace packages (mirrors pnpm-workspace.yaml).
const SCAN_ROOTS = [
    'cppjs-core',
    'cppjs-plugins',
    'cppjs-samples',
    'cppjs-packages',
    'cppjs-extensions',
    'website',
    '.', // top-level package.json
];

const SKIP_DIRS = new Set(['node_modules', '.cppjs', 'dist', '.git', 'test-results', 'playwright-report']);

const REGISTRY = 'https://registry.npmjs.org';

const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

// ---------------------------------------------------------------------------
// Version comparison (zero-dep, semver-lite). Returns 1 if a > b, -1 if a < b,
// 0 if equal. Treats a non-prerelease as newer than any prerelease sharing the
// same core.
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

// Strip leading range operators (^, ~, >=, >, =, v) and any whitespace, then
// return the bare version string. Returns null for non-resolvable specs
// (workspace:, link:, file:, git+, http(s):, *, x, latest, etc.).
function parseRange(spec) {
    if (typeof spec !== 'string') return { prefix: '', version: null, raw: spec, resolvable: false };
    const trimmed = spec.trim();
    if (!trimmed) return { prefix: '', version: null, raw: spec, resolvable: false };

    if (
        trimmed.startsWith('workspace:') ||
        trimmed.startsWith('link:') ||
        trimmed.startsWith('file:') ||
        trimmed.startsWith('portal:') ||
        trimmed.startsWith('git+') ||
        trimmed.startsWith('git:') ||
        trimmed.startsWith('github:') ||
        trimmed.startsWith('http:') ||
        trimmed.startsWith('https:') ||
        trimmed.startsWith('npm:')
    ) {
        return { prefix: '', version: null, raw: spec, resolvable: false };
    }

    if (trimmed === '*' || trimmed === 'x' || trimmed.toLowerCase() === 'latest') {
        return { prefix: '', version: null, raw: spec, resolvable: false };
    }

    // Capture the leading prefix so we can preserve it when rewriting. We only
    // recognize the simple ones — anything more complex (ranges with spaces,
    // ||, etc.) is reported but not auto-updated.
    const m = /^([\^~]|>=|<=|>|<|=)?\s*v?(\d[^\s|<>=]*)$/.exec(trimmed);
    if (!m) return { prefix: '', version: null, raw: spec, resolvable: false };

    const prefix = m[1] || '';
    const version = m[2];
    return { prefix, version, raw: spec, resolvable: true };
}

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
        if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            out.push(...walkPackageJsons(full));
        } else if (entry.name === 'package.json') {
            out.push(full);
        }
    }
    return out;
}

function collectPackageJsons() {
    const seen = new Set();
    const out = [];
    for (const r of SCAN_ROOTS) {
        const abs = path.resolve(ROOT, r);
        if (r === '.') {
            const top = path.join(abs, 'package.json');
            if (fs.existsSync(top) && !seen.has(top)) {
                seen.add(top);
                out.push(top);
            }
            continue;
        }
        for (const p of walkPackageJsons(abs)) {
            if (!seen.has(p)) {
                seen.add(p);
                out.push(p);
            }
        }
    }
    return out;
}

// ---------------------------------------------------------------------------
// Network
// ---------------------------------------------------------------------------
async function fetchLatestVersion(name) {
    const url = `${REGISTRY}/${encodeURIComponent(name)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
    const json = await res.json();
    const distTags = json['dist-tags'] || {};
    const latest = distTags.latest;
    if (!latest) throw new Error('No dist-tags.latest');
    return latest;
}

// ---------------------------------------------------------------------------
// Rewrite a single dependency entry in a package.json file. Uses an anchored
// regex on the JSON text so other formatting is preserved.
// ---------------------------------------------------------------------------
function rewriteDependency(pkgPath, depName, newSpec) {
    const original = fs.readFileSync(pkgPath, 'utf8');
    const escaped = depName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`("${escaped}"\\s*:\\s*")([^"]*)(")`, 'g');
    let replaced = false;
    const updated = original.replace(re, (match, pre, _old, post) => {
        replaced = true;
        return `${pre}${newSpec}${post}`;
    });
    if (!replaced) throw new Error(`dependency '${depName}' not found in ${pkgPath}`);
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

    const pkgPaths = collectPackageJsons();

    // First pass: discover workspace package names so we can exclude them
    // even when they're declared without the "workspace:" specifier.
    const workspaceNames = new Set();
    const parsed = [];
    for (const p of pkgPaths) {
        try {
            const json = JSON.parse(fs.readFileSync(p, 'utf8'));
            if (json.name) workspaceNames.add(json.name);
            parsed.push({ path: p, json });
        } catch (e) {
            console.error(`Failed to parse ${p}: ${e.message}`);
        }
    }

    // Aggregate dependency usage:
    //   depsByName[name] = {
    //     usages: [{ field, spec, parsed, pkgPath, pkgName }],
    //   }
    const depsByName = new Map();
    for (const { path: pkgPath, json } of parsed) {
        for (const field of DEP_FIELDS) {
            const block = json[field];
            if (!block || typeof block !== 'object') continue;
            for (const [name, spec] of Object.entries(block)) {
                if (workspaceNames.has(name)) continue;
                const parsedRange = parseRange(spec);
                // Skip non-version specs (workspace:, file:, git, etc.).
                if (
                    !parsedRange.resolvable &&
                    typeof spec === 'string' &&
                    (spec.startsWith('workspace:') || spec.startsWith('link:') || spec.startsWith('file:') || spec.startsWith('portal:'))
                )
                    continue;
                if (!depsByName.has(name)) depsByName.set(name, { usages: [] });
                depsByName.get(name).usages.push({
                    field,
                    spec,
                    parsed: parsedRange,
                    pkgPath,
                    pkgName: json.name || path.relative(ROOT, pkgPath),
                });
            }
        }
    }

    const sortedNames = [...depsByName.keys()].sort();
    console.error(`Found ${parsed.length} workspace package.json file(s).`);
    console.error(`Found ${sortedNames.length} unique external dependency name(s). Querying npm registry...`);

    // Fetch latest versions in parallel, but cap concurrency to be polite.
    const CONCURRENCY = 16;
    const latestByName = new Map();
    let cursor = 0;
    async function worker() {
        while (true) {
            const i = cursor++;
            if (i >= sortedNames.length) return;
            const name = sortedNames[i];
            try {
                const v = await fetchLatestVersion(name);
                latestByName.set(name, { latest: v, error: null });
                process.stderr.write('.');
            } catch (e) {
                latestByName.set(name, { latest: null, error: e.message });
                process.stderr.write('x');
            }
        }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    process.stderr.write('\n');

    // Build per-dependency rows.
    const rows = sortedNames.map((name) => {
        const { usages } = depsByName.get(name);
        const { latest, error } = latestByName.get(name) || {};
        const uniqueRanges = [...new Set(usages.map((u) => u.spec))].sort();
        // A dep is "outdated" if the highest in-use version is older than the
        // latest npm version. Unresolvable specs ('*', git, etc.) yield
        // status 'unknown'.
        let highestInUse = null;
        let hasUnresolvable = false;
        for (const u of usages) {
            if (!u.parsed.resolvable || !u.parsed.version) {
                hasUnresolvable = true;
                continue;
            }
            if (!highestInUse || compareVersions(u.parsed.version, highestInUse) > 0) {
                highestInUse = u.parsed.version;
            }
        }
        let status;
        if (error || !latest) status = 'unknown';
        else if (!highestInUse) status = hasUnresolvable ? 'unknown' : 'unknown';
        else status = compareVersions(highestInUse, latest) >= 0 ? 'up-to-date' : 'outdated';
        return {
            name,
            usages,
            uniqueRanges,
            highestInUse,
            latest: latest || null,
            status,
            error: error || null,
        };
    });

    // Apply --update: rewrite each outdated usage to the latest version,
    // preserving the original prefix (^, ~, or none).
    if (updateMode) {
        const outdated = rows.filter((r) => r.status === 'outdated');
        if (outdated.length === 0) {
            console.error('\nNothing to update — no outdated dependencies.');
        } else {
            console.error(`\nUpdating ${outdated.length} dependency name(s) across package.json files...`);
            for (const row of outdated) {
                let updatesForThisDep = 0;
                for (const u of row.usages) {
                    if (!u.parsed.resolvable || !u.parsed.version) continue;
                    if (compareVersions(u.parsed.version, row.latest) >= 0) continue;
                    const newSpec = `${u.parsed.prefix}${row.latest}`;
                    try {
                        rewriteDependency(u.pkgPath, row.name, newSpec);
                        u.previousSpec = u.spec;
                        u.spec = newSpec;
                        updatesForThisDep++;
                    } catch (e) {
                        u.updateError = e.message;
                        console.error(`  ${row.name} in ${path.relative(ROOT, u.pkgPath)}: FAILED (${e.message})`);
                    }
                }
                if (updatesForThisDep > 0) {
                    console.error(`  ${row.name}: ${row.highestInUse} -> ${row.latest} (${updatesForThisDep} file(s))`);
                    row.previousHighestInUse = row.highestInUse;
                    row.highestInUse = row.latest;
                    row.uniqueRanges = [...new Set(row.usages.map((u) => u.spec))].sort();
                    row.status = 'updated';
                }
            }
        }
    }

    const outdated = rows.filter((r) => r.status === 'outdated');
    const upToDate = rows.filter((r) => r.status === 'up-to-date');
    const unknown = rows.filter((r) => r.status === 'unknown');
    const updated = rows.filter((r) => r.status === 'updated');

    // ---------------------------------------------------------------------
    // Markdown rendering
    // ---------------------------------------------------------------------
    const escapePipe = (s) => String(s).replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
    const renderTable = (list) => {
        let s = '| Dependency | Ranges in use | Latest | Used by | Status |\n';
        s += '|---|---|---|---|---|\n';
        for (const r of list) {
            const ranges = r.uniqueRanges.length ? r.uniqueRanges.map(escapePipe).join(', ') : '—';
            const latest = r.latest || '—';
            const usedBy = r.usages.length;
            let statusCell;
            if (r.status === 'updated') statusCell = `updated (was ${r.previousHighestInUse})`;
            else if (r.status === 'unknown' && r.error) statusCell = `unknown (${escapePipe(r.error)})`;
            else statusCell = r.status;
            s += `| [${r.name}](https://www.npmjs.com/package/${r.name}) | ${ranges} | ${latest} | ${usedBy} | ${statusCell} |\n`;
        }
        return s;
    };

    const toRow = (r) => {
        const ranges = r.uniqueRanges.length ? r.uniqueRanges.join(', ') : '—';
        const latest = r.latest || '—';
        let statusCell;
        if (r.status === 'updated') statusCell = `updated (was ${r.previousHighestInUse})`;
        else if (r.status === 'unknown' && r.error) statusCell = `unknown (${r.error})`;
        else statusCell = r.status;
        return [r.name, ranges, latest, String(r.usages.length), statusCell];
    };
    const cols = ['Dependency', 'Ranges in use', 'Latest', 'Used by', 'Status'];

    process.stdout.write('\n');
    if (updated.length > 0) {
        process.stdout.write(`Updated (${updated.length})\n`);
        printTable(cols, updated.map(toRow));
        process.stdout.write('\n');
    }
    if (outdated.length > 0) {
        process.stdout.write(`Outdated (${outdated.length})\n`);
        printTable(cols, outdated.map(toRow));
        process.stdout.write('\nOutdated — per-file detail\n');
        const detailRows = [];
        for (const r of outdated) {
            for (const u of r.usages) {
                if (!u.parsed.resolvable || !u.parsed.version) continue;
                if (compareVersions(u.parsed.version, r.latest) >= 0) continue;
                detailRows.push([r.name, u.pkgName, u.field, u.spec, r.latest]);
            }
        }
        printTable(['Dependency', 'Package', 'Field', 'Current', 'Latest'], detailRows);
        process.stdout.write('\n');
    }
    if (unknown.length > 0) {
        process.stdout.write(`Unknown (${unknown.length})\n`);
        printTable(cols, unknown.map(toRow));
        process.stdout.write('\n');
    }
    process.stdout.write(`Up to date (${upToDate.length})\n`);
    printTable(cols, upToDate.map(toRow));

    if (REPORT_PATH) {
        let md = '# External Dependencies\n\n';
        md += `Generated on: ${new Date().toISOString()}\n\n`;
        md += `- Total unique dependencies: ${rows.length}\n`;
        md += `- Up to date: ${upToDate.length}\n`;
        md += `- Outdated: ${outdated.length}\n`;
        if (updated.length > 0) md += `- Updated: ${updated.length}\n`;
        md += `- Unknown: ${unknown.length}\n\n`;
        if (updated.length > 0) {
            md += `## Updated (${updated.length})\n\n` + renderTable(updated) + '\n';
        }
        if (outdated.length > 0) {
            md += `## Outdated (${outdated.length})\n\n` + renderTable(outdated);
            md += '\n### Outdated — per-file detail\n\n';
            md += '| Dependency | Package | Field | Current | Latest |\n|---|---|---|---|---|\n';
            for (const r of outdated) {
                for (const u of r.usages) {
                    if (!u.parsed.resolvable || !u.parsed.version) continue;
                    if (compareVersions(u.parsed.version, r.latest) >= 0) continue;
                    md += `| ${r.name} | ${u.pkgName} | ${u.field} | ${escapePipe(u.spec)} | ${r.latest} |\n`;
                }
            }
            md += '\n';
        }
        if (unknown.length > 0) {
            md += `## Unknown (${unknown.length})\n\n` + renderTable(unknown) + '\n';
        }
        md += `## Up to date (${upToDate.length})\n\n` + renderTable(upToDate) + '\n';
        fs.writeFileSync(REPORT_PATH, md);
        process.stderr.write(`\nReport written to ${REPORT_PATH}\n`);
    }
    process.stderr.write(
        `\nSummary: ${upToDate.length} up-to-date, ${outdated.length} outdated, ${unknown.length} unknown` +
            (updated.length ? `, ${updated.length} updated` : '') +
            '\n',
    );

    if (checkMode) {
        if (outdated.length > 0) {
            console.error(`\n${outdated.length} dependency name(s) are outdated:`);
            for (const r of outdated) {
                console.error(`  - ${r.name}: ${r.highestInUse} -> ${r.latest}`);
            }
            process.exit(1);
        }
        if (unknown.length > 0) {
            console.error(`\n${unknown.length} dependency name(s) could not be resolved:`);
            for (const r of unknown) {
                console.error(`  - ${r.name}: ${r.error || 'no resolvable version in use'}`);
            }
            process.exit(2);
        }
        console.error('\nAll external dependencies are up to date.');
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

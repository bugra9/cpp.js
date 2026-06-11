import fs from 'node:fs';
import loadJson from './loadJson.js';
import { getOverrideKey } from './overrideDependency.js';
import { getContentHash } from './hash.js';

export function isCached(depsDir, targets, key, dep, hasIos) {
    if (loadJson(`${depsDir}/.cppjs-rebuild.json`)?.key !== key) return false;
    // buildLib writes this last; without it the dep is silently dropped from CMake params,
    // so a half-written cache (killed build) must count as a miss and trigger a rebuild.
    if (!fs.existsSync(`${depsDir}/dist/prebuilt/CMakeLists.txt`)) return false;
    if (!targets.every((t) => fs.existsSync(`${depsDir}/dist/prebuilt/${t.path}/lib`))) return false;
    if (hasIos && !dep.export.libName.every((n) => fs.existsSync(`${depsDir}/${n}.xcframework`))) return false;
    return true;
}

export function getRebuildDeps(allDependencies, rebuildOption) {
    const selector = resolveSelector(rebuildOption);
    return allDependencies.filter((d) => {
        if (d.rebuild || d.overrideBuild) return true;
        if (!selector) return false;
        if (selector === 'ALL') return true;
        const names = [d.general?.name, d.package?.name, d.general?.alias?.package].filter(Boolean);
        return names.some((n) => selector.includes(n));
    });
}

function resolveSelector(rebuildOption) {
    const raw = rebuildOption !== undefined ? rebuildOption : process.env.CPPJS_REBUILD_DEPS;
    if (raw === undefined || raw === null || raw === false || raw === '') return null;
    if (raw === true || raw === '1' || raw === 'true' || raw === 'all') return 'ALL';
    return String(raw).split(',').map((s) => s.trim()).filter(Boolean);
}

export function orderByDependencies(deps) {
    const byProject = new Map(deps.map((d) => [d.paths.project, d]));
    const result = [];
    const visited = new Set();
    const visit = (d) => {
        if (visited.has(d.paths.project)) return;
        visited.add(d.paths.project);
        (d.allDependencies || []).forEach((sub) => {
            const inSet = byProject.get(sub.paths.project);
            if (inSet) visit(inSet);
        });
        result.push(d);
    };
    deps.forEach(visit);
    return result;
}

export function cleanDepsCache(cacheDir, dirNames) {
    const depsRoot = `${cacheDir}/deps`;
    if (!fs.existsSync(depsRoot)) return [];
    const all = fs.readdirSync(depsRoot, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    const removed = dirNames?.length ? all.filter((n) => dirNames.includes(n)) : all;
    removed.forEach((n) => {
        fs.rmSync(`${depsRoot}/${n}`, { recursive: true, force: true });
        fs.rmSync(`${depsRoot}/${n}.lock`, { force: true });
    });
    if (!dirNames?.length) fs.rmSync(depsRoot, { recursive: true, force: true });
    return removed;
}

// Mirrors loadConfig's marker consumption: a dep counts iff its marker key equals the
// current override key. The stamp changes exactly when the consumed set changes, so
// callers (e.g. the RN gradle plugin) can use it as a CMake-configure cache key.
export function computeDependenciesStamp(allDependencies, cacheDir) {
    const keys = allDependencies
        .map((d) => {
            const marker = loadJson(`${cacheDir}/deps/${d.general.name}/.cppjs-rebuild.json`);
            return marker?.key === getOverrideKey(d) ? marker.key : null;
        })
        .filter(Boolean)
        .sort();
    if (keys.length === 0) return 'none';
    return getContentHash(keys.join('|'));
}

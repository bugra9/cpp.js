import fs from 'node:fs';
import state, { setAllDependecyPaths } from '../state/index.js';
import loadConfig from '../state/loadConfig.js';
import loadJson from '../utils/loadJson.js';
import writeJson from '../utils/writeJson.js';
import logger from '../utils/logger.js';
import { getBuildTargets } from './target.js';
import buildExternal from './buildExternal.js';
import createXCFramework from './createXCFramework.js';
import { mergeBuildOverride, getOverrideKey } from '../utils/overrideDependency.js';
import {
    isCached, getRebuildDeps, orderByDependencies, computeDependenciesStamp,
} from '../utils/dependencyRebuild.js';
import withDirLock from '../utils/dirLock.js';

export default async function buildDependencies({ targetParams, rebuildOption }) {
    const rebuildDeps = getRebuildDeps(state.config.allDependencies, rebuildOption);
    if (rebuildDeps.length === 0) return;

    const targets = getBuildTargets(targetParams);
    if (targets.length === 0) return;
    const hasIos = targets.some((t) => t.platform === 'ios');

    const appConfig = state.config;
    const ordered = orderByDependencies(rebuildDeps);

    for (const dep of ordered) {
        const name = dep.general.name;
        const depsDir = `${appConfig.paths.cache}/deps/${name}`;
        const key = getOverrideKey(dep);

        const isUsable = await withDirLock(`${depsDir}.lock`, async () => {
            if (isCached(depsDir, targets, key, dep, hasIos)) {
                logger.info(`cppjs: dependency "${name}" rebuild up to date (cached).`);
                return true;
            }
            return rebuildDependency({
                dep, name, depsDir, key, targetParams, hasIos, appConfig,
            });
        });
        if (!isUsable) continue;

        dep.paths.output = `${depsDir}/dist`;
        if (hasIos) dep.paths.project = depsDir;
        setAllDependecyPaths();
    }
}

async function rebuildDependency({
    dep, name, depsDir, key, targetParams, hasIos, appConfig,
}) {
    const scoped = await loadConfig(dep.paths.project);
    if (!scoped.build?.withBuildConfig) {
        logger.info(`cppjs: dependency "${name}" has no source build recipe (cppjs.build); using prebuilt.`);
        return false;
    }

    const override = dep.overrideBuild;
    if (override) {
        scoped.build = mergeBuildOverride(scoped.build, override);
        if (override.nativeVersion) {
            scoped.package = { ...scoped.package, nativeVersion: override.nativeVersion };
        }
        if (override.targetSpecs) scoped.targetSpecs = [...(scoped.targetSpecs || []), ...override.targetSpecs];
        if (override.export) scoped.export = { ...scoped.export, ...override.export };
    }

    // All build I/O must stay under the app base (Docker mount) — never the dep's own node_modules.
    // output = depsDir/dist (libs) and project = depsDir (xcframework) mirror a normal package layout
    // so createXCFramework's project->output relative path resolves; paths.project stays the dep pkg
    // dir for the recipe's copyToSource asset reads.
    scoped.paths.base = appConfig.paths.base;
    scoped.paths.output = `${depsDir}/dist`;
    scoped.paths.build = `${depsDir}/build`;
    scoped.paths.cache = depsDir;
    scoped.allDependencyPaths = appConfig.allDependencyPaths;

    const stale = loadJson(`${depsDir}/.cppjs-rebuild.json`)?.key !== key;
    if (stale) fs.rmSync(depsDir, { recursive: true, force: true });
    fs.mkdirSync(depsDir, { recursive: true });

    logger.info(`cppjs: rebuilding dependency "${name}" from source (v${scoped.package.nativeVersion})…`);
    const prev = state.config;
    state.config = scoped;
    try {
        await buildExternal(targetParams, { skipXcframework: hasIos });
        if (hasIos) {
            createXCFramework({
                paths: { project: depsDir, output: `${depsDir}/dist` },
                export: { libName: dep.export.libName },
                targetParams,
            });
        }
    } finally {
        state.config = prev;
    }

    writeJson(`${depsDir}/.cppjs-rebuild.json`, { key });
    return true;
}

export function getDependenciesStamp() {
    return computeDependenciesStamp(state.config.allDependencies, state.config.paths.cache);
}

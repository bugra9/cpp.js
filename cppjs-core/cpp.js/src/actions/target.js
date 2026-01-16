import state from '../state/index.js';

const platforms = [...new Set(state.targets.map(target => target.platform).filter(t => t))];
const archs = [...new Set(state.targets.map(target => target.arch).filter(t => t))];
const runtimes = [...new Set(state.targets.map(target => target.runtime).filter(t => t))];
const buildTypes = [...new Set(state.targets.map(target => target.buildType).filter(t => t))];
const runtimeEnvs = [...new Set(state.targets.map(target => target.runtimeEnv).filter(t => t))];

export function getTargetParams(givenTargetParams = {}, noParamCheck = false) {
    const { platform, arch, runtime, buildType, runtimeEnv } = givenTargetParams;
    if (!noParamCheck && (
        (state.config.target.platform && platform && !platform.includes(state.config.target.platform))
        || (state.config.target.arch && arch && !arch.includes(state.config.target.arch))
        || (state.config.target.runtime && runtime && !runtime.includes(state.config.target.runtime))
        || (state.config.target.buildType && buildType && !buildType.includes(state.config.target.buildType))
        || (state.config.target.runtimeEnv && runtimeEnv && !runtimeEnv.includes(state.config.target.runtimeEnv))
    )) {
        throw new Error('Invalid target parameters');
    }
    return {
        platform: state.config.target.platform ? [state.config.target.platform] : platform || platforms,
        arch: state.config.target.arch ? [state.config.target.arch] : arch || archs,
        runtime: state.config.target.runtime ? [state.config.target.runtime] : runtime || runtimes,
        buildType: state.config.target.buildType ? [state.config.target.buildType] : buildType || buildTypes,
        runtimeEnv: state.config.target.runtimeEnv ? [state.config.target.runtimeEnv] : runtimeEnv || runtimeEnvs,
    };
}

export function getBuildTargets(targetParams) {
    const { platform, arch, runtime, buildType, runtimeEnv } = targetParams;
    return state.targets.filter(t => (
        (!t.platform || platform.includes(t.platform))
        && (!t.arch || arch.includes(t.arch))
        && (!t.runtime || runtime.includes(t.runtime))
        && (!t.buildType || buildType.includes(t.buildType))
        && (!t.runtimeEnv || runtimeEnv.includes(t.runtimeEnv))
    ));
}

export function getFilteredBuildTargets(targetParams, targetFilter) {
    const buildTargets = getBuildTargets(targetParams);
    return buildTargets.filter(t => (
        (!targetFilter.platform || t.platform === targetFilter.platform)
        && (!targetFilter.arch || t.arch === targetFilter.arch)
        && (!targetFilter.runtime || t.runtime === targetFilter.runtime)
        && (!targetFilter.buildType || t.buildType === targetFilter.buildType)
        && (!targetFilter.runtimeEnv || t.runtimeEnv === targetFilter.runtimeEnv)
    ));
}

export function getFilteredTargetSpec(targetSpecs, target) {
    return targetSpecs?.filter(t => (
        (!t.platform || t.platform === target.platform)
        && (!t.arch || t.arch === target.arch)
        && (!t.runtime || t.runtime === target.runtime)
        && (!t.buildType || t.buildType === target.buildType)
        && (!t.runtimeEnv || t.runtimeEnv === target.runtimeEnv)
    ))?.map(t => t?.specs)?.filter(t => t) || [];
}

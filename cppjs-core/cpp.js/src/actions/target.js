import state from '../state/index.js';

export function getTargetParams(givenTargetParams = {}, noParamCheck = false) {
    const { platform, arch, runtime, buildType, runtimeEnv } = givenTargetParams;
    if (!noParamCheck && (
        (state.config.target.platform && platform && platform !== 'all' && state.config.target.platform !== platform)
        || (state.config.target.arch && arch && arch !== 'all' && state.config.target.arch !== arch)
        || (state.config.target.runtime && runtime && runtime !== 'all' && state.config.target.runtime !== runtime)
        || (state.config.target.buildType && buildType && buildType !== 'all' && state.config.target.buildType !== buildType)
        || (state.config.target.runtimeEnv && runtimeEnv && runtimeEnv !== 'all' && state.config.target.runtimeEnv !== runtimeEnv)
    )) {
        throw new Error('Invalid target parameters');
    }
    return {
        platform: state.config.target.platform || platform || 'all',
        arch: state.config.target.arch || arch || 'all',
        runtime: state.config.target.runtime || runtime || 'all',
        buildType: state.config.target.buildType || buildType || 'all',
        runtimeEnv: state.config.target.runtimeEnv || runtimeEnv || 'all',
    };
}

export function getBuildTargets(targetParams) {
    const { platform, arch, runtime, buildType, runtimeEnv } = targetParams;
    return state.targets.filter(t => (
        (platform === 'all' || t.platform === platform)
        && (arch === 'all' || t.arch === arch)
        && (runtime === 'all' || t.runtime === runtime)
        && (buildType === 'all' || t.buildType === buildType)
        && (runtimeEnv === 'all' || t.runtimeEnv === runtimeEnv)
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

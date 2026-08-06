// Single source for the build-target matrix and its naming; state/ copies (and then
// decorates) these entries, and consumer runtimes read them without touching CLI state.

export const TARGETS = [
    {
        platform: 'wasm', arch: 'wasm32', runtime: 'st', buildType: 'release', runtimeEnv: 'browser',
    },
    {
        platform: 'wasm', arch: 'wasm32', runtime: 'st', buildType: 'release', runtimeEnv: 'edge',
    },
    {
        platform: 'wasm', arch: 'wasm32', runtime: 'st', buildType: 'release', runtimeEnv: 'node',
    },
    {
        platform: 'wasm', arch: 'wasm32', runtime: 'st', buildType: 'debug', runtimeEnv: 'browser',
    },
    {
        platform: 'wasm', arch: 'wasm32', runtime: 'st', buildType: 'debug', runtimeEnv: 'edge',
    },
    {
        platform: 'wasm', arch: 'wasm32', runtime: 'st', buildType: 'debug', runtimeEnv: 'node',
    },
    {
        platform: 'wasm', arch: 'wasm32', runtime: 'mt', buildType: 'release', runtimeEnv: 'browser',
    },
    {
        platform: 'wasm', arch: 'wasm32', runtime: 'mt', buildType: 'release', runtimeEnv: 'node',
    },
    {
        platform: 'wasm', arch: 'wasm32', runtime: 'mt', buildType: 'debug', runtimeEnv: 'browser',
    },
    {
        platform: 'wasm', arch: 'wasm32', runtime: 'mt', buildType: 'debug', runtimeEnv: 'node',
    },
    {
        platform: 'wasm', arch: 'wasm64', runtime: 'st', buildType: 'release', runtimeEnv: 'browser',
    },
    {
        platform: 'wasm', arch: 'wasm64', runtime: 'st', buildType: 'release', runtimeEnv: 'edge',
    },
    {
        platform: 'wasm', arch: 'wasm64', runtime: 'st', buildType: 'release', runtimeEnv: 'node',
    },
    {
        platform: 'wasm', arch: 'wasm64', runtime: 'st', buildType: 'debug', runtimeEnv: 'browser',
    },
    {
        platform: 'wasm', arch: 'wasm64', runtime: 'st', buildType: 'debug', runtimeEnv: 'edge',
    },
    {
        platform: 'wasm', arch: 'wasm64', runtime: 'st', buildType: 'debug', runtimeEnv: 'node',
    },
    {
        platform: 'wasm', arch: 'wasm64', runtime: 'mt', buildType: 'release', runtimeEnv: 'browser',
    },
    {
        platform: 'wasm', arch: 'wasm64', runtime: 'mt', buildType: 'release', runtimeEnv: 'node',
    },
    {
        platform: 'wasm', arch: 'wasm64', runtime: 'mt', buildType: 'debug', runtimeEnv: 'browser',
    },
    {
        platform: 'wasm', arch: 'wasm64', runtime: 'mt', buildType: 'debug', runtimeEnv: 'node',
    },
    {
        platform: 'wasi', arch: 'wasm32', runtime: 'st', buildType: 'release',
    },
    {
        platform: 'wasi', arch: 'wasm32', runtime: 'st', buildType: 'debug',
    },
    {
        platform: 'android', arch: 'arm64-v8a', runtime: 'mt', buildType: 'release',
    },
    {
        platform: 'android', arch: 'arm64-v8a', runtime: 'mt', buildType: 'debug',
    },
    {
        platform: 'android', arch: 'x86_64', runtime: 'mt', buildType: 'release',
    },
    {
        platform: 'android', arch: 'x86_64', runtime: 'mt', buildType: 'debug',
    },
    {
        platform: 'ios', arch: 'iphoneos', runtime: 'mt', buildType: 'release',
    },
    {
        platform: 'ios', arch: 'iphoneos', runtime: 'mt', buildType: 'debug',
    },
    {
        platform: 'ios', arch: 'iphonesimulator', runtime: 'mt', buildType: 'release',
    },
    {
        platform: 'ios', arch: 'iphonesimulator', runtime: 'mt', buildType: 'debug',
    },
];

export function targetPathOf(target) {
    return `${target.platform}-${target.arch}-${target.runtime}-${target.buildType}`;
}

export function filterTargetSpecs(targetSpecs, target) {
    return targetSpecs?.filter(t => (
        (!t.platform || t.platform === target.platform)
        && (!t.arch || t.arch === target.arch)
        && (!t.runtime || t.runtime === target.runtime)
        && (!t.buildType || t.buildType === target.buildType)
        && (!t.runtimeEnv || t.runtimeEnv === target.runtimeEnv)
    ))?.map(t => t?.specs)?.filter(t => t) || [];
}

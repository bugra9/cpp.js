import state from '../state/index.js';

export default function getCmakeParameters(platform, options = {}) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
        throw new Error('invalid options');
    }

    const params = [];
    // if (isBuildBridge) params.push('-DBUILD_BRIDGE=TRUE');

    const dependParams = state.config.dependencyParameters;
    const externalNativeGlob = [
        ...(options.nativeGlob || []),
    ];
    const externalBridgeGlob = [
        `${state.config.paths.cli}/assets/commonBridges.cpp`,
        ...(options.bridgeGlob || []),
    ];
    const nativeGlob = [
        `${state.config.paths.cli}/assets/cppjsEmptySource.cpp`,
        ...(dependParams.nativeGlob || []),
    ];
    const headerGlob = [
        ...(dependParams.headerGlob || []),
        ...(options.headerGlob || []),
    ];

    const headerDirs = [
        dependParams.headerPathWithDepends,
        ...(options.headerDirs || []),
    ];

    const basePlatform = platform.split('-', 1)[0];
    const sharedPlatforms = ['Android'];
    const buildType = sharedPlatforms.includes(basePlatform) ? 'SHARED' : 'STATIC';
    const otherBuildType = buildType === 'STATIC' ? 'SHARED' : 'STATIC';

    params.push(...[
        `-DPROJECT_NAME=${options.name || state.config.general.name}`,
        `-DBASE_DIR=${state.config.paths.project}`,
        `-DEXTERNAL_NATIVE_GLOB=${externalNativeGlob.join(';')}`,
        `-DEXTERNAL_BRIDGE_GLOB=${externalBridgeGlob.join(';')}`,
        `-DNATIVE_GLOB=${nativeGlob.join(';')}`,
        `-DHEADER_GLOB=${headerGlob.join(';')}`,
        `-DHEADER_DIR=${headerDirs.join(';')}`,
        `-DDEPENDS_CMAKE_PATHS=${dependParams.pathsOfCmakeDepends}`,
        `-DDEPENDS_CMAKE_NAMES=${dependParams.nameOfCmakeDepends}`,
        `-DBRIDGE_DIR=${state.config.paths.build}/bridge`,
        `-DBUILD_TYPE=${buildType}`,
        `-DBUILD_${otherBuildType}_LIBS=OFF`,
        // '-DCMAKE_CXX_COMPILER_LAUNCHER=ccache',
        ...(options.buildSource !== false ? ['-DBUILD_SOURCE=TRUE'] : []),
    ]);

    return params;
}

import fs from 'node:fs';
import state from '../state/index.js';
import getData from './getData.js';

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

    const cmakeCompileOptions = [...new Set(getData('cmake', platform)?.compileOptions || [])];

    const pathsOfCmakeDepends = dependParams.pathsOfCmakeDepends.split(';');
    const nameOfCmakeDepends = dependParams.nameOfCmakeDepends.split(';');
    const pathsOfCmakeDependsFilteredByPlatform = [];
    const nameOfCmakeDependsFilteredByPlatform = [];
    pathsOfCmakeDepends.forEach((d, i) => {
        if (fs.existsSync(`${d}/${platform}`) || (basePlatform === 'iOS' && fs.existsSync(`${d}/../../${nameOfCmakeDepends[i]}.xcframework`))) {
            pathsOfCmakeDependsFilteredByPlatform.push(d);
            nameOfCmakeDependsFilteredByPlatform.push(nameOfCmakeDepends[i]);
        }
    });

    params.push(...[
        `-DPROJECT_NAME=${options.name || state.config.general.name}`,
        `-DBASE_DIR=${state.config.paths.project}`,
        `-DEXTERNAL_NATIVE_GLOB=${externalNativeGlob.join(';')}`,
        `-DEXTERNAL_BRIDGE_GLOB=${externalBridgeGlob.join(';')}`,
        `-DNATIVE_GLOB=${nativeGlob.join(';')}`,
        `-DHEADER_GLOB=${headerGlob.join(';')}`,
        `-DHEADER_DIR=${headerDirs.join(';')}`,
        `-DDEPENDS_CMAKE_PATHS=${pathsOfCmakeDependsFilteredByPlatform.join(';')}`,
        `-DDEPENDS_CMAKE_NAMES=${nameOfCmakeDependsFilteredByPlatform.join(';')}`,
        `-DBRIDGE_DIR=${state.config.paths.build}/bridge`,
        `-DBUILD_TYPE=${buildType}`,
        `-DBUILD_${otherBuildType}_LIBS=OFF`,
        `-DCOMPILE_OPTIONS=${cmakeCompileOptions.join(';')}`,
        // '-DCMAKE_CXX_COMPILER_LAUNCHER=ccache',
        ...(options.buildSource !== false ? ['-DBUILD_SOURCE=TRUE'] : []),
    ]);

    return params;
}

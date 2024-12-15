import os from 'node:os';
import fs from 'node:fs';
import replace from 'replace';
import run from './run.js';
import getCmakeParameters from './getCmakeParameters.js';
import state from '../state/index.js';

const cpuCount = os.cpus().length - 1;
const sharedPlatforms = ['Android'];

export default function createLib(platform, fileType, options = {}) {
    if (!platform || !options || typeof options !== 'object' || Array.isArray(options)) {
        throw new Error('invalid platform or options');
    }

    const basePlatform = platform.split('-', 1)[0];
    if (basePlatform === 'iOS' && process.platform !== 'darwin') {
        return;
    }

    const buildType = options.isProd ? 'Release' : 'Debug';
    const platformPrefix = `${fileType ? `${fileType}-` : ''}${buildType}`;
    const libdir = `${state.config.paths.build}/${platformPrefix}/prebuilt/${platform}`;
    const buildPath = `${state.config.paths.build}/${platformPrefix}/${platform}`;

    const buildEnv = { params: [] };
    let buildParams;
    const depPaths = state.config.allDependencyPaths[platform];
    if (state.config.build) {
        const { getBuildParams, getExtraLibs } = state.config.build;
        buildEnv.console = true;
        const ext = sharedPlatforms.includes(basePlatform) ? 'so' : 'a';
        buildParams = getBuildParams ? getBuildParams(platform, depPaths, ext, buildPath) : [];
        if (state.config.build?.buildType !== 'configure') {
            const cmakeBuildType = sharedPlatforms.includes(basePlatform) ? 'SHARED' : 'STATIC';
            buildParams.push(`-DCMAKE_PREFIX_PATH=${libdir}`, `-DCMAKE_FIND_ROOT_PATH=${libdir}`, `-DBUILD_TYPE=${cmakeBuildType}`);
        }

        const cFlags = Object.values(depPaths).map((d) => `-I${d.header}`).join(' ');
        const ldFlags = Object.values(depPaths).map((d) => `-L${d.libPath}`).join(' ');
        let dependLibs = '';
        if (state.config.build?.buildType === 'configure') {
            dependLibs = Object.keys(depPaths).map((d) => `-l${d}`).join(' ');
        }

        const extraLibs = getExtraLibs ? getExtraLibs(platform) : [];

        buildEnv.params.push('-e', `CFLAGS=${cFlags}`);
        buildEnv.params.push('-e', `CPPFLAGS=${cFlags}`);
        buildEnv.params.push('-e', `LDFLAGS=${ldFlags} ${extraLibs.join(' ')}`);
        // buildEnv.params.push('-e', `LIBS=${dependLibs} ${extraLibs.join(' ')}`);

        state.config.build.env?.forEach((e) => {
            buildEnv.params.push('-e', e);
        });
    } else {
        buildParams = getCmakeParameters(platform, options);
    }

    console.log(`${platform} is compiling...`);
    const t0 = performance.now();
    const cmakeDir = state.config.build ? `${state.config.paths.build}/source` : state.config.paths.cmakeDir;

    if (state.config.build?.beforeRun) {
        const dataList = state.config.build?.beforeRun(cmakeDir);
        dataList.forEach((data) => {
            run(data.program, data.parameters || [], platformPrefix, platform, buildEnv);
        });
    }

    if (!options.bypassCmake) {
        if (state.config.build?.buildType === 'configure') {
            fs.cpSync(cmakeDir, buildPath, { recursive: true });
            if (state.config.build?.sourceReplaceList) {
                state.config.build.sourceReplaceList(platform, depPaths)?.forEach(({ regex, replacement, paths }) => {
                    replace({
                        regex, replacement, paths: paths.map((p) => `${buildPath}/${p}`), recursive: false, silent: true,
                    });
                });
            }
            run(null, [
                './configure',
                ...buildParams,
                `--prefix=${libdir}`,
            ], platformPrefix, platform, buildEnv);
        } else {
            run(null, [
                basePlatform === 'iOS' && state.config.build?.useIOSCMake ? 'ios-cmake' : 'cmake', cmakeDir,
                `-DCMAKE_BUILD_TYPE=${buildType}`,
                `-DCMAKE_INSTALL_PREFIX=${libdir}`,
                ...buildParams,
            ], platformPrefix, platform, buildEnv);
        }
    }
    const t1 = performance.now();
    if (basePlatform === 'iOS' && state.config.build?.buildType !== 'configure') {
        const iOSCMakeBuilder = state.config.build?.useIOSCMake ? 'ios-cmake' : 'cmake';
        run(null, [iOSCMakeBuilder, '--build', '.', '-j', cpuCount, '--config', buildType, '--target', 'install'], platformPrefix, platform, { console: buildEnv.console });
    } else {
        run(null, ['make', `-j${cpuCount}`, 'install'], platformPrefix, platform, { console: buildEnv.console });
    }
    const t2 = performance.now();
    console.log(`${platform} compiled`, platformPrefix, `full time: ${Math.round(t2 - t0)}ms`, `cmake: ${Math.round(t1 - t0)}ms`, `build: ${Math.round(t2 - t1)}ms`, `core: ${cpuCount}`);
}

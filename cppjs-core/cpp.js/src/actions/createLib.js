import os from 'node:os';
import fs from 'node:fs';
import replace from 'replace';
import getData from './getData.js';
import run from './run.js';
import getCmakeParameters from './getCmakeParameters.js';
import triggerExtensions from './extensions.js';
import state from '../state/index.js';

const cpuCount = os.cpus().length - 1;
const sharedPlatforms = ['android'];

export default function createLib(target, fileType, options = {}) {
    if (!target || !options || typeof options !== 'object' || Array.isArray(options)) {
        throw new Error('invalid target or options');
    }

    if (target.platform === 'ios' && process.platform !== 'darwin') {
        return;
    }

    const buildType = target.buildType === 'release' ? 'Release' : 'Debug';
    const platformPrefix = `${fileType ? `${fileType}-` : ''}${buildType}`;
    const libdir = `${state.config.paths.build}/${platformPrefix}/prebuilt/${target.path}`;
    const buildPath = `${state.config.paths.build}/${platformPrefix}/${target.path}`;
    if (fs.existsSync(`${libdir}/lib`)) {
        console.log(`${target.path} is already built`);
        return;
    }

    const buildEnv = { params: [] };
    let buildParams;
    const depPaths = state.config.allDependencyPaths[target.path];
    if (state.config.build.withBuildConfig) {
        const { getBuildParams, getExtraLibs } = state.config.build;
        buildEnv.console = true;
        const ext = sharedPlatforms.includes(target.platform) ? 'so' : 'a';
        buildParams = getBuildParams ? getBuildParams(target, depPaths, ext, buildPath) : [];
        if (state.config.build?.buildType !== 'configure') {
            const cmakeBuildType = sharedPlatforms.includes(target.platform) ? 'SHARED' : 'STATIC';
            buildParams.push(`-DCMAKE_PREFIX_PATH=${libdir}`, `-DCMAKE_FIND_ROOT_PATH=${libdir}`, `-DBUILD_TYPE=${cmakeBuildType}`);
        }

        const cFlags = Object.values(depPaths).filter(d => d.header).map((d) => `-I${d.header}`);
        const ldFlags = Object.values(depPaths).filter(d => d.libPath).map((d) => `-L${d.libPath}`);
        let dependLibs = '';
        if (state.config.build?.buildType === 'configure') {
            dependLibs = Object.keys(depPaths).filter(d => d && d !== 'cmake').map((d) => `-l${d}`).join(' ');
        }

        const extraLibs = getExtraLibs ? getExtraLibs(target) : [];

        triggerExtensions('createLib', 'setFlagWithBuildConfig', [buildEnv, cFlags, ldFlags]);
        if (target.runtime === 'mt') {
            cFlags.push('-pthread');
            ldFlags.push('-pthread');
        }

        if (target.platform === 'wasm') {
            cFlags.push('-msimd128');
            ldFlags.push('-msimd128');
        }

        if (target.platform === 'wasm' && target.arch === 'wasm64') {
            cFlags.push('-sMEMORY64=1');
            ldFlags.push('-sMEMORY64=1');
        }

        buildEnv.params.push('-e', `CFLAGS=${cFlags.join(' ')}`);
        buildEnv.params.push('-e', `CXXFLAGS=${cFlags.join(' ')}`);
        buildEnv.params.push('-e', `LDFLAGS=${ldFlags.join(' ')} ${extraLibs.join(' ')}`);
        buildEnv.params.push('-e', `LIBS=${dependLibs} ${extraLibs.join(' ')}`);

        let configBuildEnv = state.config.build.env;
        if (configBuildEnv && typeof configBuildEnv === 'function') {
            configBuildEnv = configBuildEnv(target);
        }
        configBuildEnv?.forEach((e) => {
            buildEnv.params.push('-e', e);
        });
    } else {
        buildParams = getCmakeParameters(target, options);

        triggerExtensions('createLib', 'setFlagWithoutBuildConfig', [buildEnv]);

        if (target.runtime === 'mt') {
            buildEnv.params.push('-e', `CFLAGS=-pthread`);
            buildEnv.params.push('-e', `CXXFLAGS=-pthread`);
            buildEnv.params.push('-e', `LDFLAGS=-pthread`);
        }

        if (target.platform === 'wasm') {
            buildEnv.params.push('-e', `CFLAGS=-msimd128`);
            buildEnv.params.push('-e', `CXXFLAGS=-msimd128`);
            buildEnv.params.push('-e', `LDFLAGS=-msimd128`);
        }

        if (target.platform === 'wasm' && target.arch === 'wasm64') {
            buildEnv.params.push('-e', `CFLAGS=-sMEMORY64=1`);
            buildEnv.params.push('-e', `CXXFLAGS=-sMEMORY64=1`);
            buildEnv.params.push('-e', `LDFLAGS=-sMEMORY64=1`);
        }
    }

    console.log(`${target.path} ${target.runtimeEnv || ''} ${fileType} is compiling...`);
    const t0 = performance.now();
    const cmakeDir = state.config.build.withBuildConfig ? `${state.config.paths.build}/source` : state.config.paths.cmakeDir;

    if (state.config.build?.beforeRun) {
        const dataList = state.config.build?.beforeRun(cmakeDir);
        dataList.forEach((data) => {
            run(data.program, data.parameters || [], platformPrefix, target, buildEnv);
        });
    }

    if (!options.bypassCmake) {
        if (state.config.build?.buildType === 'configure') {
            fs.cpSync(cmakeDir, buildPath, { recursive: true });
            if (state.config.build?.sourceReplaceList) {
                state.config.build.sourceReplaceList(target, depPaths)?.forEach(({ regex, replacement, paths }) => {
                    replace({
                        regex, replacement, paths: paths.map((p) => `${buildPath}/${p}`), recursive: false, silent: true,
                    });
                });
            }
            run(null, [
                './configure',
                ...buildParams,
                `--prefix=${libdir}`,
            ], platformPrefix, target, buildEnv);
        } else {
            run(null, [
                target.platform === 'ios' && state.config.build?.useIOSCMake ? 'ios-cmake' : 'cmake', cmakeDir,
                `-DCMAKE_BUILD_TYPE=${buildType}`,
                `-DCMAKE_INSTALL_PREFIX=${libdir}`,
                ...buildParams,
            ], platformPrefix, target, buildEnv);
        }
    }
    const t1 = performance.now();
    if (target.platform === 'ios' && state.config.build?.buildType !== 'configure') {
        const iOSCMakeBuilder = state.config.build?.useIOSCMake ? 'ios-cmake' : 'cmake';
        run(null, [iOSCMakeBuilder, '--build', '.', '-j', cpuCount, '--config', buildType, '--target', 'install'], platformPrefix, target, { console: buildEnv.console });
    } else {
        run(null, ['make', `-j${cpuCount}`, 'install'], platformPrefix, target, { console: buildEnv.console });
    }
    const t2 = performance.now();
    console.log(`${target.path} ${target.runtimeEnv || ''} ${fileType} compiled`, platformPrefix, `full time: ${Math.round(t2 - t0)}ms`, `cmake: ${Math.round(t1 - t0)}ms`, `build: ${Math.round(t2 - t1)}ms`, `core: ${cpuCount}`);
}

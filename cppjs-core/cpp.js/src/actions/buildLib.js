import fs from 'node:fs';
import createLib from './createLib.js';
import createXCFramework from './createXCFramework.js';
import { getBuildTargets, getFilteredTargetSpec } from './target.js';
import state from '../state/index.js';
import logger from '../utils/logger.js';
import findFiles from '../utils/findFiles.js';

export default function buildLib(targetParams, options = {}) {
    let isChanged = false;
    const targets = getBuildTargets(targetParams);
    if (targets.length === 0) {
        console.error('No targets found for the given parameters.', targetParams);
        throw new Error('No targets found for the given parameters.');
    }

    targets.forEach((target) => {
        if (!fs.existsSync(`${state.config.paths.output}/prebuilt/${target.path}/lib`)) {
            createLib(target, 'Source', { buildSource: true });

            const modules = [];
            state.config.paths.module.forEach((modulePath) => {
                modules.push(...findFiles('**/*.i', { cwd: modulePath }));
                modules.push(...findFiles('*.i', { cwd: modulePath }));
            });
            if (modules.length > 0) {
                fs.mkdirSync(`${state.config.paths.output}/prebuilt/${target.path}/swig`, { recursive: true });
            }
            modules.forEach((modulePath) => {
                const fileName = modulePath.split('/').at(-1);
                fs.copyFileSync(modulePath, `${state.config.paths.output}/prebuilt/${target.path}/swig/${fileName}`);
            });
            isChanged = true;
        } else {
            logger.cachedStep(target, 'lib');
        }
    });

    if (isChanged && fs.existsSync(`${state.config.paths.build}/Source-Release/prebuilt`)) {
        fs.cpSync(`${state.config.paths.build}/Source-Release/prebuilt`, `${state.config.paths.output}/prebuilt`, { recursive: true, dereference: true });
    }
    if (isChanged && fs.existsSync(`${state.config.paths.build}/Source-Debug/prebuilt`)) {
        fs.cpSync(`${state.config.paths.build}/Source-Debug/prebuilt`, `${state.config.paths.output}/prebuilt`, { recursive: true, dereference: true });
    }

    if (!options.skipXcframework) {
        createXCFramework();

        const iosTargets = getBuildTargets({ platform: ['ios'], arch: ['iphoneos'], runtime: ['mt'], buildType: ['release'] });
        const podSpecs = findFiles('*.podspec', { cwd: state.config.paths.project });
        if (podSpecs.length === 0 && targets.length > 0) {
            const iosTarget = iosTargets[0];
            const resources = getFilteredTargetSpec(state.config.targetSpecs, iosTarget).map(s => s.data).filter(s => s).map(d => Object.keys(d)).flat();
            const uniqueResources = [...new Set(resources)].map(r => `dist/prebuilt/${iosTarget.path}/${r}`);
            const xcFrameworks = [];
            xcFrameworks.push(...state.config.export.libName.map((l) => `${l}.xcframework`));
            if (!xcFrameworks.some(f => !fs.existsSync(`${state.config.paths.project}/${f}`))) {
                xcFrameworks.push(...state.config.dependencies.map((d) => d.export.libName.map((l) => `${l}.xcframework`)).flat());
                const distPodSpecContent = fs.readFileSync(`${state.config.paths.cli}/assets/packaging/cppjs-package.podspec`, { encoding: 'utf8', flag: 'r' })
                    .replaceAll('___PROJECT_NAME___', state.config.general.name)
                    .replace('___PROJECT_FRAMEWORKS___', xcFrameworks.map(f => `'${f}'`).join(', '))
                    .replace('___PROJECT_RESOURCES___', JSON.stringify(uniqueResources));
                fs.writeFileSync(`${state.config.paths.project}/${state.config.general.name}.podspec`, distPodSpecContent);
            }
        }
    }

    if (fs.existsSync(`${state.config.paths.output}/prebuilt`)) {
        // A partial build (e.g. `cppjs build -p wasm`) must not clobber the other platforms'
        // entries: consumers resolve this CMakeLists for ios/android too, and a target missing
        // from the list silently drops the dependency's include dirs and libs. Advertise every
        // target already present in dist alongside the ones just built.
        const distTargets = fs.readdirSync(`${state.config.paths.output}/prebuilt`, { withFileTypes: true })
            .filter((e) => e.isDirectory() && fs.existsSync(`${state.config.paths.output}/prebuilt/${e.name}/lib`))
            .map((e) => e.name);
        const hostTargets = [...new Set([...distTargets, ...targets.map((t) => t.path)])];
        const distCmakeContent = fs.readFileSync(`${state.config.paths.cli}/assets/cmake/dist.cmake`, { encoding: 'utf8', flag: 'r' })
            .replace('___PROJECT_NAME___', state.config.general.name)
            .replace('___PROJECT_HOST___', hostTargets.join(';'))
            .replace('___PROJECT_LIBS___', state.config.export.libName.join(';'));
        fs.writeFileSync(`${state.config.paths.output}/prebuilt/CMakeLists.txt`, distCmakeContent);
    }
}

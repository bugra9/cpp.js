#!/usr/bin/env node

import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { Command, Option } from 'commander';
import replace from 'replace';

import { state } from './index.js';
import createBridgeFile from './actions/createInterface.js';
import createLib from './actions/createLib.js';
import buildWasm from './actions/buildWasm.js';
import createXCFramework from './actions/createXCFramework.js';
import runCppjsApp from './actions/run.js';
import { getBuildTargets, getFilteredBuildTargets, getFilteredTargetSpec } from './actions/target.js';

import downloadAndExtractFile from './utils/downloadAndExtractFile.js';
import writeJson from './utils/writeJson.js';
import systemKeys from './utils/systemKeys.js';
import logger from './utils/logger.js';
import { getDockerImage } from './utils/pullDockerImage.js';
import { getContentHash } from './utils/hash.js';
import findFiles from './utils/findFiles.js';

const packageJSON = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));

const platforms = [...new Set(state.targets.map(target => target.platform).filter(t => t))];
const archs = [...new Set(state.targets.map(target => target.arch).filter(t => t))];
const runtimes = [...new Set(state.targets.map(target => target.runtime).filter(t => t))];
const buildTypes = [...new Set(state.targets.map(target => target.buildType).filter(t => t))];
const runtimeEnvs = [...new Set(state.targets.map(target => target.runtimeEnv).filter(t => t))];

const program = new Command();

program
    .name('cppjs')
    .description('Compile C++ files to WebAssembly and native platforms.')
    .version(packageJSON.version)
    .showHelpAfterError();

program.command('build')
    .description('compile the project that was set up using Cpp.js')
    .addOption(new Option('-p, --platform <platform>', 'target platform').argParser(createListParser(platforms)))
    .addOption(new Option('-a, --arch <arch>', 'target architecture').argParser(createListParser(archs)))
    .addOption(new Option('-r, --runtime <runtime>', 'target runtime').argParser(createListParser(runtimes)))
    .addOption(new Option('-b, --build-type <buildType>', 'target build type').argParser(createListParser(buildTypes)))
    .addOption(new Option('-e, --runtime-env <runtimeEnv>', 'target runtime environment').argParser(createListParser(runtimeEnvs)))
    .action((options) => {
        const targetParams = { ...options };

        if (!targetParams.arch) {
            targetParams.arch = archs.filter(item => item !== 'wasm64');
        }
        if (!targetParams.buildType) {
            targetParams.buildType = ['release'];
        }

        targetParams.platform = targetParams.platform || platforms;
        targetParams.arch = targetParams.arch || archs;
        targetParams.runtime = targetParams.runtime || runtimes;
        targetParams.buildType = targetParams.buildType || buildTypes;
        targetParams.runtimeEnv = targetParams.runtimeEnv || runtimeEnvs;

        if (state.config.build.withBuildConfig) {
            buildExternal(targetParams);
        } else {
            build(targetParams);
        }
    });

const dockerContainerName = () =>
    `${getDockerImage()}-${getContentHash(state.config.paths.base)}`
        .replace('/', '-')
        .replace(':', '-');

const dockerExec = (args) => {
    try {
        execFileSync('docker', args, { stdio: 'inherit' });
    } catch (e) {
        console.error('An error occurred while running the application. Please check the logs for more details.');
        process.exit();
    }
};

const commandDocker = program.command('docker').description('manage docker');

commandDocker.command('run')
    .description('run docker application')
    .argument('<program>', 'program to execute inside the container')
    .argument('[params...]', 'arguments passed to the program')
    .action((programName, params) => run(programName, params));

commandDocker.command('create')
    .description('create docker container')
    .action(() => dockerExec([
        'run', '-dit',
        '--name', dockerContainerName(),
        '-v', `${state.config.paths.base}:/tmp/cppjs/live`,
        getDockerImage(),
        'bash',
    ]));

commandDocker.command('start')
    .description('start docker container')
    .action(() => dockerExec(['start', dockerContainerName()]));

commandDocker.command('stop')
    .description('stop docker container')
    .action(() => dockerExec(['stop', dockerContainerName()]));

commandDocker.command('delete')
    .description('delete docker container')
    .action(() => dockerExec(['rm', dockerContainerName()]));

const commandConfig = program.command('config')
    .description('manage the Cpp.js configuration files');

commandConfig.command('get')
    .description('get the Cpp.js system configuration')
    .argument('<key>', 'configuration key to read')
    .action((key) => getSystemConfig(key));

commandConfig.command('set')
    .description('set the Cpp.js system configuration')
    .argument('<key>', 'configuration key to set')
    .argument('<value>', 'value to assign')
    .action((key, value) => setSystemConfig(key, value));

commandConfig.command('delete')
    .description('delete the Cpp.js system configuration')
    .argument('<key>', 'configuration key to remove')
    .action((key) => deleteSystemConfig(key));

commandConfig.command('list')
    .description('list the Cpp.js configurations')
    .addOption(new Option('-t, --type <type>', 'config type').default('system').choices(['all', 'system', 'project']))
    .action((options) => listSystemConfig(options.type));

commandConfig.command('keys')
    .description('list all available system configuration keys for Cpp.js')
    .action(() => listSystemKeys());

program.parse(process.argv);

function listSystemKeys() {
    console.info('Available configurations:');
    console.table(systemKeys);
}

function getSystemConfig(systemKey) {
    if (!systemKey) {
        listSystemConfig('system');
        return;
    }
    const key = systemKey.toUpperCase();
    const output = {};
    if (key in state.config.system) {
        output[key] = { value: state.config.system[key] || 'undefined', default: systemKeys[key].default };
    }
    Object.keys(systemKeys).filter((k) => k.includes(key)).forEach((k) => {
        if (k in state.config.system) {
            output[k] = { value: state.config.system[k] || 'undefined', default: systemKeys[k].default };
        }
    });

    console.table(output);
}

function setSystemConfig(key, value) {
    if (!systemKeys[key]) {
        throw new Error(`Configuration ${key} is not available. Please choose from the following available configurations: ${Object.keys(systemKeys).join(', ')}`);
    }
    if (systemKeys[key].options && !systemKeys[key].options.includes(value)) {
        throw new Error(`Value ${value} is not available. Please choose from the following available values: ${systemKeys[key].options.join(', ')}`);
    }

    state.config.system[key] = value;
    writeJson(state.config.paths.systemConfig, state.config.system);
}

function deleteSystemConfig(key) {
    if (!systemKeys[key]) {
        throw new Error(`Configuration ${key} is not available. Please choose from the following available configurations: ${Object.keys(systemKeys).join(', ')}`);
    }
    delete state.config.system[key];
    writeJson(state.config.paths.systemConfig, state.config.system);
}

function listSystemConfig(type) {
    const { system: systemConfig, ...projectConfig } = state.config;
    if (type === 'all' || type === 'system') {
        console.log('System Configuration');
        console.table(systemConfig);
    }

    if (type === 'all') {
        console.log('');
    }

    if (type === 'all' || type === 'project') {
        console.log('Project Configuration');
        console.table(projectConfig);
    }
}

function run(programName, params) {
    runCppjsApp(programName, params, null, null, { console: true });
}

async function buildExternal(targetParams) {
    const version = state.config.package.nativeVersion;
    if (!version) {
        console.error('no version found!');
        return;
    }

    const { getURL, replaceList, copyToSource, copyToDist } = state.config.build;
    const isNewlyCreated = await downloadAndExtractFile(getURL(version), state.config.paths.build);
    const sourcePath = `${state.config.paths.build}/source`;
    if (isNewlyCreated && replaceList) {
        replaceList.forEach(({ regex, replacement, paths }) => {
            replace({
                regex, replacement, paths: paths.map((p) => `${sourcePath}/${p}`), recursive: false, silent: true,
            });
        });
    }

    if (isNewlyCreated && copyToSource) {
        Object.entries(copyToSource).forEach(([key, value]) => {
            fs.copyFileSync(`${state.config.paths.project}/${key}`, `${sourcePath}/${value}`);
        });
    }

    buildLib(targetParams);

    if (copyToDist) {
        const targets = getBuildTargets(targetParams);
        Object.entries(copyToDist).forEach(([key, value]) => {
            const values = [];
            if (Array.isArray(value)) {
                values.push(...value);
            } else {
                values.push(value);
            }
            values.forEach(v => {
                targets.forEach(target => {
                    const assetPath = `${state.config.paths.output}/prebuilt/${target.path}/${v}`;
                    if (!fs.existsSync(assetPath)) {
                        fs.copyFileSync(`${state.config.paths.project}/${key}`, assetPath);
                    }
                });
            });
        });
    }
}

async function build(targetParams) {
    buildLib(targetParams);
    createWasmJs(targetParams);
}

function buildLib(targetParams) {
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

    if (fs.existsSync(`${state.config.paths.output}/prebuilt`)) {
        const distCmakeContent = fs.readFileSync(`${state.config.paths.cli}/assets/cmake/dist.cmake`, { encoding: 'utf8', flag: 'r' })
            .replace('___PROJECT_NAME___', state.config.general.name)
            .replace('___PROJECT_HOST___', targets.map((t) => t.path).join(';'))
            .replace('___PROJECT_LIBS___', state.config.export.libName.join(';'));
        fs.writeFileSync(`${state.config.paths.output}/prebuilt/CMakeLists.txt`, distCmakeContent);
    }
}

async function createWasmJs(targetParams) {
    if (state.config.export.bundle === false) {
        return;
    }
    const targets = getFilteredBuildTargets(targetParams, { platform: 'wasm' });
    if (targets.length === 0) {
        return;
    }
    let headers = [];
    state.config.paths.header.forEach((headerPath) => {
        headers.push(findFiles('**/*.h', { cwd: headerPath }));
    });
    headers = headers.filter((path) => !!path.toString()).flat();

    const bridges = [];
    headers.forEach((header) => {
        const bridgePath = createBridgeFile(header);
        bridges.push(bridgePath);
    });

    const opt = {
        buildSource: false,
        nativeGlob: [
            `${state.config.paths.cli}/assets/cpp-runtime/commonBridges.cpp`,
            ...bridges,
        ],
    };

    for (const target of targets) {
        if (fs.existsSync(`${state.config.paths.output}/${target.jsName}`) && fs.existsSync(`${state.config.paths.output}/${target.wasmName}`)) {
            logger.cachedStep(target, 'wasm+js');
            continue;
        }
        createLib(target, 'Bridge', opt);
        await buildWasm(target);

        fs.rmSync(`${state.config.paths.output}/data`, { recursive: true, force: true });
        if (fs.existsSync(`${state.config.paths.build}/data`)) {
            fs.renameSync(`${state.config.paths.build}/data`, `${state.config.paths.output}/data`);
        }

        fs.copyFileSync(`${state.config.paths.build}/${target.jsName}`, `${state.config.paths.output}/${target.jsName}`);
        fs.copyFileSync(`${state.config.paths.build}/${target.wasmName}`, `${state.config.paths.output}/${target.wasmName}`);
        if (fs.existsSync(`${state.config.paths.build}/${target.dataTxtName}`)) {
            fs.copyFileSync(`${state.config.paths.build}/${target.dataTxtName}`, `${state.config.paths.output}/${target.dataTxtName}`);
        }
    }
}

function createListParser(validList) {
    return (value, previous) => {
        const items = value.split(',').map(item => item.trim());
        for (const item of items) {
            if (!validList.includes(item)) {
                throw new Error(`Invalid value: "${item}". Allowed values: ${validList.join(', ')}`);
            }
        }
        return previous ? previous.concat(items) : items;
    };
}
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
import { getBuildTargets, getFilteredBuildTargets } from './actions/target.js';

import downloadAndExtractFile from './utils/downloadAndExtractFile.js';
import writeJson from './utils/writeJson.js';
import systemKeys from './utils/systemKeys.js';
import { getDockerImage } from './utils/pullDockerImage.js';
import { getContentHash } from './utils/hash.js';
import findFiles from './utils/findFiles.js';

const packageJSON = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));

const program = new Command();

program
    .name('cppjs')
    .description('Compile C++ files to WebAssembly and native platforms.')
    .version(packageJSON.version)
    .showHelpAfterError();

const commandBuild = program.command('build')
    .description('compile the project that was set up using Cpp.js')
    .addOption(new Option('-p, --platform <platform>', 'target platform').default('all').choices(['all', 'wasm', 'android', 'ios']))
    .addOption(new Option('-a, --arch <arch>', 'target architecture').default('all').choices(['all', 'wasm32', 'wasm64', 'x86_64', 'arm64-v8a', 'iphoneos', 'iphonesimulator']))
    .addOption(new Option('-r, --runtime <runtime>', 'target runtime').default('all').choices(['all', 'st', 'mt']))
    .addOption(new Option('-b, --build-type <buildType>', 'target build type').default('release').choices(['all', 'release', 'debug']))
    .addOption(new Option('-re, --runtime-env <runtimeEnv>', 'target runtime environment').default('all').choices(['all', 'browser', 'node']));

const commandDocker = program.command('docker')
    .description('manage docker');
const commandRun = commandDocker.command('run').description('run docker application');
commandDocker.command('create').description('create docker container');
commandDocker.command('start').description('start docker container');
commandDocker.command('stop').description('stop docker container');
commandDocker.command('delete').description('delete docker container');

const commandConfig = program.command('config')
    .description('manage the Cpp.js configuration files');
commandConfig.command('get').description('get the Cpp.js system configuration');
commandConfig.command('set').description('set the Cpp.js system configuration');
commandConfig.command('delete').description('delete the Cpp.js system configuration');
const commandConfigList = commandConfig.command('list').description('list the Cpp.js configurations')
    .addOption(new Option('-t, --type <type>', 'config type').default('system').choices(['all', 'system', 'project']));
commandConfig.command('keys').description('list all available system configuration keys for Cpp.js');

program.parse(process.argv);

switch (program.args[0]) {
    case 'build': {
        const targetParams = commandBuild.opts();
        if (state.config.build.withBuildConfig) {
            buildExternal(targetParams);
        } else {
            build(targetParams);
        }
        break;
    }
    case 'docker': {
        switch (program.args[1]) {
            case 'run': {
                const [programName, ...params] = commandRun.args;
                run(programName, params);
                break;
            }
            case 'create': {
                const args = [
                    'run',
                    '-dit',
                    '--name',
                    `${getDockerImage()}-${getContentHash(state.config.paths.base)}`.replace('/', '-').replace(':', '-'),
                    '-v', `${state.config.paths.base}:/tmp/cppjs/live`,
                    getDockerImage(),
                    'bash',
                ];
                try {
                    execFileSync('docker', args, { stdio: 'inherit' });
                } catch (e) {
                    console.error('An error occurred while running the application. Please check the logs for more details.');
                    process.exit();
                }
                break;
            }
            case 'start': {
                const args = [
                    'start',
                    `${getDockerImage()}-${getContentHash(state.config.paths.base)}`.replace('/', '-').replace(':', '-'),
                ];
                try {
                    execFileSync('docker', args, { stdio: 'inherit' });
                } catch (e) {
                    console.error('An error occurred while running the application. Please check the logs for more details.');
                    process.exit();
                }
                break;
            }
            case 'stop': {
                const args = [
                    'stop',
                    `${getDockerImage()}-${getContentHash(state.config.paths.base)}`.replace('/', '-').replace(':', '-'),
                ];
                try {
                    execFileSync('docker', args, { stdio: 'inherit' });
                } catch (e) {
                    console.error('An error occurred while running the application. Please check the logs for more details.');
                    process.exit();
                }
                break;
            }
            case 'delete': {
                const args = [
                    'rm',
                    `${getDockerImage()}-${getContentHash(state.config.paths.base)}`.replace('/', '-').replace(':', '-'),
                ];
                try {
                    execFileSync('docker', args, { stdio: 'inherit' });
                } catch (e) {
                    console.error('An error occurred while running the application. Please check the logs for more details.');
                    process.exit();
                }
                break;
            }
            default:
        }
        break;
    }
    case 'config': {
        switch (program.args[1]) {
            case 'get':
                getSystemConfig(program.args[2]);
                break;
            case 'set':
                setSystemConfig(program.args[2], program.args[3]);
                break;
            case 'delete':
                deleteSystemConfig(program.args[2]);
                break;
            case 'list':
                listSystemConfig(commandConfigList.opts().type);
                break;
            case 'keys':
                listSystemKeys();
                break;
            default:
                break;
        }
        break;
    }
    default:
        break;
}

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
        const targetPath = `${state.config.paths.output}/prebuilt/${targetParams.platform}-${targetParams.arch}-${targetParams.runtime}-${targetParams.buildType}`;
        Object.entries(copyToDist).forEach(([key, value]) => {
            const values = [];
            if (Array.isArray(value)) {
                values.push(...value);
            } else {
                values.push(value);
            }
            values.forEach(v => {
                const assetPath = `${targetPath}/${v}`;
                if (!fs.existsSync(assetPath)) {
                    fs.copyFileSync(`${state.config.paths.project}/${key}`, assetPath);
                }
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
            console.log(`${state.config.general.name} is already compiled to ${target.path} architecture.`);
        }
    });

    if (isChanged && fs.existsSync(`${state.config.paths.build}/Source-Release/prebuilt`)) {
        fs.cpSync(`${state.config.paths.build}/Source-Release/prebuilt`, `${state.config.paths.output}/prebuilt`, { recursive: true, dereference: true });
    }
    if (isChanged && fs.existsSync(`${state.config.paths.build}/Source-Debug/prebuilt`)) {
        fs.cpSync(`${state.config.paths.build}/Source-Debug/prebuilt`, `${state.config.paths.output}/prebuilt`, { recursive: true, dereference: true });
    }

    createXCFramework();

    const distCmakeContent = fs.readFileSync(`${state.config.paths.cli}/assets/dist.cmake`, { encoding: 'utf8', flag: 'r' })
        .replace('___PROJECT_NAME___', state.config.general.name)
        .replace('___PROJECT_HOST___', targets.map((t) => t.path).join(';'))
        .replace('___PROJECT_LIBS___', state.config.export.libName.join(';'));
    fs.writeFileSync(`${state.config.paths.output}/prebuilt/CMakeLists.txt`, distCmakeContent);
}

async function createWasmJs(targetParams) {
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
            `${state.config.paths.cli}/assets/commonBridges.cpp`,
            ...bridges,
        ],
    };

    for (const target of targets) {
        if (fs.existsSync(`${state.config.paths.output}/${target.jsName}`) && fs.existsSync(`${state.config.paths.output}/${target.wasmName}`)) {
            console.log(`${state.config.general.name} wasm is already compiled to ${target.path} ${target.runtimeEnv || ''} architecture.`);
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

#!/usr/bin/env node

import fs from 'node:fs';
import { Command, Option } from 'commander';
import glob from 'glob';
import upath from 'upath';
import replace from 'replace';

import { state } from './index.js';
import createBridgeFile from './actions/createInterface.js';
import createLib from './actions/createLib.js';
import buildWasm from './actions/buildWasm.js';
import createXCFramework from './actions/createXCFramework.js';
import runCppjsApp from './actions/run.js';
import downloadAndExtractFile from './utils/downloadAndExtractFile.js';
import writeJson from './utils/writeJson.js';

const packageJSON = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));

const program = new Command();

program
    .name('cppjs')
    .description('Compile C++ files to WebAssembly and native platforms.')
    .version(packageJSON.version)
    .showHelpAfterError();

const commandBuild = program.command('build')
    .description('compile the project that was set up using Cpp.js')
    .addOption(new Option('-p, --platform <platform>', 'target platform').default('All').choices(['All', 'WebAssembly', 'Android', 'iOS']));

const commandRun = program.command('run')
    .description('run docker application');

const commandConfig = program.command('config')
    .description('Manage the cpp.js configuration files');

commandConfig.command('get').description('get cpp.js system configuration');
commandConfig.command('set').description('set cpp.js system configuration');
commandConfig.command('delete').description('delete cpp.js system configuration');
const commandConfigList = commandConfig.command('list').description('list cpp.js configuration')
    .addOption(new Option('-t, --type <type>', 'config type').default('all').choices(['all', 'system', 'project']));

const commandPostInstall = program.command('postinstall')
    .description('prepare the required packages for Cpp.js after installation');

program.parse(process.argv);

switch (program.args[0]) {
    case 'build': {
        const { platform } = commandBuild.opts();
        if (state.config.build) {
            buildExternal(platform);
        } else {
            build(platform);
        }
        break;
    }
    case 'run': {
        const [programName, ...params] = commandRun.args;
        run(programName, params);
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
            default:
                break;
        }
        break;
    }
    case 'postinstall': {
        postInstall();
        break;
    }
    default:
        break;
}

function getSystemConfig(key) {
    console.log(state.config.system[key]);
}

function setSystemConfig(key, value) {
    state.config.system[key] = value;
    writeJson(state.config.paths.systemConfig, state.config.system);
}

function deleteSystemConfig(key) {
    delete state.config.system[key];
    writeJson(state.config.paths.systemConfig, state.config.system);
}

function listSystemConfig(type) {
    const { system: systemConfig, ...projectConfig } = state.config;
    if (type === 'all' || type === 'system') {
        console.log('System Configuration');
        console.log(JSON.stringify(systemConfig, null, 2));
    }

    if (type === 'all') {
        console.log('');
    }

    if (type === 'all' || type === 'project') {
        console.log('Project Configuration');
        console.log(JSON.stringify(projectConfig, null, 2));
    }
}

function postInstall() {
    const projectPath = process.env.PWD;
    const isDarwin = process.platform === 'darwin';
    if (
        !isDarwin
        || (
            !fs.existsSync(`${projectPath}/cppjs.config.js`)
            && !fs.existsSync(`${projectPath}/cppjs.config.cjs`)
            && !fs.existsSync(`${projectPath}/cppjs.config.mjs`)
        )
    ) {
        return;
    }

    const name = state?.config?.general?.name;
    let dist = state?.config?.paths?.output;
    dist = dist ? upath.relative(projectPath, dist) : null;

    if (!name || !dist) {
        return;
    }

    state?.config?.export?.libName?.forEach((fileName) => {
        if (fs.existsSync(`${projectPath}/${fileName}.xcframework`) || !fs.existsSync(`${dist}/prebuilt/${fileName}.xcframework`)) {
            return;
        }
        fs.symlinkSync(`${dist}/prebuilt/${fileName}.xcframework`, `${projectPath}/${fileName}.xcframework`);
    });
}

function run(programName, params) {
    runCppjsApp(programName, params, null, null, { console: true });
}

async function buildExternal(platform) {
    const version = state.config.package.nativeVersion;
    if (!version) {
        console.error('no version found!');
        return;
    }

    const { getURL, replaceList, copyToSource } = state.config.build;
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

    await buildLib(platform);
}

async function build(platform) {
    buildLib(platform);
    if (platform === 'WebAssembly' || platform === 'All') {
        createWasmJs();
    }
}

async function buildLib(platform) {
    state.platforms[platform].forEach((p) => {
        if (!fs.existsSync(`${state.config.paths.output}/prebuilt/${p}/lib`)) {
            createLib(p, 'Source', { isProd: true, buildSource: true });
        } else {
            console.log(`${state.config.general.name} is already compiled to ${p} architecture.`);
        }
    });

    fs.cpSync(`${state.config.paths.build}/Source-Release/prebuilt`, `${state.config.paths.output}/prebuilt`, { recursive: true, dereference: true });

    createXCFramework();

    const distCmakeContent = fs.readFileSync(`${state.config.paths.cli}/assets/dist.cmake`, { encoding: 'utf8', flag: 'r' })
        .replace('___PROJECT_NAME___', state.config.general.name).replace('___PROJECT_LIBS___', state.config.export.libName.join(';'));
    fs.writeFileSync(`${state.config.paths.output}/prebuilt/CMakeLists.txt`, distCmakeContent);
}

async function createWasmJs() {
    let headers = [];
    state.config.paths.header.forEach((headerPath) => {
        headers.push(glob.sync('**/*.h', { absolute: true, cwd: headerPath }));
    });
    headers = headers.filter((path) => !!path.toString()).flat();

    const bridges = [];
    headers.forEach((header) => {
        const bridgePath = createBridgeFile(header);
        bridges.push(bridgePath);
    });

    const opt = {
        isProd: true,
        buildSource: false,
        nativeGlob: bridges,
    };
    createLib('Emscripten-x86_64', 'Bridge', opt);

    await buildWasm('browser', true);
    await buildWasm('node', true);

    fs.rmSync(`${state.config.paths.output}/data`, { recursive: true, force: true });
    if (fs.existsSync(`${state.config.paths.build}/data`)) {
        fs.renameSync(`${state.config.paths.build}/data`, `${state.config.paths.output}/data`);
    }

    fs.copyFileSync(`${state.config.paths.build}/${state.config.general.name}.node.js`, `${state.config.paths.output}/${state.config.general.name}.node.js`);
    fs.copyFileSync(`${state.config.paths.build}/${state.config.general.name}.browser.js`, `${state.config.paths.output}/${state.config.general.name}.browser.js`);
    fs.copyFileSync(`${state.config.paths.build}/${state.config.general.name}.wasm`, `${state.config.paths.output}/${state.config.general.name}.wasm`);
    if (fs.existsSync(`${state.config.paths.build}/${state.config.general.name}.data.txt`)) {
        fs.copyFileSync(`${state.config.paths.build}/${state.config.general.name}.data.txt`, `${state.config.paths.output}/${state.config.general.name}.data.txt`);
    }
}

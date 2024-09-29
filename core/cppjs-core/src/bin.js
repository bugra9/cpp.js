#!/usr/bin/env node

import { Command, Option } from 'commander';
import fs from 'fs';
import glob from 'glob';
import { createDir } from './utils/createTempDir.js';
import getPathInfo from './utils/getPathInfo.js';

import CppjsCompiler from './index.js';

const packageJSON = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));

const program = new Command();

program
    .name('cpp.js')
    .description('Compile C++ files to WebAssembly and native platforms.')
    .version(packageJSON.version)
    .showHelpAfterError();

const commandBuild = program.command('build')
    .description('compile the project that was set up using Cpp.js')
    .addOption(new Option('-p, --platform <platform>', 'target platform').default('all').choices(['all', 'wasm', 'android', 'ios']));

const commandRun = program.command('run')
    .description('run docker application');

const commandPostInstall = program.command('postinstall')
    .description('prepare the required packages for Cpp.js after installation');

program.parse(process.argv);

switch (program.args[0]) {
    case 'build': {
        const { platform } = commandBuild.opts();
        build(platform);
        break;
    }
    case 'run': {
        const [programName, ...params] = commandRun.args;
        run(programName, params);
        break;
    }
    case 'postinstall': {
        postInstall();
        break;
    }
    default:
        break;
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

    const cppjs = new CppjsCompiler();
    const name = cppjs?.config?.general?.name;
    let dist = cppjs?.config?.paths?.output;
    dist = dist ? getPathInfo(dist, projectPath).relative : null;

    if (!name || !dist) {
        return;
    }

    cppjs?.config?.export?.libName?.forEach((fileName) => {
        if (fs.existsSync(`${projectPath}/${fileName}.xcframework`) || !fs.existsSync(`${dist}/prebuilt/${fileName}.xcframework`)) {
            return;
        }
        fs.symlinkSync(`${dist}/prebuilt/${fileName}.xcframework`, `${projectPath}/${fileName}.xcframework`);
    });
}

function run(programName, params) {
    const compiler = new CppjsCompiler();
    compiler.run(programName, params, { console: true });
}

function build(platform) {
    const compiler2 = new CppjsCompiler();

    const modules = [];
    compiler2.config.paths.module.forEach((modulePath) => {
        modules.push(...glob.sync('**/*.i', { absolute: true, cwd: modulePath }));
        modules.push(...glob.sync('*.i', { absolute: true, cwd: modulePath }));
    });

    if (platform === 'all' || platform === 'wasm') {
        if (!fs.existsSync(`${compiler2.config.paths.output}/prebuilt/Emscripten-x86_64`)) {
            buildWasm();
            modules.forEach((modulePath) => {
                const fileName = modulePath.split('/').at(-1);
                createDir('prebuilt/Emscripten-x86_64/swig', compiler2.config.paths.output);
                fs.copyFileSync(modulePath, `${compiler2.config.paths.output}/prebuilt/Emscripten-x86_64/swig/${fileName}`);
            });
        }
    }

    if (platform === 'wasm') return;
    const platforms = {
        all: ['Android-arm64-v8a', 'iOS-iphoneos', 'iOS-iphonesimulator'],
        android: ['Android-arm64-v8a'],
        ios: ['iOS-iphoneos', 'iOS-iphonesimulator'],
    };
    platforms[platform].forEach((p) => {
        if (!fs.existsSync(`${compiler2.config.paths.output}/prebuilt/${p}`)) {
            const compiler = new CppjsCompiler(p);
            compiler.createLib();
            modules.forEach((modulePath) => {
                const fileName = modulePath.split('/').at(-1);
                createDir(`prebuilt/${p}/swig`, compiler2.config.paths.output);
                fs.copyFileSync(modulePath, `${compiler2.config.paths.output}/prebuilt/${p}/swig/${fileName}`);
            });
        }
    });
    if (platform === 'all' || platform === 'ios') {
        compiler2.finishBuild();
    }

    const distCmakeContent = fs.readFileSync(`${compiler2.config.paths.cli}/assets/dist.cmake`, { encoding: 'utf8', flag: 'r' })
        .replace('___PROJECT_NAME___', compiler2.config.general.name).replace('___PROJECT_LIBS___', compiler2.config.export.libName.join(';'));
    fs.writeFileSync(`${compiler2.config.paths.output}/prebuilt/CMakeLists.txt`, distCmakeContent);
}

async function buildWasm() {
    let headers = [];

    const compiler = new CppjsCompiler();
    compiler.config.paths.header.forEach((headerPath) => {
        headers.push(glob.sync('**/*.h', { absolute: true, cwd: headerPath }));
    });
    headers = headers.filter((path) => !!path.toString()).flat();

    headers.forEach((header) => {
        compiler.findOrCreateInterfaceFile(header);
    });

    compiler.createBridge();
    await compiler.createWasm({ cc: ['-O3'] });
    createDir('prebuilt/Emscripten-x86_64/lib', compiler.config.paths.output);

    fs.renameSync(`${compiler.config.paths.temp}/lib/lib${compiler.config.general.name}.a`, `${compiler.config.paths.output}/prebuilt/Emscripten-x86_64/lib/lib${compiler.config.general.name}.a`);
    fs.renameSync(`${compiler.config.paths.temp}/include/`, `${compiler.config.paths.output}/prebuilt/Emscripten-x86_64/include`);

    fs.rmSync(`${compiler.config.paths.output}/data`, { recursive: true, force: true });
    if (fs.existsSync(`${compiler.config.paths.temp}/data`)) {
        fs.renameSync(`${compiler.config.paths.temp}/data`, `${compiler.config.paths.output}/data`);
    }

    fs.copyFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.node.js`, `${compiler.config.paths.output}/${compiler.config.general.name}.node.js`);
    fs.copyFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.browser.js`, `${compiler.config.paths.output}/${compiler.config.general.name}.browser.js`);
    fs.copyFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.wasm`, `${compiler.config.paths.output}/${compiler.config.general.name}.wasm`);
    if (fs.existsSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.data.txt`)) {
        fs.copyFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.data.txt`, `${compiler.config.paths.output}/${compiler.config.general.name}.data.txt`);
    }

    fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
}

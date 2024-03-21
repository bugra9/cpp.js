#!/usr/bin/env node

import { Command, Argument } from 'commander';
import fs from 'fs';
import glob from 'glob';
import { createDir } from './utils/createTempDir.js';

import CppjsCompiler from './index.js';

const packageJSON = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));

const program = new Command();

program
    .name('cpp.js')
    .description('Compile c++ files to webassembly.')
    .version(packageJSON.version)
    .showHelpAfterError();

const commandGenerate = program.command('generate')
    .description('Generate app or lib.')
    .addArgument(new Argument('<type>', 'Generation type').choices(['app', 'lib']))
    .option('-b, --base <base>', 'base path')
    .option('-p, --platform <platform>', 'platform (wasm)', 'wasm', ['wasm'])
    .option('-o, --output <string>', 'Output path');

const commandRun = program.command('run')
    .description('Run docker application');

program.parse(process.argv);

switch (program.args[0]) {
    case 'generate': {
        const type = commandGenerate.args[0];
        const { output, platform, base } = commandGenerate.opts();
        generate(type, platform, output, base);
        break;
    }
    case 'run': {
        const [programName, ...params] = commandRun.args;
        run(programName, params);
        break;
    }
    default:
        break;
}

function run(programName, params) {
    const compiler = new CppjsCompiler();
    compiler.run(programName, params);
}

function generate(type, platform, output, base) {
    if (type === 'lib') generateLib(platform, output, base);
}

// eslint-disable-next-line no-unused-vars
function generateLib(platform, output, base) {
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
    compiler.createWasm({ cc: ['-O3'] });
    createDir('prebuilt', compiler.config.paths.output);
    fs.copyFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.js`, `${compiler.config.paths.output}/${compiler.config.general.name}.js`);
    fs.copyFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.wasm`, `${compiler.config.paths.output}/${compiler.config.general.name}.wasm`);
    fs.rmSync(`${compiler.config.paths.output}/prebuilt`, { recursive: true, force: true });
    fs.renameSync(`${compiler.config.paths.temp}/prebuilt`, `${compiler.config.paths.output}/prebuilt`);

    const distCmakeContent = fs.readFileSync(`${compiler.config.paths.cli}/assets/dist.cmake`, { encoding: 'utf8', flag: 'r' })
        .replace('___PROJECT_NAME___', compiler.config.general.name).replace('___PROJECT_LIBS___', compiler.config.export.libName.join(';'));
    fs.writeFileSync(`${compiler.config.paths.output}/prebuilt/CMakeLists.txt`, distCmakeContent);
    fs.rmSync(compiler.config.paths.temp, { recursive: true, force: true });
}

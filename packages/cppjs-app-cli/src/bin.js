#!/usr/bin/env node

import packageJSON from '../package.json' assert { type: 'json' };
import { Command, Argument } from 'commander';

import { createBridge, findCMakeListsFile, findOrCreateInterfaceFile, createWasm } from './index.js';
import { createTempDir } from './utils.js';

const program = new Command();
    program
    .name('cpp.js')
    .description('Compile c++ files to webassembly.')
    .version(packageJSON.version)
    .showHelpAfterError();

    program.addArgument(new Argument('<type>', 'Creation type').choices(['bridge', 'wasm', 'all']));
    program.argument('<input>', 'Input paths');
    program
        .option('-o, --output <string>', 'Output path');

program.parse(process.argv);
const options = program.opts();
const args = program.args;

const [type, ...inputs]= args;
main(type, inputs);

async function main(type, inputs, output = createTempDir('a'+Math.random())) {
    if (type === 'bridge' || type === 'all') {
        const interfaceFile = findOrCreateInterfaceFile(process.cwd()+'/'+inputs[0], output);
        createBridge(interfaceFile, output);
    }

    if (type === 'wasm' || type === 'all') {
        const cMakeListsFilePath = findCMakeListsFile();
        createWasm(cMakeListsFilePath, output, output, { cc: ['-O3'] });
    }
    console.log('output: ' + output);
}

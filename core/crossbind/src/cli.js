#!/usr/bin/env node

import { addSystemCommands, createProgram, handleFatal } from './program.js';

// bin.js loads the project before it reads the command line, which fails outside a project; these commands need none.
const program = createProgram();
addSystemCommands(program);
const withoutProject = [...program.commands.map((command) => command.name()), '-V', '--version'];

if (withoutProject.includes(process.argv[2])) {
    await program.parseAsync().catch(handleFatal);
} else {
    await import('./bin.js');
}

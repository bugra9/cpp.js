#!/usr/bin/env node
/* eslint-disable no-plusplus */
/* eslint-disable no-console */
import fs from 'node:fs';
import fse from 'fs-extra';
import path from 'node:path';
import {
    bold, cyan, gray, green,
} from 'kleur/colors';
import prompts from 'prompts';
import { pkgManager, getPath } from './utils.js';
import samples from './samples.js';

const disclaimer = `
${bold(cyan('Welcome to Cpp.js!'))}
`;

const { version } = JSON.parse(fs.readFileSync(getPath('package.json'), 'utf-8'));

async function main() {
    console.log(gray(`\ncreate-cppjs version ${version}`));
    console.log(disclaimer);

    const { name } = await prompts({
        type: 'text',
        name: 'name',
        message: 'Project Name',
        initial: 'sample',
        validate: (value) => value && value.length > 0,
    }, {
        onCancel: () => {
            process.exit(1);
        },
    });

    let cwd = process.argv[2] || '.';

    if (cwd === '.') {
        const { dir } = await prompts({
            type: 'text',
            name: 'dir',
            message: 'Where should we create your project?\n  (leave blank to use current directory)',
            initial: name,
            validate: (value) => value && value.length > 0,
        }, {
            onCancel: () => {
                process.exit(1);
            },
        });

        if (dir) {
            cwd = dir;
        }
    }

    if (fs.existsSync(cwd)) {
        if (fs.readdirSync(cwd).length > 0) {
            const response = await prompts({
                type: 'confirm',
                name: 'value',
                message: 'Directory not empty. Do you want to continue?',
                initial: false,
            }, {
                onCancel: () => {
                    process.exit(1);
                },
            });

            if (!response.value) {
                process.exit(1);
            }
        }
    }

    const { templateType: selectedType } = await prompts({
        type: 'select',
        name: 'templateType',
        message: 'Select a type:',
        initial: false,
        choices: Object.keys(samples).map((k) => ({ title: k, value: k })),
    }, {
        onCancel: () => {
            process.exit(1);
        },
    });

    const { appPlatformType: selectedPlatform } = await prompts({
        type: 'select',
        name: 'appPlatformType',
        message: samples[selectedType].Questions[0],
        initial: false,
        choices: Object.keys(samples[selectedType]).slice(1).map((k) => ({ title: k, value: k })),
    }, {
        onCancel: () => {
            process.exit(1);
        },
    });

    let selectedBundler = null;
    if (!samples[selectedType][selectedPlatform].path) {
        const result = await prompts({
            type: 'select',
            name: 'bundler',
            message: samples[selectedType].Questions[1],
            initial: false,
            choices: Object.keys(samples[selectedType][selectedPlatform]).map((k) => ({ title: k, value: k })),
        }, {
            onCancel: () => {
                process.exit(1);
            },
        });
        selectedBundler = result.bundler;
    }

    let templatePath;
    if (selectedBundler) {
        templatePath = samples[selectedType][selectedPlatform][selectedBundler].path;
    } else {
        templatePath = samples[selectedType][selectedPlatform].path;
    }

    fse.copySync(templatePath, cwd, { overwrite: true });

    const packageJsonFilePath = `${cwd}/package.json`;
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFilePath, 'utf-8'));
    packageJson.name = selectedType === 'app' ? name : `cppjs-lib-${name}`;
    fs.writeFileSync(packageJsonFilePath, JSON.stringify(packageJson, null, 2));

    console.log(bold(green('\nYour project is ready!')));

    console.log('\nNext steps:');
    let i = 1;

    const relative = path.relative(process.cwd(), cwd);
    if (relative !== '') {
        console.log(`  ${i++}: ${bold(cyan(`cd ${relative}`))}`);
    }

    console.log(`  ${i++}: ${bold(cyan(`${pkgManager} install`))}`);
    if (selectedType === 'app') {
        console.log(`  ${i++}: ${bold(cyan(`${pkgManager} run dev`))}`);
    }
    if (selectedType === 'lib') {
        console.log(`  ${i++}: ${bold(cyan(`${pkgManager} run build`))}`);
    }

    console.log(`\nTo close the dev server, hit ${bold(cyan('Ctrl-C'))}`);
}

main();

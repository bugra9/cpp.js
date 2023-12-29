#!/usr/bin/env node
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import samplePaths from 'cppjs-samples';
import { bold, cyan, gray, green } from 'kleur/colors';
import prompts from 'prompts';
import { pkgManager, getPath, getTitle } from './utils.js'

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
        validate: value => value && value.length > 0
    }, {
        onCancel: () => {
            process.exit(1);
        }
    });

	let cwd = process.argv[2] || '.';

	if (cwd === '.') {
		const { dir } = await prompts({
				type: 'text',
				name: 'dir',
				message: 'Where should we create your project?\n  (leave blank to use current directory)',
                initial: name,
                validate: value => value && value.length > 0
			}, {
            onCancel: () => {
                process.exit(1);
            }
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
                }
            });

			if (!response.value) {
				process.exit(1);
			}
		}
	}

    const templates = {}
    samplePaths.forEach((dir) => {
        const dirName = dir.split('/').pop();
        const [_, __, type, platform, bundler] = dirName.split('-');
        if (!templates[type]) templates[type] = {};
        if (!templates[type][platform]) templates[type][platform] = {};
        if (bundler) {
            if (!templates[type][platform][bundler]) templates[type][platform][bundler] = {};
            templates[type][platform][bundler] = dir;
        } else {
            templates[type][platform] = dir;
        }
    })

    const {templateType: selectedType} = await prompts({
            type: 'select',
            name: 'templateType',
            message: 'Which Cpp.js template type?',
            initial: false,
            choices: Object.keys(templates).map(k => ({ title: getTitle(k), value: k })),
        }, {
        onCancel: () => {
            process.exit(1);
        }
    });

    const {appPlatformType: selectedPlatform} = await prompts({
            type: 'select',
            name: 'appPlatformType',
            message: 'Which framework?',
            initial: false,
            choices: Object.keys(templates[selectedType]).map(k => ({ title: getTitle(k), value: k })),
        }, {
        onCancel: () => {
            process.exit(1);
        }
    });

    let selectedBundler = null;
    if (typeof templates[selectedType][selectedPlatform] === 'object') {
        const result = await prompts({
                type: 'select',
                name: 'bundler',
                message: `Which tool?`,
                initial: false,
                choices: Object.keys(templates[selectedType][selectedPlatform]).map(k => ({ title: getTitle(k), value: k })),
            }, {
            onCancel: () => {
                process.exit(1);
            }
        });
        selectedBundler = result.bundler
    }

    let templatePath;
    if (selectedBundler) {
        templatePath = templates[selectedType][selectedPlatform][selectedBundler];
    } else {
        templatePath = templates[selectedType][selectedPlatform];
    }

    fse.copySync(templatePath, cwd, { overwrite: true });

    const packageJsonFilePath = `${cwd}/package.json`;
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFilePath, 'utf-8'));
    packageJson.name = selectedType === 'app' ? name : `cppjs-lib-${name}-${selectedPlatform}`;
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

	console.log(`\nTo close the dev server, hit ${bold(cyan('Ctrl-C'))}`);;
}

main();

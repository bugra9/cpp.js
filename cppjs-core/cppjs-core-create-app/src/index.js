#!/usr/bin/env node
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { styleText } from 'node:util';
import * as p from '@clack/prompts';
import { pkgManager } from './utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(PKG_ROOT, 'templates');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const { version } = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8'));

const exitOnCancel = (value) => {
    if (p.isCancel(value)) {
        p.cancel('Cancelled.');
        process.exit(0);
    }
    return value;
};

const unique = (arr) => [...new Set(arr)];

async function pickTemplate(presetGroup, presetFirst, presetSecond) {
    const groups = unique(MANIFEST.map((m) => m.group));
    const group = presetGroup || exitOnCancel(await p.select({
        message: 'What kind of project?',
        options: groups.map((g) => ({ value: g, label: g })),
    }));
    const inGroup = MANIFEST.filter((m) => m.group === group);

    // "first" = framework if present, else label (Library/Cloud have no framework level).
    const firstChoices = unique(inGroup.map((m) => m.framework ?? m.label));
    let first = presetFirst;
    if (!first) {
        first = firstChoices.length === 1
            ? firstChoices[0]
            : exitOnCancel(await p.select({
                message: 'Choose framework / variant',
                options: firstChoices.map((c) => ({ value: c, label: c })),
            }));
    }
    const inFirst = inGroup.filter((m) => (m.framework ?? m.label) === first);
    if (inFirst.length === 1) return inFirst[0];

    const second = presetSecond || exitOnCancel(await p.select({
        message: 'Choose bundler / ecosystem',
        options: inFirst.map((m) => ({ value: m.label, label: m.label })),
    }));
    const entry = inFirst.find((m) => m.label === second);
    if (!entry) {
        p.cancel(`Unknown template: ${group} / ${first} / ${second}`);
        process.exit(1);
    }
    return entry;
}

async function ensureEmpty(dir) {
    if (!fs.existsSync(dir) || fs.readdirSync(dir).length === 0) return;
    const cont = exitOnCancel(await p.confirm({
        message: `Directory not empty (${dir}). Continue?`,
        initialValue: false,
    }));
    if (!cont) { p.cancel('Cancelled.'); process.exit(0); }
}

async function main() {
    p.intro(styleText(['cyan', 'bold'], `create-cpp.js v${version}`));

    const [, , argName, argGroup, argFirst, argSecond] = process.argv;

    const name = argName || exitOnCancel(await p.text({
        message: 'Project name',
        placeholder: 'sample',
        initialValue: 'sample',
        validate: (v) => ((!v || v.trim().length === 0) ? 'Required' : undefined),
    }));

    const dirArg = argName || exitOnCancel(await p.text({
        message: 'Where should we create your project?',
        placeholder: name,
        initialValue: name,
        validate: (v) => ((!v || v.trim().length === 0) ? 'Required' : undefined),
    }));
    const cwd = path.resolve(process.cwd(), dirArg);

    await ensureEmpty(cwd);

    const entry = await pickTemplate(argGroup, argFirst, argSecond);
    const src = path.join(TEMPLATES_DIR, entry.key);
    if (!fs.existsSync(src)) {
        p.cancel(`Template missing: ${entry.key} (expected ${src}). Did you publish with prepublishOnly?`);
        process.exit(1);
    }

    const spin = p.spinner();
    spin.start(`Scaffolding ${entry.key}`);
    await fsp.mkdir(cwd, { recursive: true });
    await fsp.cp(src, cwd, { recursive: true });

    const pjPath = path.join(cwd, 'package.json');
    if (fs.existsSync(pjPath)) {
        const pkg = JSON.parse(await fsp.readFile(pjPath, 'utf8'));
        pkg.name = entry.kind === 'lib' ? `cppjs-lib-${name}` : name;
        await fsp.writeFile(pjPath, `${JSON.stringify(pkg, null, 2)}\n`);
    }

    const gradlew = path.join(cwd, 'android', 'gradlew');
    if (fs.existsSync(gradlew)) await fsp.chmod(gradlew, 0o755);

    spin.stop(`Created ${path.relative(process.cwd(), cwd) || '.'}`);

    const steps = [];
    const rel = path.relative(process.cwd(), cwd);
    if (rel) steps.push(`cd ${rel}`);
    steps.push(`${pkgManager} install`);
    if (entry.key === 'mobile-reactnative-expo') steps.push('npx expo prebuild');
    if (entry.kind === 'app') steps.push(`${pkgManager} run dev`);
    if (entry.kind === 'lib') steps.push(`${pkgManager} run build`);

    p.note(steps.map((s, i) => `${i + 1}. ${styleText('cyan', s)}`).join('\n'), 'Next steps');
    p.outro(styleText('green', 'Done!'));
}

main().catch((err) => {
    process.stderr.write(`create-cpp.js failed: ${err.stack || err}\n`);
    process.exit(1);
});

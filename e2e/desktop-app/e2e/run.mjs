import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import config from '../crossbind.config.mjs';

// Opens the app `pnpm build` made, whose page runs the conformance suite and logs its summary last, and closes it
// once the summary is in. With CROSSBIND_APP_PLATFORM=ios the app is an Xcode project, built and opened in the Simulator.
const RUN_TIMEOUT_MS = 300000;
// Shared conformance list: pass must equal run (backreference); skips are explicit lines.
const CONFORMANCE = /^CONFORMANCE (\d+)\/\1\b.*$/m;
const FINISHED = /^(CONFORMANCE .*|CONFORMANCE ERR: .*)$/m;

const root = resolve(import.meta.dirname, '..');
const { name } = config.general;
const isIos = process.env.CROSSBIND_APP_PLATFORM === 'ios';
const env = { CROSSBIND_APP_CONSOLE: '1' };

function missing(file) {
    console.error(`FAIL: ${file} is missing - run \`pnpm build\` first.`);
    process.exit(1);
}

async function open() {
    if (isIos) {
        const project = `${root}/dist/${name}-ios`;
        if (!existsSync(project)) missing(project);
        const { buildForSimulator, openInSimulator } = await import('crossbind');
        return openInSimulator(buildForSimulator(project), { env });
    }
    // A macOS app is a bundle; a Linux app a directory named after its platform and arch.
    const executable = process.platform === 'darwin'
        ? `${root}/dist/${name}.app/Contents/MacOS/${name}`
        : `${root}/dist/${name}-${process.platform}-${process.arch}/${name}`;
    if (!existsSync(executable)) missing(executable);
    return { child: spawn(executable, [], { env: { ...process.env, ...env } }), close: () => {} };
}

let out = '';
const { child: app, close } = await open();

function finish(problem) {
    clearTimeout(timer);
    close();
    app.kill();
    const summary = out.match(CONFORMANCE);
    if (problem || !summary) {
        console.error(`FAIL: ${problem ?? 'the app failed the conformance suite'}:\n${out}`);
        process.exit(1);
    }
    console.log(`ok: ${isIos ? 'ios-simulator' : `${process.platform}-${process.arch}`} app: ${summary[0]}`);
    process.exit(0);
}

const timer = setTimeout(() => finish('the suite did not finish in time'), RUN_TIMEOUT_MS);
app.stdout.on('data', (chunk) => {
    out += chunk;
    if (FINISHED.test(out)) finish();
});
app.stderr.on('data', (chunk) => {
    out += chunk;
    if (FINISHED.test(out)) finish();
});
app.on('exit', (code) => finish(`the app exited with ${code} before the suite finished`));

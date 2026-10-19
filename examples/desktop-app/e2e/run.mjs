import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import config from '../crossbind.config.js';

// Opens the app `pnpm build` made and waits for its page to log what the C++ returned.
const RUN_TIMEOUT_MS = 60000;
const EXPECTED = 'Matrix multiplier with c++ => J₃ * (2*J₃) = 6*J₃';

const root = resolve(import.meta.dirname, '..');
const { name } = config.general;
// A macOS app is a bundle; a Linux app a directory named after its platform and arch.
const executable = process.platform === 'darwin'
    ? `${root}/dist/${name}.app/Contents/MacOS/${name}`
    : `${root}/dist/${name}-${process.platform}-${process.arch}/${name}`;
if (!existsSync(executable)) {
    console.error(`FAIL: ${executable} is missing - run \`pnpm build\` first.`);
    process.exit(1);
}

let out = '';
const app = spawn(executable, [], { env: { ...process.env, CROSSBIND_APP_CONSOLE: '1' } });

function finish(problem) {
    clearTimeout(timer);
    app.kill();
    if (problem) {
        console.error(`FAIL: ${problem}:\n${out}`);
        process.exit(1);
    }
    console.log(`ok: ${EXPECTED}`);
    process.exit(0);
}

const timer = setTimeout(() => finish('the page did not log the result in time'), RUN_TIMEOUT_MS);
const read = (chunk) => {
    out += chunk;
    if (out.includes(EXPECTED)) finish();
};
app.stdout.on('data', read);
app.stderr.on('data', read);
app.on('exit', (code) => finish(`the app exited with ${code} before the page logged the result`));

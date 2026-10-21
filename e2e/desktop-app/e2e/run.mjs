import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import config from '../crossbind.config.mjs';

// Opens the app `pnpm build` made, whose page runs the conformance suite and logs its summary last, and closes it
// once the summary is in. With CROSSBIND_APP_PLATFORM=ios the app is an Xcode project, built and opened in the Simulator,
// and with android a Gradle project, built and opened on the attached device.
const RUN_TIMEOUT_MS = 300000;
// Shared conformance list: pass must equal run (backreference); skips are explicit lines.
const CONFORMANCE = /^CONFORMANCE (\d+)\/\1\b.*$/m;
const FINISHED = /^(CONFORMANCE .*|CONFORMANCE ERR: .*)$/m;

const root = resolve(import.meta.dirname, '..');
const { name } = config.general;
const platform = process.env.CROSSBIND_APP_PLATFORM;
const env = { CROSSBIND_APP_CONSOLE: '1' };

function missing(file) {
    console.error(`FAIL: ${file} is missing - run \`pnpm build\` first.`);
    process.exit(1);
}

// The start of a 256 × 256 PNG, the largest image of a Windows app's icon.
const PNG_256 = Buffer.from('89504e470d0a1a0a0000000d494844520000010000000100', 'hex');

// The build gave the app the icon app.icon names.
function checkIcon() {
    const app = `${root}/dist/${name}`;
    const has = (file, part) => existsSync(file) && (!part || readFileSync(file).includes(part));
    const checks = {
        ios: () => has(`${app}-ios/Assets.xcassets/AppIcon.appiconset/icon.png`),
        android: () => has(`${app}-android/app/src/main/res/mipmap-anydpi/ic_launcher.xml`),
        darwin: () => has(`${app}.app/Contents/Resources/icon.icns`) && has(`${app}.app/Contents/Info.plist`, '<key>CFBundleIconFile</key>'),
        linux: () => has(`${app}-linux-${process.arch}/resources/icon.png`),
        win32: () => has(`${app}-win32-${process.arch}/${name}.exe`, PNG_256),
    };
    // A platform the runner does not open is left to open() to refuse.
    const check = checks[platform ?? process.platform];
    if (check && !check()) {
        console.error(`FAIL: the ${platform ?? process.platform} app has no icon from app.icon.`);
        process.exit(1);
    }
}

async function open() {
    if (platform) {
        const project = `${root}/dist/${name}-${platform}`;
        if (!existsSync(project)) missing(project);
        const { buildForSimulator, openInSimulator, buildApk, openOnDevice } = await import('crossbind');
        return platform === 'ios' ? openInSimulator(buildForSimulator(project), { env }) : openOnDevice(buildApk(project), { env });
    }
    // A macOS app is a bundle; a Linux or Windows app a directory named after its platform and arch.
    const executable = process.platform === 'darwin'
        ? `${root}/dist/${name}.app/Contents/MacOS/${name}`
        : `${root}/dist/${name}-${process.platform}-${process.arch}/${name}${process.platform === 'win32' ? '.exe' : ''}`;
    if (!existsSync(executable)) missing(executable);
    return { child: spawn(executable, [], { env: { ...process.env, ...env } }), close: () => {} };
}

let out = '';
checkIcon();
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
    console.log(`ok: ${platform ?? `${process.platform}-${process.arch}`} app: ${summary[0]}`);
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

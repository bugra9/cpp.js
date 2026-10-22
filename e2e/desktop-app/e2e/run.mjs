import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, realpathSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import config from '../crossbind.config.mjs';
import { LAUNCH_ARGS, LAUNCH_URL, PHONE_URL } from './launch.mjs';
import { UPDATE_PORT, signUpdate } from './updates.mjs';

// Opens the app `pnpm build` made, whose page runs the conformance suite and logs its summary last, and closes it
// once the summary is in. With CROSSBIND_APP_PLATFORM=ios the app is an Xcode project, built and opened in the Simulator,
// and with android a Gradle project, built and opened on the attached device. With --installed a desktop app opens
// from where its installer put it: from its disk image on macOS, and on Linux and Windows from where its Debian package
// or setup program, which the runner ran first, installed it.
const RUN_TIMEOUT_MS = 300000;
// Shared conformance list: pass must equal run (backreference); skips are explicit lines.
const CONFORMANCE = /^CONFORMANCE (\d+)\/\1\b.*$/m;
const FINISHED = /^(CONFORMANCE .*|CONFORMANCE ERR: .*)$/m;
const LAUNCH_AGAIN = /^LAUNCH AGAIN$/m;
const OPEN_LINK = /^OPEN LINK$/m;
// Below the page's wait for the launch or the link, so a launch that stays or an adb that hangs says so.
const ASKED_TIMEOUT_MS = 20000;

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

// The build declared app.urlSchemes where macOS and iOS read them from the app; an Android app is opened with a link,
// and the installers' registrations are checked where they run.
function checkUrlSchemes() {
    const plist = { darwin: `${root}/dist/${name}.app/Contents/Info.plist`, ios: `${root}/dist/${name}-ios/Info.plist` }[platform ?? process.platform];
    if (plist && !(existsSync(plist) && readFileSync(plist, 'utf8').includes(`<string>${config.app.urlSchemes[0]}</string>`))) {
        console.error(`FAIL: the ${platform ?? process.platform} app declares no scheme of app.urlSchemes.`);
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
    const { executable, close } = process.argv.includes('--installed') ? installedApp() : {
        executable: process.platform === 'darwin'
            ? `${root}/dist/${name}.app/Contents/MacOS/${name}`
            : `${root}/dist/${name}-${process.platform}-${process.arch}/${name}${process.platform === 'win32' ? '.exe' : ''}`,
        close: () => {},
    };
    if (!existsSync(executable)) missing(executable);
    // The link, as Windows and Linux hand an app one, which src/main.js asks the app for.
    return { child: spawn(executable, [LAUNCH_URL], { env: { ...process.env, ...env } }), close, executable };
}

// Where the installer put the app: in the disk image, mounted until the run ends, in /usr/bin, or in the user's
// programs.
function installedApp() {
    if (process.platform === 'darwin') {
        const image = `${root}/dist/${name}.dmg`;
        if (!existsSync(image)) missing(image);
        const mount = mkdtempSync(join(tmpdir(), 'crossbind-dmg-'));
        execFileSync('hdiutil', ['attach', '-quiet', '-nobrowse', '-readonly', '-mountpoint', mount, image]);
        const executable = `${mount}/${name}.app/Contents/MacOS/${name}`;
        const close = () => execFileSync('hdiutil', ['detach', '-quiet', '-force', mount]);
        if (!existsSync(executable)) {
            close();
            missing(executable);
        }
        return { executable, close };
    }
    if (process.platform === 'win32') return { executable: join(process.env.LOCALAPPDATA, 'Programs', config.app.name ?? name, `${name}.exe`), close: () => {} };
    return { executable: `/usr/bin/${name}`, close: () => {} };
}

// The update app.updater finds, which src/main.js installs twice: a newer version whose file its signature covers, which
// unpacks to no app, then the same version with that file changed, as one tampered with would be.
function serveUpdates() {
    const target = `${process.platform}-${process.arch}`;
    const file = Buffer.from('an update that unpacks to no app');
    // The app's id: app.id's default, which the e2e app keeps.
    const id = `dev.crossbind.${name}`;
    const manifest = JSON.stringify({ version: '99.0.0', file: 'update.bin', signature: signUpdate(id, target, '99.0.0', file) });
    let downloads = 0;
    const server = createServer((request, response) => {
        if (request.url === `/${target}.update.json`) {
            response.end(manifest);
        } else if (request.url === '/update.bin') {
            downloads += 1;
            response.end(downloads === 1 ? file : Buffer.from('a tampered update'));
        } else {
            response.statusCode = 404;
            response.end();
        }
    });
    return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(UPDATE_PORT, '127.0.0.1', resolve);
    });
}

let out = '';
checkIcon();
checkUrlSchemes();
// A phone's app does not update itself.
if (!platform) await serveUpdates();
const { child: app, close, executable } = await open();
// The adb crossbind opened the Android app with, which opens it with a link as well.
const adb = platform === 'android' ? (await import('crossbind')).adbPath() : undefined;

// The page asks for it once it listens: the app, launched again with LAUNCH_ARGS and the folder it is launched in,
// which the first app does not share, hands them to that app and leaves.
let isLaunchedAgain = false;
let hasLeft = false;
function launchAgain() {
    if (isLaunchedAgain || !executable || !LAUNCH_AGAIN.test(out)) return;
    isLaunchedAgain = true;
    try {
        const cwd = realpathSync.native(join(root, 'dist'));
        const again = spawn(executable, [...LAUNCH_ARGS, cwd], { cwd, env: { ...process.env, ...env }, stdio: ['ignore', 'ignore', 'pipe'] });
        const timeout = setTimeout(() => {
            again.kill();
            finish('the app launched again did not leave');
        }, ASKED_TIMEOUT_MS);
        again.stderr.on('data', (chunk) => {
            out += `[launched again] ${chunk}`;
        });
        again.once('error', (error) => finish(`the app cannot be launched again: ${error.message}`));
        again.on('exit', (code) => {
            clearTimeout(timeout);
            if (code !== 0) finish(`the app launched again exited with ${code}, not 0`);
            hasLeft = true;
        });
    } catch (error) {
        finish(`the app cannot be launched again: ${error.message}`);
    }
}

// The page of an Android app asks for it once it listens: the system opens the app with a link, as when its user taps
// one.
let isLinkOpened = false;
function openLink() {
    if (isLinkOpened || platform !== 'android' || !OPEN_LINK.test(out)) return;
    isLinkOpened = true;
    const opened = spawnSync(adb, ['shell', `am start -W -a android.intent.action.VIEW -d '${PHONE_URL}'`], { encoding: 'utf8', timeout: ASKED_TIMEOUT_MS });
    if (opened.status !== 0) finish(`the app cannot be opened with a link: ${opened.error?.message ?? `${opened.stdout}${opened.stderr}`.trim()}`);
}

function finish(problem) {
    clearTimeout(timer);
    app.kill();
    // The disk image an app ran from detaches once the app is stopped; a failure to does not change the suite's result.
    try {
        close();
    } catch (error) {
        console.error(`warning: ${error.message}`);
    }
    const summary = out.match(CONFORMANCE);
    const failure = problem ?? (isLaunchedAgain && !hasLeft ? 'the app launched again had not left when the suite finished' : undefined);
    if (failure || !summary) {
        console.error(`FAIL: ${failure ?? 'the app failed the conformance suite'}:\n${out}`);
        process.exit(1);
    }
    console.log(`ok: ${platform ?? `${process.platform}-${process.arch}`} app: ${summary[0]}`);
    process.exit(0);
}

const timer = setTimeout(() => finish('the suite did not finish in time'), RUN_TIMEOUT_MS);
app.stdout.on('data', (chunk) => {
    out += chunk;
    launchAgain();
    openLink();
    if (FINISHED.test(out)) finish();
});
app.stderr.on('data', (chunk) => {
    out += chunk;
    launchAgain();
    openLink();
    if (FINISHED.test(out)) finish();
});
// An app that leaves at once, having said nothing, handed its launch to another instance of it.
app.on('exit', (code) => finish(code === 0 && !out ? 'the app handed its launch to an instance of it that runs already: close that one' : `the app exited with ${code} before the suite finished`));

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { ANDROID_ABIS } from './gradleProject.js';
import { EXEC_MAX_BUFFER } from './run.js';

const ACTIVITY = 'dev.crossbind.app.CrossbindActivity';

// The adb that reaches the device: the one on PATH, else the platform tools of ANDROID_HOME's SDK or Android Studio's.
// crossbind installs none.
function adbPath() {
    const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT
        || path.join(os.homedir(), process.platform === 'darwin' ? 'Library/Android/sdk' : 'Android/Sdk');
    const found = [...(process.env.PATH ?? '').split(path.delimiter).map((dir) => path.join(dir, 'adb')), path.join(sdk, 'platform-tools', 'adb')]
        .find((file) => fs.statSync(file, { throwIfNoEntry: false })?.isFile());
    if (!found) {
        throw new Error('crossbind: an Android app runs on a device through adb, which is not on PATH nor in an Android SDK. Install Android\'s platform tools: `brew install --cask android-platform-tools` on macOS, `sudo apt install adb` on Debian and Ubuntu, or Android Studio.');
    }
    return found;
}

function tool(program, args, options = {}) {
    const result = spawnSync(program, args, { encoding: 'utf8', maxBuffer: EXEC_MAX_BUFFER, ...options });
    if (result.status !== 0) {
        throw new Error(`crossbind: ${path.basename(program)} ${args.join(' ')} failed: ${`${result.stdout ?? ''}${result.stderr ?? ''}`.trim() || result.error?.message}`);
    }
    return result.stdout;
}

const adb = (args) => tool(adbPath(), args);
// adb shell hands the device's shell one line, which splits it again.
const quoted = (text) => `'${String(text).replace(/'/g, "'\\''")}'`;

// The device an app runs on in development and in tests: the one ANDROID_SERIAL names, else the only one attached, and
// the ABI of it the app builds for. crossbind starts no emulator.
export function attachedDevice() {
    const serials = adb(['devices']).split('\n').slice(1).map((line) => line.trim().split('\t'))
        .filter(([, status]) => status === 'device').map(([serial]) => serial);
    const serial = process.env.ANDROID_SERIAL || (serials.length === 1 ? serials[0] : null);
    if (!serial) {
        throw new Error(serials.length === 0
            ? 'crossbind: no Android device is attached. Start an emulator, in Android Studio\'s Device Manager or with `emulator -avd <name>`, or connect a phone with USB debugging on.'
            : `crossbind: ${serials.length} Android devices are attached (${serials.join(', ')}). Set ANDROID_SERIAL to the one the app runs on.`);
    }
    const abis = adb(['-s', serial, 'shell', 'getprop', 'ro.product.cpu.abilist']).trim().split(',');
    const abi = abis.find((one) => ANDROID_ABIS.includes(one));
    if (!abi) throw new Error(`crossbind: the Android device ${serial} runs ${abis.join(', ')}, and apps build for ${ANDROID_ABIS.join(' and ')}.`);
    return { serial, abi };
}

// Installs an APK on the attached device and opens it, with `env` as the activity's extras; a dev server's page on this
// machine reaches the device through adb reverse. The process returned carries the app's log, its page's console among
// it, and ends with the app; close() ends the app.
export default function openOnDevice(apk, { env = {}, stdio = 'pipe' } = {}) {
    const { serial } = attachedDevice();
    const id = JSON.parse(fs.readFileSync(path.join(path.dirname(apk), 'output-metadata.json'), 'utf8')).applicationId;
    try {
        adb(['-s', serial, 'install', '-r', '-d', apk]);
    } catch (error) {
        if (!error.message.includes('INSTALL_FAILED_UPDATE_INCOMPATIBLE')) throw error;
        // As the one Google Play installs: only an uninstall replaces it, which takes its data, so the developer runs it.
        throw new Error(`crossbind: ${id} on ${serial} is signed with another key than this build, so it cannot be updated; \`adb -s ${serial} uninstall ${id}\` removes it, with its data, and the next run installs this one.`, { cause: error });
    }
    const devPort = env.CROSSBIND_APP_URL && new URL(env.CROSSBIND_APP_URL).port;
    if (devPort) adb(['-s', serial, 'reverse', `tcp:${devPort}`, `tcp:${devPort}`]);
    const extras = Object.entries(env).flatMap(([key, value]) => ['--es', key, quoted(value)]);
    adb(['-s', serial, 'shell', 'am', 'start', '-S', '-W', '-n', `${id}/${ACTIVITY}`, ...extras]);
    const pid = spawnSync(adbPath(), ['-s', serial, 'shell', 'pidof', id], { encoding: 'utf8' }).stdout?.trim();
    if (!pid) throw new Error(`crossbind: ${id} stopped as it started on ${serial}; its log is in \`adb logcat\`.`);
    // The log of the app's process alone, without the divider logcat starts with, until the process ends. The pattern
    // that ends logcat names it first, so it matches not the shell whose command line holds it too.
    const logcat = `logcat -v raw --pid=${pid} -s Crossbind:V`;
    const child = spawn(adbPath(), ['-s', serial, 'shell',
        `${logcat} | grep -v '^--------- ' & while [ -d /proc/${pid} ]; do sleep 1; done; pkill -f '^${logcat}'`], { stdio });
    return { child, close: () => spawnSync(adbPath(), ['-s', serial, 'shell', 'am', 'force-stop', id]) };
}

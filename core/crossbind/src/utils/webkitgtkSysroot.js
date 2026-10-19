import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import withDirLock from './dirLock.js';
import { downloadFile, verifyIntegrity } from './downloadAndExtractFile.js';
import runInLinuxImage from './linuxImage.js';
import logger from './logger.js';

const LIST = fileURLToPath(new URL('../assets/webkitgtk-sysroot.txt', import.meta.url));
const DEBIAN_ARCH = { x64: 'amd64', arm64: 'arm64' };
const packageUrl = (file) => `https://launchpad.net/ubuntu/+archive/primary/+files/${file}`;

// What a Linux app's host compiles and links against: the listed Ubuntu 22.04 packages, unpacked once per machine and
// arch. Another list unpacks into a directory of its own.
export default async function resolveWebkitGtkSysroot(arch) {
    const list = fs.readFileSync(LIST, 'utf8');
    const packages = list.split('\n').filter((line) => line && !line.startsWith('#'))
        .map((line) => line.split(' ')).filter(([debianArch]) => debianArch === DEBIAN_ARCH[arch]);
    const digest = crypto.createHash('sha256').update(list).digest('hex').slice(0, 12);
    const dir = path.join(os.homedir(), '.crossbind', 'sysroots', `webkitgtk-jammy-${digest}`, arch);
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    await withDirLock(`${dir}.lock`, async () => {
        if (fs.existsSync(path.join(dir, 'root', '.complete'))) return;
        logger.info(`crossbind: downloading WebKitGTK's headers and libraries for linux-${arch}, once on this machine`);
        for (const [, file, sha256] of packages) {
            verifyIntegrity(await downloadFile(packageUrl(file), path.join(dir, 'debs'), { name: file }), packageUrl(file), sha256);
        }
        runInLinuxImage('set -eu; mkdir -p /s/root; for deb in /s/debs/*.deb; do dpkg-deb -x "$deb" /s/root; done; touch /s/root/.complete', {
            mounts: [[dir, '/s']],
            what: `unpacking WebKitGTK for linux-${arch}`,
        });
    });
    return path.join(dir, 'root');
}

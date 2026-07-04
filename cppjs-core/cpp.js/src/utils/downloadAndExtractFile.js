import path from 'node:path';
import fs, { mkdirSync } from 'node:fs';
import crypto from 'node:crypto';
import fr from 'follow-redirects';
import decompress from 'decompress';

export default async function downloadAndExtractFile(url, output, sha256) {
    if (fs.existsSync(`${output}/source`)) {
        return false;
    }
    const filePath = await downloadFile(url, output);
    verifyIntegrity(filePath, url, sha256);
    const a = await decompress(filePath, output);
    if (!a.length) {
        throw new Error(`cppjs: downloaded archive ${filePath} is empty or not a supported archive (from ${url}).`);
    }
    const oldFolder = a[0].path.split('/')[0];
    fs.renameSync(`${output}/${oldFolder}`, `${output}/source`);
    return true;
}

// Verifies the downloaded archive against the sha256 pinned in the build recipe. A missing pin
// is skipped (packages are pinned incrementally; check:sources flags the gaps); a MISMATCH
// refuses the build, so a hijacked mirror or a re-tagged upstream cannot feed arbitrary C++ to
// the compiler.
export function verifyIntegrity(filePath, url, sha256) {
    if (!sha256) return;
    const actual = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
    if (actual !== String(sha256).toLowerCase()) {
        fs.rmSync(filePath, { force: true });
        throw new Error(
            `cppjs: source integrity check failed for ${url}\n`
            + `  expected sha256: ${sha256}\n`
            + `  actual   sha256: ${actual}\n`
            + 'Refusing to build. If you intentionally bumped nativeVersion, update the recipe sha256.',
        );
    }
}

function downloadFile(url, folder) {
    mkdirSync(folder, { recursive: true });
    return new Promise((resolve, reject) => {
        const filename = path.basename(url);
        const dest = `${folder}/${filename}`;
        if (fs.existsSync(dest)) {
            resolve(dest);
            return;
        }

        const parsedUrl = new URL(url);
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname + parsedUrl.search,
            headers: {
                'User-Agent': 'curl/8.7.1',
            },
        };

        const request = fr.https.get(options, (res) => {
            const { statusCode } = res;
            if (!statusCode || statusCode < 200 || statusCode >= 300) {
                res.resume();
                reject(new Error(`cppjs: download failed for ${url} — HTTP ${statusCode ?? 'unknown'}.`));
                return;
            }

            const fileStream = fs.createWriteStream(dest);
            const fail = (err) => {
                fileStream.destroy();
                fs.rmSync(dest, { force: true });
                reject(new Error(`cppjs: download failed for ${url}: ${err.message}`, { cause: err }));
            };
            res.on('error', fail);
            fileStream.on('error', fail);
            fileStream.on('finish', () => {
                fileStream.close();
                resolve(dest);
            });
            res.pipe(fileStream);
        });
        request.on('error', (err) => {
            reject(new Error(`cppjs: cannot reach ${url}: ${err.message}`, { cause: err }));
        });
    });
}

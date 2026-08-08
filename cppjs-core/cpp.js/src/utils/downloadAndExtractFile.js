import path from 'node:path';
import fs, { mkdirSync } from 'node:fs';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fr from 'follow-redirects';

export default async function downloadAndExtractFile(url, output, sha256) {
    if (fs.existsSync(`${output}/source`)) {
        return false;
    }
    const filePath = await downloadFile(url, output);
    verifyIntegrity(filePath, url, sha256);
    extractArchive(filePath, url, output);
    return true;
}

// Extraction runs through the system tar (GNU tar and bsdtar both detect gzip/bzip2/xz, and
// every platform the engine builds on ships one). Extracting into a scratch directory keeps
// the archive from choosing where its files land, and gives the upstream root folder - which
// recipes address as build/source - one place to be renamed from.
function extractArchive(filePath, url, output) {
    const work = `${output}/.extract`;
    fs.rmSync(work, { recursive: true, force: true });
    mkdirSync(work, { recursive: true });
    try {
        const tar = spawnSync('tar', ['-xf', filePath, '-C', work], { encoding: 'utf8' });
        if (tar.error) {
            throw new Error(`cppjs: cannot run tar to extract ${filePath}: ${tar.error.message}`);
        }
        if (tar.status !== 0) {
            throw new Error(`cppjs: extracting ${filePath} (from ${url}) failed: ${(tar.stderr || '').trim() || `tar exited ${tar.status}`}`);
        }
        const entries = fs.readdirSync(work, { withFileTypes: true });
        if (entries.length === 0) {
            throw new Error(`cppjs: downloaded archive ${filePath} is empty or not a supported archive (from ${url}).`);
        }
        // Release tarballs carry one root folder; anything else is treated as the root itself.
        const root = entries.length === 1 && entries[0].isDirectory() ? `${work}/${entries[0].name}` : work;
        fs.renameSync(root, `${output}/source`);
    } finally {
        fs.rmSync(work, { recursive: true, force: true });
    }
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

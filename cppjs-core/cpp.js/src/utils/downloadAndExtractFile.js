import path from 'node:path';
import fs, { mkdirSync } from 'node:fs';
import fr from 'follow-redirects';
import decompress from 'decompress';

export default async function downloadAndExtractFile(url, output) {
    if (fs.existsSync(`${output}/source`)) {
        return false;
    }
    const filePath = await downloadFile(url, output);
    const a = await decompress(filePath, output);
    if (!a.length) {
        throw new Error(`cppjs: downloaded archive ${filePath} is empty or not a supported archive (from ${url}).`);
    }
    const oldFolder = a[0].path.split('/')[0];
    fs.renameSync(`${output}/${oldFolder}`, `${output}/source`);
    return true;
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

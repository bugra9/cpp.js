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
    const oldFolder = a[0].path.split('/')[0];
    fs.renameSync(`${output}/${oldFolder}`, `${output}/source`);
    return true;
}

function downloadFile(url, folder) {
    mkdirSync(folder, { recursive: true });
    return new Promise((resolve) => {
        const filename = path.basename(url);
        if (fs.existsSync(`${folder}/${filename}`)) {
            resolve(`${folder}/${filename}`);
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

        fr.https.get(options, (res) => {
            const fileStream = fs.createWriteStream(`${folder}/${filename}`);
            res.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve(`${folder}/${filename}`);
            });
        });
    });
}

import fs from 'fs';
import p, {dirname} from 'path';
import { tmpdir } from "os";
import * as url from 'node:url';

export const __filename = url.fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

let config;
export const mainPath = process.cwd();

export function createTempDir(folder) {
    let path = p.join(tmpdir(), "cppjs-app-cli");
    if (folder) path = p.join(path, folder);

    if (fs.existsSync(path)) fs.rmdirSync(path);
    fs.mkdirSync(path, { recursive: true });

    return path;
}

export function getFilesGivenDir(dir, options = {}) {
    return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
            if (err) reject(err);

            let filteredFiles = files;
            if (options.ext && Array.isArray(options.ext) && options.ext.length > 0) {
                const regex = new RegExp(`\.(${options.ext.join('|')})$`, 'g');
                filteredFiles = filteredFiles.filter(file => regex.test(file));
            }
            if (options.filter) filteredFiles = filteredFiles.filter(options.filter);
            resolve(filteredFiles);
        });
    });
}

export async function getConfig(projectPath) {
    if (config) return config;
    if (!projectPath) projectPath = mainPath;

    config = {
        projectPath,
        modulesPath: projectPath,
        modulesTempPath: createTempDir('modules'),
        bridgesTempPath: createTempDir('bridges'),
        output: `${projectPath}/dist`,
    };

    const configFilePath = `${projectPath}/.cppjs.config.js`;
    if (fs.existsSync(configFilePath)) {
        config = Object.assign({}, config, (await import(configFilePath)).default);
    }

    return config;
}

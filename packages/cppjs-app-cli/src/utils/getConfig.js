import fs from 'fs';
import createTempDir, { createDir } from './createTempDir.js';
import findCMakeListsFile from './findCMakeListsFile.js';
import p from 'path';
import * as url from 'node:url';
import { createRequire } from 'module';

const __filename = url.fileURLToPath(import.meta.url);
const temp = __filename.split('/'); temp.pop(); temp.pop();
const __dirname = temp.join('/');
const require = createRequire(import.meta.url);

/**
 * @typedef {Object} Config
 * @property {string} general General
 * @property {ConfigPaths} paths Paths
 * @property {ConfigExtensions} ext Extensions
 */

/**
 * @typedef {Object} ConfigPaths
 * @property {string} project Project path.
 * @property {string} base Base path (Use for monorepo structure)
 * @property {string} temp Temp path.
 * @property {string} native Native path (default: ['src/native']).
 * @property {string} module Module path (default: native path)
 * @property {string} header Header path (default: native path)
 * @property {string} bridge Bridge path (default: native and temp path)
 * @property {string} output Output path (default: 'dist')
 * @property {string} cmake CmakeLists.txt path
 */

/**
 * @typedef {Object} ConfigExtensions
 * @property {string} header Header extensions (default: ['h', 'hpp', 'hxx', 'hh'])
 * @property {string} source Source extensions (default: ['c', 'cpp', 'cxx', 'cc'])
 * @property {string} module Module extensions (default: ['i'])
 */

/**
 * @typedef {Object} ConfigGeneral
 * @property {string} name Project name
 */

export default function getConfig(param) {
    let tempConfig = { general: {}, paths: {}, ext: {} };

    if (!param || (typeof param === 'string' || param instanceof String)) {
        const ext = (param || '').split('.').at(-1)
        let filePath;

        if (param && ['json', 'js', 'mjs', 'cjs', 'ts'].includes(ext)) {
            filePath = `${process.cwd()}/${param}`;
            if (!fs.existsSync(filePath)) filePath = null;
        } else {
            filePath = `${process.cwd()}/.cppjs.config.json`;
            if (!fs.existsSync(filePath)) filePath = null;

            /* filePath = `${process.cwd()}/.cpp.config.js`;
            if (!fs.existsSync(filePath)) filePath = null; */
        }

        if (filePath) {
            const file = require(filePath);
            if (file.default) file = file.default;
            if (typeof file === 'function') tempConfig = file();
            else if (typeof file === "object") tempConfig = file;
        }
    } else if (typeof param === "object") {
        tempConfig = param;
    } else {
        console.error('Error');
    }

    return fillConfig(forceToConfigSchema(tempConfig));
}

function forceToConfigSchema(tempConfig) {
    const config = {
        general: tempConfig && tempConfig.general ? tempConfig.general : {},
        paths: tempConfig && tempConfig.paths ? tempConfig.paths : {},
        ext: tempConfig && tempConfig.ext ? tempConfig.ext : {},
    };
    return config;
}

function getAbsolutePath(projectPath, path) {
    if (!path) {
        return null;
    }
    if (p.isAbsolute(path)) {
        return path;
    }
    if (projectPath) {
        return p.resolve(p.join(p.resolve(projectPath), path));
    }
    return p.resolve(path);
}

function fillConfig(tempConfig) {
    const config = {
        general: {},
        paths: {
            project: getAbsolutePath(null, tempConfig.paths.project) || process.cwd(),
        },
        ext: {},
    };

    if (!config.general.name) {
        config.general.name = 'cppjssample';
        const packageJsonPath = `${config.paths.project}/package.json`;
        if (fs.existsSync(packageJsonPath)) {
            const file = JSON.parse(fs.readFileSync(packageJsonPath));
            if (file && typeof file === 'object' && file.name){
                config.general.name = file.name;
            }
        }
    }

    const getPath = getAbsolutePath.bind(null, config.paths.project);

    config.paths.base = getPath(tempConfig.paths.base) || config.paths.project;
    config.paths.temp = getPath(tempConfig.paths.temp) || createTempDir(undefined, config.paths.project)
    config.paths.native = (tempConfig.paths.native || ['src/native']).map(p => getPath(p));
    config.paths.module = (tempConfig.paths.module || config.paths.native).map(p => getPath(p));
    config.paths.header = (tempConfig.paths.header || config.paths.native).map(p => getPath(p));
    config.paths.bridge = (tempConfig.paths.bridge || [...config.paths.native, config.paths.temp]).map(p => getPath(p));
    config.paths.output = getPath(tempConfig.paths.output) || config.paths.temp;
    config.paths.cmake = getPath(tempConfig.paths.cmake || findCMakeListsFile(config.paths.project));
    config.paths.cli = __dirname;

    config.ext.header = tempConfig.ext.header || ['h', 'hpp', 'hxx', 'hh'];
    config.ext.source = tempConfig.ext.source || ['c', 'cpp', 'cxx', 'cc'];
    config.ext.module = tempConfig.ext.module || ['i'];

    createDir('interface', config.paths.temp);
    createDir('bridge', config.paths.temp);

    return config;
}

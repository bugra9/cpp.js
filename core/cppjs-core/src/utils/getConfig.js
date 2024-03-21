import fs from 'fs';
import nodePath from 'path';
import * as url from 'node:url';
import createTempDir, { createDir } from './createTempDir.js';
import findCMakeListsFile from './findCMakeListsFile.js';

const filename = url.fileURLToPath(import.meta.url);
const temp = filename.split('/'); temp.pop(); temp.pop();
const dirname = temp.join('/');

/**
 * @typedef {Object} Config
 * @property {string} general General
 * @property {any[]} dependencies Dependencies
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

let tempConfigDefault = {
    general: {}, dependencies: [], paths: {}, ext: {}, export: {}, platform: {},
};
await initDefaultConfigFile();

async function initDefaultConfigFile() {
    let filePath;
    ['json', 'js', 'mjs', 'cjs', 'ts'].some((e) => {
        filePath = `${process.cwd()}/cppjs.config.${e}`;
        if (!fs.existsSync(filePath)) {
            filePath = null;
            return false;
        }
        return true;
    });

    if (filePath) {
        let file = await import(filePath);
        if (file.default) file = file.default;

        if (typeof file === 'function') tempConfigDefault = file();
        else if (typeof file === 'object') tempConfigDefault = file;
    }
}

export default function getConfig() {
    return fillConfig(forceToConfigSchema(tempConfigDefault));
}

function forceToConfigSchema(tempConfig) {
    const config = {
        general: tempConfig && tempConfig.general ? tempConfig.general : {},
        dependencies: tempConfig && tempConfig.dependencies ? tempConfig.dependencies : [],
        paths: tempConfig && tempConfig.paths ? tempConfig.paths : {},
        ext: tempConfig && tempConfig.ext ? tempConfig.ext : {},
        export: tempConfig && tempConfig.export ? tempConfig.export : {},
        platform: tempConfig && tempConfig.platform ? tempConfig.platform : {},
    };
    return config;
}

function getAbsolutePath(projectPath, path) {
    if (!path) {
        return null;
    }
    if (nodePath.isAbsolute(path)) {
        return path;
    }
    if (projectPath) {
        return nodePath.resolve(nodePath.join(nodePath.resolve(projectPath), path));
    }
    return nodePath.resolve(path);
}

function fillConfig(tempConfig, options = {}) {
    const config = {
        general: {},
        dependencies: (tempConfig.dependencies || []).map((d) => fillConfig(forceToConfigSchema(d), { depend: true })),
        paths: {
            project: getAbsolutePath(null, tempConfig.paths.project) || process.cwd(),
        },
        ext: {},
        export: {},
        platform: {},
        package: {},
    };

    const packageJsonPath = `${config.paths.project}/package.json`;
    if (fs.existsSync(packageJsonPath)) {
        const file = JSON.parse(fs.readFileSync(packageJsonPath));
        if (file && typeof file === 'object' && file.name) {
            config.package = file;
        }
    }

    if (tempConfig?.general?.name) {
        config.general.name = tempConfig.general.name;
    } else {
        config.general.name = config.package.name || 'cppjssample';
    }

    const getPath = getAbsolutePath.bind(null, config.paths.project);

    config.paths.base = getPath(tempConfig.paths.base) || config.paths.project;
    config.paths.temp = getPath(tempConfig.paths.temp) || createTempDir(undefined, config.paths.project);
    config.paths.native = (tempConfig.paths.native || ['src/native']).map((p) => getPath(p));
    config.paths.module = (tempConfig.paths.module || config.paths.native).map((p) => getPath(p));
    config.paths.header = (tempConfig.paths.header || config.paths.native).map((p) => getPath(p));
    config.paths.bridge = (tempConfig.paths.bridge || [...config.paths.native, config.paths.temp]).map((p) => getPath(p));
    config.paths.output = getPath(tempConfig.paths.output) || config.paths.temp;
    config.paths.cmake = options.depend ? findCMakeListsFile(config.paths.output) : (
        getPath(tempConfig.paths.cmake || findCMakeListsFile(config.paths.project))
    );
    config.paths.cli = dirname;

    config.ext.header = tempConfig.ext.header || ['h', 'hpp', 'hxx', 'hh'];
    config.ext.source = tempConfig.ext.source || ['c', 'cpp', 'cxx', 'cc'];
    config.ext.module = tempConfig.ext.module || ['i'];

    config.export.type = tempConfig.export.type || 'cmake';
    config.export.header = tempConfig.export.header || 'include';
    config.export.libPath = getPath(tempConfig.export.libPath || 'lib');
    config.export.libName = tempConfig.export.libName || [config.general.name];

    config.platform['Emscripten-x86_64'] = tempConfig.platform['Emscripten-x86_64'] || {};

    createDir('interface', config.paths.temp);
    createDir('bridge', config.paths.temp);

    // eslint-disable-next-line max-len
    config.getAllDependencies = () => {
        const output = {};
        [...config.dependencies, ...config.dependencies.map((d) => d.getAllDependencies()).flat()].forEach((d) => {
            output[d.paths.project] = d;
        });
        return Object.values(output);
    };

    return config;
}

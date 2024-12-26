import os from 'node:os';
import systemKeys from '../utils/systemKeys.js';
import loadJs from '../utils/loadJs.js';
import loadJson from '../utils/loadJson.js';
import getParentPath from '../utils/getParentPath.js';
import getAbsolutePath from '../utils/getAbsolutePath.js';
import fixPackageName from '../utils/fixPackageName.js';
import getCMakeListsFilePath from '../utils/getCMakeListsFilePath.js';
import calculateDependencyParameters from './calculateDependencyParameters.js';
// import getCmakeParameters from './getCmakeParameters.js';

export default async function loadConfig(configDir = process.cwd(), configName = 'cppjs.config') {
    const config = await loadJs(configDir, configName) || {};
    const output = getFilledConfig(config);
    output.build = await loadJs(configDir, 'cppjs.build');

    output.paths.systemConfig = `${os.homedir()}/.cppjs.json`;
    output.system = loadJson(output.paths.systemConfig) || {};

    Object.entries(systemKeys).forEach(([key, value]) => {
        if (!(key in output.system)) {
            output.system[key] = value.default;
        }
    });

    return output;
}

function getFilledConfig(config, options = { isDepend: false }) {
    const newConfig = {
        general: config.general || {},
        dependencies: (config.dependencies || []).map((d) => getFilledConfig(d, { isDepend: true })),
        paths: config.paths || {},
        ext: config.ext || {},
        export: config.export || {},
        platform: config.platform || {},
        package: null,
    };

    if (newConfig.paths.config && !newConfig.paths.project) {
        newConfig.paths.project = getParentPath(newConfig.paths.config);
    }

    if (!newConfig.paths.project) {
        newConfig.paths.project = process.cwd();
    } else {
        newConfig.paths.project = getAbsolutePath(null, newConfig.paths.project);
    }

    newConfig.package = loadJson(`${newConfig.paths.project}/package.json`);

    if (!newConfig?.general?.name) {
        newConfig.general.name = fixPackageName(newConfig.package.name) || 'cppjssample';
    }

    const getPath = getAbsolutePath.bind(null, newConfig.paths.project);

    newConfig.paths.base = getPath(newConfig.paths.base) || newConfig.paths.project;
    newConfig.paths.cache = getPath(newConfig.paths.cache) || getPath('.cppjs');
    newConfig.paths.build = getPath(newConfig.paths.build) || getPath(`${newConfig.paths.cache}/build`);
    newConfig.paths.native = (newConfig.paths.native || ['src/native']).map((p) => getPath(p));
    newConfig.paths.module = (newConfig.paths.module || newConfig.paths.native).map((p) => getPath(p));
    newConfig.paths.header = (newConfig.paths.header || newConfig.paths.native).map((p) => getPath(p));
    newConfig.paths.bridge = (newConfig.paths.bridge || [...newConfig.paths.native, newConfig.paths.build])
        .map((p) => getPath(p));
    newConfig.paths.output = getPath(newConfig.paths.output) || newConfig.paths.build;
    newConfig.paths.cmake = options.isDepend ? getPath(getCMakeListsFilePath(newConfig.paths.output)) : (
        getPath(newConfig.paths.cmake || getCMakeListsFilePath(newConfig.paths.project))
    );
    newConfig.paths.cmakeDir = getParentPath(newConfig.paths.cmake);
    newConfig.paths.cli = getParentPath(getParentPath(import.meta.url));
    newConfig.paths.cliCMakeListsTxt = `${newConfig.paths.cli}/assets/CMakeLists.txt`;

    newConfig.ext.header = newConfig.ext.header || ['h', 'hpp', 'hxx', 'hh'];
    newConfig.ext.source = newConfig.ext.source || ['c', 'cpp', 'cxx', 'cc'];
    newConfig.ext.module = newConfig.ext.module || ['i'];

    newConfig.export.type = newConfig.export.type || 'cmake';
    newConfig.export.header = newConfig.export.header || 'include';
    newConfig.export.libPath = getPath(newConfig.export.libPath || 'lib');
    newConfig.export.libName = newConfig.export.libName || [newConfig.general.name];
    newConfig.export.binHeaders = newConfig.export.binHeaders || [];

    newConfig.platform['Emscripten-x86_64'] = newConfig.platform['Emscripten-x86_64'] || {};
    newConfig.platform['Emscripten-x86_64-browser'] = newConfig.platform['Emscripten-x86_64-browser'] || {};
    newConfig.platform['Emscripten-x86_64-node'] = newConfig.platform['Emscripten-x86_64-node'] || {};
    newConfig.platform['Android-arm64-v8a'] = newConfig.platform['Android-arm64-v8a'] || {};
    newConfig.platform['Android-x86_64'] = newConfig.platform['Android-x86_64'] || {};
    newConfig.platform['iOS-iphoneos'] = newConfig.platform['iOS-iphoneos'] || {};
    newConfig.platform['iOS-iphonesimulator'] = newConfig.platform['iOS-iphonesimulator'] || {};

    newConfig.allDependencies = (() => {
        const output = {};
        [...newConfig.dependencies, ...newConfig.dependencies.map((d) => d.allDependencies).flat()].forEach((d) => {
            output[d.paths.project] = d;
        });
        return Object.values(output);
    })();

    newConfig.dependencyParameters = calculateDependencyParameters(newConfig);
    // newConfig.cmakeParameters = getCmakeParameters(newConfig);

    return newConfig;
}

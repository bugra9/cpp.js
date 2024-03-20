import { glob } from 'glob';
import CppjsCompiler from 'cpp.js';
import RNEmbind from 'cppjs-core-rn-embind/cppjs.config.mjs';
import RNCppjsPluginReactNative from '../cppjs.config.mjs';

const projectPath = RNCppjsPluginReactNative.paths.project;

const compiler = new CppjsCompiler();

const headers = [];
compiler.config.paths.header.forEach((header) => {
    compiler.config.ext.header.forEach((ext) => {
        headers.push(
            ...glob.sync(`${header}/*.${ext}`, { absolute: true, cwd: compiler.config.paths.project }),
            ...glob.sync(`${header}/**/*.${ext}`, { absolute: true, cwd: compiler.config.paths.project }),
        );
    });
});

headers.forEach((header) => {
    compiler.findOrCreateInterfaceFile(header);
});

compiler.createBridge();
const params = compiler.getCmakeParams();

params.forEach((param, i) => {
    if (param.startsWith('-DHEADER_DIR=')) {
        params[i] += `;${projectPath}/cpp/src;${RNEmbind.paths.project}/cpp/src;${compiler.config.paths.project}/node_modules/react-native/ReactCommon/jsi`;
    } else if (param.startsWith('-DNATIVE_GLOB=')) {
        params[i] += `;${projectPath}/cpp/src/JSI_module.cpp;${RNEmbind.paths.project}/cpp/src/emscripten/bind.cpp;${compiler.config.paths.project}/node_modules/react-native/ReactCommon/jsi/jsi/jsi.cpp`;
    }
});

params.push(...[
    '-DPROJECT_NAME=react-native-cppjs',
    '-DBUILD_TYPE=SHARED',
]);

console.log(params.join(';;;'));

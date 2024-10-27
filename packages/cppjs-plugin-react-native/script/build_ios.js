import fs from 'fs';
import { glob } from 'glob';
import CppjsCompiler from 'cpp.js';
import RNEmbind from '@cpp.js/core-embind-jsi/cppjs.config.mjs';
import RNCppjsPluginReactNative from '../cppjs.config.mjs';

const projectPath = RNCppjsPluginReactNative.paths.project;

const compiler = new CppjsCompiler();
const defaultTempPath = `${compiler.config.paths.project}/.cppjs/default`;

if (fs.existsSync(defaultTempPath)) {
    compiler.config.ext.module.forEach((ext) => {
        compiler.interfaces.push(
            ...glob.sync(`${defaultTempPath}/interface/*.${ext}`, { absolute: true, cwd: compiler.config.paths.project }),
        );
    });
} else {
    let headers = [];
    compiler.config.paths.header.forEach((header) => {
        compiler.config.ext.header.forEach((ext) => {
            headers.push(
                ...glob.sync(`${header}/*.${ext}`, { absolute: true, cwd: compiler.config.paths.project }),
                ...glob.sync(`${header}/**/*.${ext}`, { absolute: true, cwd: compiler.config.paths.project }),
            );
        });
    });

    headers = [...new Set(headers)];
    headers.forEach((header) => {
        compiler.findOrCreateInterfaceFile(header);
    });
}

compiler.createBridge();
const params = compiler.getCmakeParams();
params.forEach((param, i) => {
    if (param.startsWith('-DHEADER_DIR=')) {
        params[i] += `;${RNEmbind.paths.project}/cpp/src;${compiler.config.paths.project}/node_modules/react-native/ReactCommon/jsi`;
    } else if (param.startsWith('-DNATIVE_GLOB=')) {
        params[i] += `;${RNEmbind.paths.project}/cpp/src/emscripten/bind.cpp;${compiler.config.paths.project}/node_modules/react-native/ReactCommon/jsi/jsi/jsi.cpp`;
    } else if (param.startsWith('-DHEADER_GLOB=')) {
        params[i] += `;${RNEmbind.paths.project}/cpp/src/**/*.h`;
    }
});
params.push(...[
    '-DPROJECT_NAME=react-native-cppjs',
    '-DBUILD_TYPE=STATIC',
]);
['iOS-iphoneos', 'iOS-iphonesimulator'].forEach((platform) => {
    const compiler2 = new CppjsCompiler(platform);
    compiler2.run(null, [
        'cmake', `${compiler.config.paths.cli}/assets/CMakeLists.txt`, `-DCMAKE_INSTALL_PREFIX=${compiler.config.paths.temp}/prebuilt/${platform}`, '-DCMAKE_BUILD_TYPE=Release', ...params,
    ], { workdir: compiler2.config.paths.temp, console: true });
    compiler2.run(null, ['cmake', '--build', '.', '--config', 'Release'], { workdir: compiler2.config.paths.temp, console: true });
    compiler2.run(null, ['cmake', '--install', '.'], { workdir: compiler2.config.paths.temp, console: true });

    fs.rmSync(compiler2.config.paths.temp, { recursive: true, force: true });
});
compiler.config.paths.output = compiler.config.paths.temp;
compiler.config.paths.project = compiler.config.paths.temp;
compiler.config.export.libName = ['react-native-cppjs'];
compiler.finishBuild();
fs.cpSync(
    `${compiler.config.paths.output}/prebuilt/react-native-cppjs.xcframework`,
    `${projectPath}/react-native-cppjs.xcframework`,
    { recursive: true },
);

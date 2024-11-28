import glob from 'glob';
import state from '../state/index.js';

export default function getDependLibs() {
    let dependLibs = [
        ...glob.sync(`${state.config.paths.build}/Source-Release/Emscripten-x86_64/dependencies/**/*.a`, { absolute: true, cwd: state.config.paths.project }),
    ];
    state.config.dependencyParameters.cmakeDepends.forEach((d) => {
        if (d.export.libName) {
            d.export.libName.forEach((fileName) => {
                if (d.platform['Emscripten-x86_64'].ignoreLibName?.includes(fileName)) return;
                dependLibs.push(...glob.sync(`${d.paths.output}/prebuilt/Emscripten-x86_64/lib/lib${fileName}.a`, { absolute: true, cwd: d.paths.project }));
            });
        }
    });

    dependLibs = [...new Set(dependLibs)];
    return dependLibs;
}

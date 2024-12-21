import findFiles from '../utils/findFiles.js';
import state from '../state/index.js';

export default function getDependLibs() {
    let dependLibs = [
        ...findFiles(`${state.config.paths.build}/Source-Release/Emscripten-x86_64/dependencies/**/*.a`, { cwd: state.config.paths.project }),
    ];
    state.config.dependencyParameters.cmakeDepends.forEach((d) => {
        if (d.export.libName) {
            d.export.libName.forEach((fileName) => {
                if (d.platform['Emscripten-x86_64'].ignoreLibName?.includes(fileName)) return;
                dependLibs.push(...findFiles(`${d.paths.output}/prebuilt/Emscripten-x86_64/lib/lib${fileName}.a`, { cwd: d.paths.project }));
            });
        }
    });

    dependLibs = [...new Set(dependLibs)];
    return dependLibs;
}

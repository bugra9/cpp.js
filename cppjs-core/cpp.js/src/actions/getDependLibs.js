import findFiles from '../utils/findFiles.js';
import state from '../state/index.js';
import { getFilteredTargetSpec } from './target.js';

export default function getDependLibs(target) {
    let dependLibs = [
        ...findFiles(`${state.config.paths.build}/Source-Release/${target.path}/dependencies/**/*.a`, { cwd: state.config.paths.project }),
    ];
    state.config.dependencyParameters.getCmakeDepends(target).forEach((d) => {
        if (d.export.libName) {
            const ignoreLibNames = getFilteredTargetSpec(d?.targetSpecs).map(s => s.ignoreLibName).flat();
            d.export.libName.forEach((fileName) => {
                if (ignoreLibNames?.includes(fileName)) return;
                let libPaths = findFiles(`${d.paths.output}/prebuilt/${target.path}/lib/lib${fileName}.a`, { cwd: d.paths.project });
                if (libPaths.length === 0) {
                    libPaths = findFiles(`${d.paths.output}/prebuilt/${target.releasePath}/lib/lib${fileName}.a`, { cwd: d.paths.project });
                }
                dependLibs.push(...libPaths);
            });
        }
    });

    dependLibs = [...new Set(dependLibs)];
    return dependLibs;
}

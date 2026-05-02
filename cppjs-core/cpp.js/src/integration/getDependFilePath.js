import fs from 'node:fs';
import state from '../state/index.js';

export default function getDependFilePath(source, target) {
    const headerRegex = new RegExp(`\\.(${state.config.ext.header.join('|')})$`);
    const moduleRegex = new RegExp(`\\.(${state.config.ext.module.join('|')})$`);

    const dependPackage = state.config.allDependencies.find((d) => source.startsWith(d.package.name));
    if (dependPackage) {
        const depName = dependPackage.package.name;
        const configName = dependPackage.general.name;
        const filePath = source.substring(depName.length + 1);

        let path;
        if (headerRegex.test(source)) {
            path = `${dependPackage.paths.output}/prebuilt/${target.path}/include`;
        } else if (moduleRegex.test(source)) {
            path = `${dependPackage.paths.output}/prebuilt/${target.path}/swig`;
        } else {
            path = `${dependPackage.paths.output}/prebuilt/${target.path}`;
        }

        if (fs.existsSync(`${path}/${configName}/${filePath}`)) {
            path = `${path}/${configName}/${filePath}`;
        } else if (fs.existsSync(`${path}/${depName}/${filePath}`)) {
            path = `${path}/${depName}/${filePath}`;
        } else if (fs.existsSync(`${path}/${filePath}`)) {
            path = `${path}/${filePath}`;
        } else {
            throw new Error(`${source} not found in ${depName} package.`);
        }

        return path;
    }

    return null;
}

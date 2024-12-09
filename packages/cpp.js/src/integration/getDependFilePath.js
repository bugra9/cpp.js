import state from '../state/index.js';

export default function getDependFilePath(source, platform) {
    const headerRegex = new RegExp(`\\.(${state.config.ext.header.join('|')})$`);
    const moduleRegex = new RegExp(`\\.(${state.config.ext.module.join('|')})$`);

    const dependPackage = state.config.allDependencies.find((d) => source.startsWith(d.package.name));
    if (dependPackage) {
        const filePath = source.substring(dependPackage.package.name.length + 1);

        let path = `${dependPackage.paths.output}/prebuilt/${platform}/${filePath}`;
        if (headerRegex.test(source)) {
            path = `${dependPackage.paths.output}/prebuilt/${platform}/include/${filePath}`;
        } else if (moduleRegex.test(source)) {
            path = `${dependPackage.paths.output}/prebuilt/${platform}/swig/${filePath}`;
        }

        return path;
    }

    return null;
}

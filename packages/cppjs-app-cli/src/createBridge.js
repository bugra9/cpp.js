import glob from 'glob';
import { execFileSync } from 'child_process';
import pullDockerImage from './pullDockerImage.js';

export default function createBridge(filePath, outputPath) {
    pullDockerImage();
    const includePath = [
        glob.sync("node_modules/cppjs-lib-*-web/include", { absolute: true })
    ].map(path => `-I${path}`);

    const options = { cwd: outputPath, stdio : 'pipe' };
    const args = [
        "run", "-v", `${outputPath}:/output`, "-v", "/:/live", "bugra9/cpp.js",
        "swig", "-c++", '-emscripten', '-o', `/output/${filePath.split('/').at(-1)}.cpp`, ...includePath, `/live${filePath}`
    ];
    execFileSync("docker", args, options);
    return `${outputPath}/${filePath.split('/').at(-1)}.cpp`;
}

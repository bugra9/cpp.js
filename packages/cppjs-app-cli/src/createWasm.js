import { execFileSync } from 'child_process';
import * as url from 'node:url';
import pullDockerImage from './pullDockerImage.js';

const __filename = url.fileURLToPath(import.meta.url);
const temp = __filename.split('/');
temp.pop();
temp.pop();
const __dirname = temp.join('/');

export default function createWasm(cMakeFilePath, outputPath, tempPath, options = {}) {
    pullDockerImage();
    cmake(cMakeFilePath, tempPath);
    make(tempPath);
    cc(tempPath, outputPath, options.cc);

    return outputPath;
}

function cmake(cMakeFilePath, outputPath) {
    let cMakeParentPath = cMakeFilePath.split('/');
    cMakeParentPath.pop();
    cMakeParentPath = cMakeParentPath.join('/');

    const args = [
        "run", "-v", `${outputPath}:/output`, "-v", "/:/live", "--workdir", "/output", "bugra9/cpp.js",
        "emcmake", "cmake", "/live"+cMakeParentPath, "-DCMAKE_INSTALL_PREFIX=/output", `-DBASE_DIR=/live${process.cwd()}`, '-DBRIDGE_DIR=/output',
    ];
    const options = { cwd: outputPath, stdio : 'pipe' };
    execFileSync("docker", args, options);
    return outputPath;
}

function make(outputPath) {
    const args = [
        "run", "-v", `${outputPath}:/output`, "-v", "/:/live", "--workdir", "/output", "bugra9/cpp.js",
        "emmake", "make"
    ];
    const options = { cwd: outputPath, stdio : 'pipe' };
    execFileSync("docker", args, options);
    return outputPath;
}

function cc(tempPath, outputPath, flags = []) {
    const args = [
        "run", "-v", `${tempPath}:/tempPath`, "-v", `${outputPath}:/output`, "-v", `${__dirname}:/cli`, "-v", "/:/live", "bugra9/cpp.js",
        "emcc", "-lembind", "-Wl,--whole-archive", '/tempPath/libcppjs.a', ...flags, "-s", "WASM=1", "-s", "MODULARIZE=1", '-o', '/output/cpp.js', '--extern-post-js', '/cli/src/extern-post.js'
    ];
    const options = { cwd: tempPath, stdio : 'pipe' };
    execFileSync("docker", args, options);
    return outputPath;
}

import { execFileSync } from 'child_process';
import pullDockerImage from '../utils/pullDockerImage.js';
import getBaseInfo from '../utils/getBaseInfo.js';
import getPathInfo from '../utils/getPathInfo.js';
import getOsUserAndGroupId from '../utils/getOsUserAndGroupId.js';

export default function createWasm(compiler, options = {}) {
    const compiler2 = new CppjsCompiler(
        compiler.config.paths.cmake,
        compiler.config.paths.output,
        compiler.config.paths.temp,
        compiler.config.paths.cli,
        compiler.config.general.name,
        options,
        compiler.config.paths.base
    );
    return compiler2.compile();
}

class CppjsCompiler {
    constructor(cMakeFilePath, outputPath, tempPath, cliPath, name, options = {}, basePath = process.cwd()) {
        this.cMakeFilePath = cMakeFilePath;
        this.outputPath = tempPath;
        this.tempPath = tempPath;
        this.cliPath = cliPath;
        this.options = options;
        this.basePath = basePath;
        this.name = name;
    }

    compile() {
        pullDockerImage();

        this.cmake(this.name, true, false);
        this.make();
        this.cmake(this.name+'bridge', false, true);
        this.make();
        this.libs = [`lib${this.name}.a`, `lib${this.name}bridge.a`];

        this.cc();

        return this.outputPath;
    }

    cmake(name, isBuildSource, isBuildBridge) {
        const params = [];
        if (isBuildSource) params.push('-DBUILD_SOURCE=TRUE');
        if (isBuildBridge) params.push('-DBUILD_BRIDGE=TRUE');

        const output = getPathInfo(this.outputPath, this.basePath);
        const projectPath = getPathInfo(process.cwd(), this.basePath);
        const base = getBaseInfo(this.basePath);

        let cMakeParentPath = this.cMakeFilePath.split('/');
        cMakeParentPath.pop();
        cMakeParentPath = cMakeParentPath.join('/');
        const args = [
            "run", "--user", getOsUserAndGroupId(), "-v", `${base.withoutSlash}:/live`, "-v", `${cMakeParentPath}:/cmake`, "--workdir", `/live/${output.relative}`, "bugra9/cpp.js",
            "emcmake", "cmake", "/cmake", `-DBASE_DIR=/live/${projectPath.relative}`,
            `-DCMAKE_INSTALL_PREFIX=/live/${output.relative}`, `-DBRIDGE_DIR=/live/${output.relative}/bridge`, `-DPROJECT_NAME=${name}`, ...params,
        ];
        const options = { cwd: this.outputPath, stdio : 'pipe' };
        execFileSync("docker", args, options);
        return this.outputPath;
    }

    make() {
        const output = getPathInfo(this.outputPath, this.basePath);
        const base = getBaseInfo(this.basePath);

        let cMakeParentPath = this.cMakeFilePath.split('/');
        cMakeParentPath.pop();
        cMakeParentPath = cMakeParentPath.join('/');
        const args = [
            "run", "--user", getOsUserAndGroupId(), "-v", `${base.withoutSlash}:/live`, "-v", `${cMakeParentPath}:/cmake`, "--workdir", `/live/${output.relative}`, "bugra9/cpp.js",
            "emmake", "make"
        ];
        const options = { cwd: this.outputPath, stdio : 'pipe' };
        execFileSync("docker", args, options);
        return this.outputPath;
    }

    cc() {
        const input = getPathInfo(this.tempPath, this.basePath);
        const output = getPathInfo(this.outputPath, this.basePath);
        const base = getBaseInfo(this.basePath);
        const args = [
            "run", "--user", getOsUserAndGroupId(), "-v", `${base.withoutSlash}:/live`, "-v", `${this.cliPath}:/cli`, "bugra9/cpp.js",
            "emcc", "-lembind", "-Wl,--whole-archive", ...this.libs.map(lib => `/live/${input.relative}/${lib}`), ...(this.options.cc || []), "-s", "WASM=1", "-s", "MODULARIZE=1", '-o', `/live/${output.relative}/${this.name}.js`, '--extern-post-js', '/cli/assets/extern-post.js'
        ];
        const options = { cwd: this.tempPath, stdio : 'pipe' };
        execFileSync("docker", args, options);
        return this.outputPath;
    }
}

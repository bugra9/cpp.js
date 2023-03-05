import { execFileSync } from 'child_process';
import glob from 'glob';
import pullDockerImage, { getDockerImage } from '../utils/pullDockerImage.js';
import getBaseInfo from '../utils/getBaseInfo.js';
import getPathInfo from '../utils/getPathInfo.js';
import getOsUserAndGroupId from '../utils/getOsUserAndGroupId.js';

export default function createWasm(compiler, options = {}) {
    const compiler2 = new CppjsCompiler(
        compiler.config,
        options,
    );
    return compiler2.compile();
}

class CppjsCompiler {
    constructor(config, options) {
        this.config = config;
        this.options = options;
    }

    compile() {
        pullDockerImage();

        this.cmake(this.config.general.name, true, false);
        this.make();
        this.cmake(this.config.general.name+'bridge', false, true);
        this.make();

        this.libs = [
            `${this.config.paths.temp}/lib${this.config.general.name}.a`,
            `${this.config.paths.temp}/lib${this.config.general.name}bridge.a`,
            ...glob.sync("node_modules/cppjs-lib-*-wasm/lib/lib*.a", { absolute: true, cwd: this.config.paths.project }),
            ...glob.sync("node_modules/cppjs-lib-*-wasm/node_modules/cppjs-lib-*-wasm/lib/lib*.a", { absolute: true, cwd: this.config.paths.project }),
        ].filter(path => !!path.toString()).map(path => `/live/${getPathInfo(path, this.config.paths.base).relative}`);

        this.cc();

        return this.config.paths.temp;
    }

    cmake(name, isBuildSource, isBuildBridge) {
        const params = [];
        if (isBuildSource) params.push('-DBUILD_SOURCE=TRUE');
        if (isBuildBridge) params.push('-DBUILD_BRIDGE=TRUE');

        const output = getPathInfo(this.config.paths.temp, this.config.paths.base);
        const projectPath = getPathInfo(process.cwd(), this.config.paths.base);
        const native = this.config.paths.native.map(p => `/live/${getPathInfo(p, this.config.paths.base).relative}`).join(';');
        const header = this.config.paths.header.map(p => `/live/${getPathInfo(p, this.config.paths.base).relative}`).join(';');
        const base = getBaseInfo(this.config.paths.base);

        let cMakeParentPath = this.config.paths.cmake.split('/');
        cMakeParentPath.pop();
        cMakeParentPath = cMakeParentPath.join('/');
        const args = [
            "run", "--user", getOsUserAndGroupId(), "-v", `${base.withoutSlash}:/live`, "-v", `${cMakeParentPath}:/cmake`, "--workdir", `/live/${output.relative}`, getDockerImage(),
            "emcmake", "cmake", "/cmake", '-DCMAKE_BUILD_TYPE=Release',
            `-DBASE_DIR=/live/${projectPath.relative}`,
            `-DNATIVE_GLOB=${this.config.ext.source.map(ext => `${native}/*.${ext}`).join(';')}`,
            `-DHEADER_GLOB=${this.config.ext.header.map(ext => `${header}/*.${ext}`).join(';')}`,
            `-DHEADER_DIR=${header}`,
            `-DCMAKE_INSTALL_PREFIX=/live/${output.relative}`, `-DBRIDGE_DIR=/live/${output.relative}/bridge`, `-DPROJECT_NAME=${name}`, ...params,
        ];
        const options = { cwd: this.config.paths.temp, stdio : 'pipe' };
        execFileSync("docker", args, options);
        return this.config.paths.temp;
    }

    make() {
        const output = getPathInfo(this.config.paths.temp, this.config.paths.base);
        const base = getBaseInfo(this.config.paths.base);

        let cMakeParentPath = this.config.paths.cmake.split('/');
        cMakeParentPath.pop();
        cMakeParentPath = cMakeParentPath.join('/');
        const args = [
            "run", "--user", getOsUserAndGroupId(), "-v", `${base.withoutSlash}:/live`, "-v", `${cMakeParentPath}:/cmake`, "--workdir", `/live/${output.relative}`, getDockerImage(),
            "emmake", "make", "install"
        ];
        const options = { cwd: this.config.paths.temp, stdio : 'pipe' };
        execFileSync("docker", args, options);
        return this.config.paths.temp;
    }

    cc() {
        const input = getPathInfo(this.config.paths.temp, this.config.paths.base);
        const output = getPathInfo(this.config.paths.temp, this.config.paths.base);
        const base = getBaseInfo(this.config.paths.base);
        const args = [
            "run", "--user", getOsUserAndGroupId(), "-v", `${base.withoutSlash}:/live`, "-v", `${this.config.paths.cli}:/cli`, getDockerImage(),
            "emcc", "-lembind", "-Wl,--whole-archive", ...this.libs, ...(this.options.cc || []), "-s", "WASM=1", "-s", "MODULARIZE=1", '-o', `/live/${output.relative}/${this.config.general.name}.js`, '--extern-post-js', '/cli/assets/extern-post.js'
        ];
        const options = { cwd: this.config.paths.temp, stdio : 'pipe' };
        execFileSync("docker", args, options);
        return this.config.paths.temp;
    }
}

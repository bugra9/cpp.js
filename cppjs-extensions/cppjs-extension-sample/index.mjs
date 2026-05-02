export default {
    buildWasm: {
        beforeBuildBrowser: (state, emccFlags) => {
            if (state.config.build.usePthread && !emccFlags.includes('-pthread')) {
                emccFlags.push('-pthread');
                emccFlags.push('-sPTHREAD_POOL_SIZE=4');
            }
        },
        beforeBuildNodeJS: (state, emccFlags) => {
            if (state.config.build.usePthread && !emccFlags.includes('-pthread')) {
                emccFlags.push('-pthread');
                emccFlags.push('-sPTHREAD_POOL_SIZE=4');
            }
        },
    },
    createLib: {
        setFlagWithBuildConfig: (state, buildEnv, cFlags, ldFlags) => {
            if (state.config.build.usePthread) {
                cFlags.push('-pthread');
                ldFlags.push('-pthread');
            }
        },
        setFlagWithoutBuildConfig: (state, buildEnv) => {
            if (state.config.build.usePthread) {
                buildEnv.params.push('-e', `CFLAGS=-pthread`);
                buildEnv.params.push('-e', `CXXFLAGS=-pthread`);
                buildEnv.params.push('-e', `LDFLAGS=-pthread`);
            }
        }
    },
    loadConfig: {
        after: (newConfig) => {
            newConfig.build.usePthread = newConfig.build.usePthread || false;

            if (!newConfig.build.usePthread) {
                newConfig.build.usePthread = newConfig.allDependencies.some((d) => d?.build?.usePthread);
            }
        }
    }
};

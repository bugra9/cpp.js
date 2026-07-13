const systemKeys = {
    XCODE_DEVELOPMENT_TEAM: {
        description: 'The unique identifier of the development team used for code signing and app distribution in Xcode.',
        default: '',
    },
    RUNNER: {
        description: 'The execution environment for running the application.',
        options: ['DOCKER_RUN', 'DOCKER_EXEC', 'LOCAL'],
        default: 'DOCKER_RUN',
    },
    WASI_SDK_PATH: {
        description: 'Path to an extracted wasi-sdk (>= 25) used by platform:\'wasi\' builds. The CPPJS_WASI_SDK_PATH environment variable overrides it.',
        default: '',
    },
};

export default systemKeys;

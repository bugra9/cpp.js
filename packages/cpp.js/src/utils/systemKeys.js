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
    LOG_LEVEL: {
        description: 'The verbosity of log output.',
        options: ['DEBUG', 'INFO', 'WARN', 'ERROR'],
        default: 'INFO',
    },
};

export default systemKeys;

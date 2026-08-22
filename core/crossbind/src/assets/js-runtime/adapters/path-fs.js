export default function pathFs({ defaultPathPrefix, dataPath }) {
    return {
        getDefaultPathPrefix: () => defaultPathPrefix,
        getDataPath: () => dataPath,
    };
}

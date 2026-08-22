const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const CrossbindMetroPlugin = require('@crossbind/plugin-metro');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
    ...CrossbindMetroPlugin(defaultConfig),
    resetCache: true,
    watchFolders: [ require('path').resolve('../../') ], /* Delete this line for create-crossbind */
};

module.exports = mergeConfig(defaultConfig, config);

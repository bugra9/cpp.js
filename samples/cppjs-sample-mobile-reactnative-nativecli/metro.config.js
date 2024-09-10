const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const CppjsMetroPlugin = require('cppjs-plugin-react-native/metro-plugin.cjs');

const defaultConfig = getDefaultConfig(__dirname);

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
    ...CppjsMetroPlugin(defaultConfig),
};

module.exports = mergeConfig(defaultConfig, config);

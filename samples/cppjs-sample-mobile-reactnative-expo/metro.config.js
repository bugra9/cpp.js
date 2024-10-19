// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('metro-config');
const CppjsMetroPlugin = require('cppjs-plugin-react-native/metro-plugin.cjs');

/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname);

console.log(defaultConfig, mergeConfig);

const config = {
    ...CppjsMetroPlugin(defaultConfig),
};

module.exports = mergeConfig(defaultConfig, config);

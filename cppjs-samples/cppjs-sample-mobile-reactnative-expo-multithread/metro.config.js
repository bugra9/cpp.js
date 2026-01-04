// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('metro-config');
const CppjsMetroPlugin = require('@cpp.js/plugin-metro');

/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
    ...CppjsMetroPlugin(defaultConfig),
};

module.exports = mergeConfig(defaultConfig, config);

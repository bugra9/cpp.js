// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('metro-config');
const CrossbindMetroPlugin = require('@crossbind/plugin-metro');

/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
    ...CrossbindMetroPlugin(defaultConfig),
};

module.exports = mergeConfig(defaultConfig, config);

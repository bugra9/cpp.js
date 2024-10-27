# @cpp.js/plugin-metro
**Cpp.js Metro plugin**  
A tool for seamless C++ integration with the Metro bundler.

<a href="https://www.npmjs.com/package/@cpp.js/plugin-metro">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/plugin-metro?style=for-the-badge" />
</a>
<a href="https://github.com/bugra9/cpp.js/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/bugra9/cpp.js?style=for-the-badge" />
</a>
<a href="https://cpp.js.org/docs/guide/integrate-into-existing-project/react-native">
    <img alt="Docs - React Native" src="https://img.shields.io/badge/Docs_-_React%20Native-20B2AA?style=for-the-badge" />
</a>
<a href="https://cpp.js.org/docs/guide/integrate-into-existing-project/expo">
    <img alt="Docs - Expo" src="https://img.shields.io/badge/Docs_-_Expo-20B2AA?style=for-the-badge" />
</a>

## Integration
To integrate cpp.js into your project using Metro as a bundler, you can utilize the @cpp.js/plugin-metro plugin. Start by installing these package with the following command:

NPM
```sh
npm install @cpp.js/plugin-metro --save-dev
```
or YARN
```sh
yarn add @cpp.js/plugin-metro --dev
```
or PNPM
```sh
pnpm add @cpp.js/plugin-metro --save-dev
```
or BUN
```sh
bun add @cpp.js/plugin-metro --dev
```

To enable the plugin, modify the metro.config.js file as shown below.

**React Native**
```diff
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
+const CppjsMetroPlugin = require('@cpp.js/plugin-metro');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
-const config = {};
+const config = {
+    ...CppjsMetroPlugin(getDefaultConfig(__dirname)),
+};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

**Expo**
```diff
// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
+const { mergeConfig } = require('metro-config');
+const CppjsMetroPlugin = require('@cpp.js/plugin-metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

+const newConfig = {
+    ...CppjsMetroPlugin(config),
+};

-module.exports = config;
+module.exports = mergeConfig(config, newConfig);
```

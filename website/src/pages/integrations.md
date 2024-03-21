# Integrations
Cpp.js performs the binding process with bundler plugins. Through these bundlers, Cpp.js is used with frameworks such as React, Vue, Svelte, React Native.

| Bundler | Plugin Name |
| ------- | ----------- |
| Webpack | [cppjs-webpack-plugin](https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-plugin-webpack/index.js), [cppjs-loader](https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-plugin-webpack-loader/index.js) |
| Rollup | [rollup-plugin-cppjs](https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-plugin-rollup/index.js) |
| Vite | [vite-plugin-cppjs](https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-plugin-vite/index.js) |
| | |
| Gradle | [react-native-cppjs](https://github.com/bugra9/react-native-embind/tree/main/react-native-cppjs) |

<br />

# Supported Platforms

| Platform | WebAssembly | Native |
| -------- | ----------- | ------ |
| Browser  | yes | no |
| React Native | no | yes |
| Node.js | yes | planning |

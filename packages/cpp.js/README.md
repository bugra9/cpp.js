<div align="center">
  <a href="https://cpp.js.org">
    <picture>
      <img alt="Next.js logo" src="https://cpp.js.org/img/logo.png" height="128">
    </picture>
  </a>
  <h1>Cpp.js</h1>
<p align="center">
  <strong>Bind C++ to JavaScript with no extra code.</strong><br>
  WebAssembly & React Native
</p>

<a href="https://www.npmjs.com/package/cpp.js"><img alt="NPM version" src="https://img.shields.io/npm/v/cpp.js?style=for-the-badge" /></a>
<a href="https://github.com/bugra9/cpp.js/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/bugra9/cpp.js?style=for-the-badge" /></a>
<a href="https://github.com/bugra9/cpp.js/discussions"><img alt="Discussions" src="https://img.shields.io/github/discussions/bugra9/cpp.js?style=for-the-badge" /></a>
<a href="https://github.com/bugra9/cpp.js/issues"><img alt="Issues" src="https://img.shields.io/github/issues/bugra9/cpp.js?style=for-the-badge" /></a>
<br />
<img alt="CodeQL" src="https://img.shields.io/github/actions/workflow/status/bugra9/cpp.js/github-code-scanning/codeql?branch=main&style=for-the-badge&label=CodeQL">
<img alt="Linux Build" src="https://img.shields.io/github/actions/workflow/status/bugra9/cpp.js/build-linux.yml?branch=main&style=for-the-badge&label=Linux%20Build">
<img alt="Macos Build" src="https://img.shields.io/github/actions/workflow/status/bugra9/cpp.js/build-macos.yml?branch=main&style=for-the-badge&label=Macos%20Build">
<img alt="Windows Build" src="https://img.shields.io/github/actions/workflow/status/bugra9/cpp.js/build-windows.yml?branch=main&style=for-the-badge&label=Windows%20Build">
</div>

<h3 align="center">
  <a href="https://cpp.js.org/docs/guide/getting-started/introduction">Getting Started</a>
  <span> · </span>
  <a href="https://cpp.js.org/docs/guide/integrate-into-existing-project/overview">Integrate Into Existing Project</a>
  <span> · </span>
  <a href="https://cpp.js.org/docs/api/cpp-bindings/overview">C++ Bindings</a>
  <span> · </span>
  <a href="https://cpp.js.org/showcase">Showcase</a>
</h3>

## Basic Usage
**src/index.js**
```js
import { initCppJs } from './native/Factorial.h';

const { Factorial } = await initCppJs();
const factorial = new Factorial(99999);
const result = factorial.calculate();
console.log(result);
```

**src/native/Factorial.h**
```c++
class Factorial {
private:
    int number;

public:
    Factorial(int num) : number(num) {}

    int calculate() {
        if (number < 0) return -1;

        int result = 1;
        for (int i = 2; i <= number; i++) {
            result *= i;
        }
        return result;
    }
};
```

## Prerequisites
To begin building your project with Cpp.js, you’ll first need to install a few dependencies:

- Docker
- Node.js version 18 or higher
- CMake version 3.28 or higher (only required for Mobile development)
- Xcode (only required for iOS development)
- Cocoapods (only required for iOS development)

## Create a New Project
To set up a new cpp.js project with a minimal starter structure, execute the following command in your terminal:
```sh
npm create cpp.js@latest
```
## Integrate Into Existing Project
Integrate cpp.js seamlessly into your existing projects using the appropriate packages for your development needs. Refer to the documentation links for detailed integration guides.

| Platform | Package(s) | Documentation |
| -------- | ---------- | ------------- |
| Standalone  | [cpp.js](https://www.npmjs.com/package/cpp.js) | [Learn](https://cpp.js.org/docs/guide/integrate-into-existing-project/standalone) |
| Webpack  | [@cpp.js/plugin-webpack](https://www.npmjs.com/package/@cpp.js/plugin-webpack), [@cpp.js/plugin-webpack-loader](https://www.npmjs.com/package/@cpp.js/plugin-webpack-loader) | [Learn](https://cpp.js.org/docs/guide/integrate-into-existing-project/webpack) |
| Rollup  | [@cpp.js/plugin-rollup](https://www.npmjs.com/package/@cpp.js/plugin-rollup) | [Learn](https://cpp.js.org/docs/guide/integrate-into-existing-project/rollup) |
| Vite  | [@cpp.js/plugin-vite](https://www.npmjs.com/package/@cpp.js/plugin-vite) | [Learn](https://cpp.js.org/docs/guide/integrate-into-existing-project/vite) |
| Rspack  | [@cpp.js/plugin-webpack](https://www.npmjs.com/package/@cpp.js/plugin-webpack), [@cpp.js/plugin-webpack-loader](https://www.npmjs.com/package/@cpp.js/plugin-webpack-loader) | [Learn](https://cpp.js.org/docs/guide/integrate-into-existing-project/rspack) |
| Create React App (CRA) | [@cpp.js/plugin-webpack](https://www.npmjs.com/package/@cpp.js/plugin-webpack), [@cpp.js/plugin-webpack-loader](https://www.npmjs.com/package/@cpp.js/plugin-webpack-loader) | [Learn](https://cpp.js.org/docs/guide/integrate-into-existing-project/create-react-app) |
| React Native | [@cpp.js/plugin-react-native](https://www.npmjs.com/package/@cpp.js/plugin-react-native), [@cpp.js/plugin-react-native-ios-helper](https://www.npmjs.com/package/@cpp.js/plugin-react-native-ios-helper), [@cpp.js/plugin-metro](https://www.npmjs.com/package/@cpp.js/plugin-metro), [@cpp.js/core-embind-jsi](https://www.npmjs.com/package/@cpp.js/core-embind-jsi) | [Learn](https://cpp.js.org/docs/guide/integrate-into-existing-project/react-native) |
| Expo | [@cpp.js/plugin-react-native](https://www.npmjs.com/package/@cpp.js/plugin-react-native), [@cpp.js/plugin-react-native-ios-helper](https://www.npmjs.com/package/@cpp.js/plugin-react-native-ios-helper), [@cpp.js/plugin-metro](https://www.npmjs.com/package/@cpp.js/plugin-metro), [@cpp.js/core-embind-jsi](https://www.npmjs.com/package/@cpp.js/core-embind-jsi) | [Learn](https://cpp.js.org/docs/guide/integrate-into-existing-project/expo) |
| Node.js | [cpp.js](https://www.npmjs.com/package/cpp.js) | [Learn](https://cpp.js.org/docs/guide/integrate-into-existing-project/nodejs) |
| Cloudflare Workers  | [cpp.js](https://www.npmjs.com/package/cpp.js) | [Learn](https://cpp.js.org/docs/guide/integrate-into-existing-project/cloudflare-worker) |

## Features
- [Calling C++ from JavaScript](https://cpp.js.org/docs/guide/features/calling-cpp-from-javascript)
- [Packages](https://cpp.js.org/docs/guide/features/packages)
- [Plugins](https://cpp.js.org/docs/guide/features/plugins)
- [Assets](https://cpp.js.org/docs/guide/features/assets)
- [Working with a Monorepo](https://cpp.js.org/docs/guide/features/monorepo)

## License
[MIT](https://github.com/bugra9/cpp.js/blob/main/LICENSE)

Copyright (c) 2023-2025, Buğra Sarı

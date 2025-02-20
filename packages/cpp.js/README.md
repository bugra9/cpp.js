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
  <a href="https://cpp.js.org/docs/package/package/showcase">Showcase</a>
</h3>

## Basic Usage
**src/index.js**
```js
import { initCppJs, Factorial } from './native/Factorial.h';

await initCppJs();
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

## License
[MIT](https://github.com/bugra9/cpp.js/blob/main/LICENSE)

Copyright (c) 2025, Buğra Sarı

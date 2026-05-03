<div align="center">
  <a href="https://cpp.js.org">
    <picture>
      <img alt="Cpp.js logo" src="https://cpp.js.org/img/logo.png" height="128">
    </picture>
  </a>
  <h1>Cpp.js</h1>
<p align="center">
  <strong>Bind C++ to JavaScript with no extra code.</strong><br>
  WebAssembly & React Native
</p>

<a href="https://www.npmjs.com/package/cpp.js/v/beta"><img alt="NPM version" src="https://img.shields.io/npm/v/cpp.js/beta?style=for-the-badge&label=npm" /></a>
<a href="https://hub.docker.com/r/bugra9/cpp.js"><img alt="Docker image version" src="https://img.shields.io/docker/v/bugra9/cpp.js?style=for-the-badge&logo=docker&label=docker" /></a>
<a href="https://github.com/bugra9/cpp.js/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/bugra9/cpp.js?style=for-the-badge" /></a>
<br />
<img alt="CodeQL" src="https://img.shields.io/github/actions/workflow/status/bugra9/cpp.js/github-code-scanning/codeql?branch=main&style=for-the-badge&label=CodeQL">
<img alt="Linux Build" src="https://img.shields.io/github/actions/workflow/status/bugra9/cpp.js/build-linux.yml?branch=main&style=for-the-badge&label=Linux%20Build">
<img alt="Macos Build" src="https://img.shields.io/github/actions/workflow/status/bugra9/cpp.js/build-macos.yml?branch=main&style=for-the-badge&label=Macos%20Build">
<img alt="Windows Build" src="https://img.shields.io/github/actions/workflow/status/bugra9/cpp.js/build-windows.yml?branch=main&style=for-the-badge&label=Windows%20Build">
</div>

<h3 align="center">
  <a href="https://cpp.js.org/docs/guide/getting-started/introduction"><strong>📖 Getting Started</strong></a>
  <span> · </span>
  <a href="https://cpp.js.org/docs/guide/integrate-into-existing-project/overview">Integrate Into Existing Project</a>
  <span> · </span>
  <a href="https://cpp.js.org/docs/api/cpp-bindings/overview">C++ Bindings</a>
  <span> · </span>
  <a href="https://cpp.js.org/docs/package/package/showcase">Showcase</a>
</h3>

## Why Cpp.js?
- **No glue code** — write standard C++ headers; bindings are generated for you.
- **Single source, multi-target** — the same C++ code runs in browsers, Node.js, iOS, and Android.
- **Battle-tested libraries** — drop-in support for GDAL, GEOS, OpenSSL, SQLite, PROJ, and more.
- **Bundler-agnostic** — first-class plugins for Vite, Rollup, Webpack, Metro, and React Native.

## Prerequisites
To begin building your project with Cpp.js, you'll first need to install a few dependencies:

- Docker
- Node.js version 22 or higher
- CMake version 3.28 or higher (only required for Mobile development)
- Xcode (only required for iOS development)
- Cocoapods (only required for iOS development)

## Create a New Project
To set up a new cpp.js project with a minimal starter structure, execute the following command in your terminal:
```sh
npm create cpp.js@beta
```

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

## Official Packages
Officially maintained, prebuilt C++ libraries you can install as npm packages and use directly from JavaScript:

| Package | Version |
| --- | --- |
| [@cpp.js/package-gdal](https://www.npmjs.com/package/@cpp.js/package-gdal) | 2.0.0-beta.15 |
| [@cpp.js/package-geos](https://www.npmjs.com/package/@cpp.js/package-geos) | 2.0.0-beta.15 |
| [@cpp.js/package-proj](https://www.npmjs.com/package/@cpp.js/package-proj) | 2.0.0-beta.15 |
| [@cpp.js/package-spatialite](https://www.npmjs.com/package/@cpp.js/package-spatialite) | 2.0.0-beta.15 |
| [@cpp.js/package-sqlite3](https://www.npmjs.com/package/@cpp.js/package-sqlite3) | 2.0.0-beta.15 |
| [@cpp.js/package-openssl](https://www.npmjs.com/package/@cpp.js/package-openssl) | 2.0.0-beta.15 |
| [@cpp.js/package-curl](https://www.npmjs.com/package/@cpp.js/package-curl) | 2.0.0-beta.15 |
| [@cpp.js/package-tiff](https://www.npmjs.com/package/@cpp.js/package-tiff) | 2.0.0-beta.15 |
| [@cpp.js/package-geotiff](https://www.npmjs.com/package/@cpp.js/package-geotiff) | 2.0.0-beta.15 |
| [@cpp.js/package-webp](https://www.npmjs.com/package/@cpp.js/package-webp) | 2.0.0-beta.15 |
| [@cpp.js/package-expat](https://www.npmjs.com/package/@cpp.js/package-expat) | 2.0.0-beta.15 |
| [@cpp.js/package-iconv](https://www.npmjs.com/package/@cpp.js/package-iconv) | 2.0.0-beta.15 |
| [@cpp.js/package-zlib](https://www.npmjs.com/package/@cpp.js/package-zlib) | 2.0.0-beta.15 |

Browse all available packages at [cpp.js.org/docs/package/package/showcase](https://cpp.js.org/docs/package/package/showcase).

## 🌱 Community Packages
Community-maintained, prebuilt C++ libraries packaged for Cpp.js — published under the [cppjs-community](https://github.com/cppjs-community) organization. Anyone can contribute new packages following the same standard, and they'll be listed here.

| Package | Repository |
| --- | --- |
| simdjson | [github.com/cppjs-community/package-simdjson](https://github.com/cppjs-community/package-simdjson) |

Want to add yours? Start a discussion at [bugra9/cpp.js/discussions](https://github.com/bugra9/cpp.js/discussions).

## License
[MIT](https://github.com/bugra9/cpp.js/blob/main/LICENSE)

Copyright (c) 2026, Buğra Sarı

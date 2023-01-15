# cpp.js

cpp.js is a framework for building tiny, blazingly fast binaries for all major desktop, mobile and web platforms. Developers can integrate any front-end framework that compiles to HTML, JS and CSS for building their user interface. The backend of the application is a cpp-sourced binary with an API that the front-end can interact with.

## Motivation
**js:**
- You can output to all platforms with a single source.
- Easy ui development
- Slowly

**c++:**
- You can output to all platforms with a single source.
- Native performance

**js + c++**
- You can output to all platforms with a single source.
- Easy ui development
- Native performance

Using javascript and react native, we can create applications for android, ios, web and desktops with a single source. But application performance remains low. Can we overcome this problem by adding c++ next to javascript and developing the main code with c++ and the ui side with javascript?

## Guide
### Installation
- Install and start docker. Add user to docker group.
- Install plugin according to the builder used. (rollup-plugin-cppjs, vite-plugin-cppjs)
- Add plugin to builder config. (e.g: vite.config.js)

### Basic Usage
- Create native folder in the project root.
- Create .h and .cpp files as you like.
- If you want to use a library, just install it. (e.g: yarn add cppjs-lib-sample-web)

Check out the [Sample app](https://github.com/bugra9/cpp.js/tree/main/packages/cppjs-sample-vite-vue).

## TODO

### Urgent
- [x] Implement swig-emscripten integration
- [x] Add overloading support using parameter types for embind
- [x] Crete and upload docker image
- [x] Implement swig interface generator
- [x] Implement cpp-js bridge file generator
- [x] Implement wasm generator
- [x] Create rollup plugin
- [x] Create vite plugin for development
- [x] Create webpack plugin
- [ ] Create turbopack plugin
- [x] Create vite + vue example
- [ ] Create vite + react example
- [x] Create webpack + react example
- [ ] Handle other cpp formats (h, hpp, hh, c, cpp, cc, cxx)
- [ ] Use user defined interface file if available.
- [x] Use user defined CMakeLists.txt if available.
- [ ] Implement Hot Module Replacement (HMR) for the Vite plugin.
- [ ] Implement Hot Module Replacement (HMR) for the Webpack plugin.

### Important
- [ ] Implement swig-jsi integration
- [ ] Implement cpp-jsi bridge file generator
- [ ] Implement React Native integration
- [ ] Implement cpp-node bridge file generator
- [ ] Implement Electron integration
- [ ] Create documentation

### Libs
- [ ] Create CartoMobileSDK cppjs web library
- [ ] Create gdal3.js cppjs web library

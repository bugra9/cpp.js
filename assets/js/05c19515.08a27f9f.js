"use strict";(self.webpackChunk_cpp_js_website=self.webpackChunk_cpp_js_website||[]).push([[8864],{960:(e,s,i)=>{i.r(s),i.d(s,{assets:()=>c,contentTitle:()=>r,default:()=>o,frontMatter:()=>p,metadata:()=>a,toc:()=>l});var n=i(7512),t=i(2436);const p={},r="How it works?",a={type:"mdx",permalink:"/how-it-works",source:"@site/src/pages/how-it-works.mdx",title:"How it works?",description:"Docker Image",frontMatter:{},unlisted:!1},c={},l=[{value:"Docker Image",id:"docker-image",level:2},{value:"Browser",id:"browser",level:2},{value:"React Native",id:"react-native",level:2},{value:"Cpp.js Build",id:"cppjs-build",level:2}];function d(e){const s={a:"a",admonition:"admonition",h1:"h1",h2:"h2",header:"header",li:"li",mermaid:"mermaid",p:"p",strong:"strong",ul:"ul",...(0,t.M)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(s.header,{children:(0,n.jsx)(s.h1,{id:"how-it-works",children:"How it works?"})}),"\n",(0,n.jsx)(s.h2,{id:"docker-image",children:"Docker Image"}),"\n",(0,n.jsx)(s.p,{children:"Cpp.js downloads the bugra9/cpp.js docker image before running. This docker image contains Emscripten, Swig, Cmake and patches prepared for them.\nThus, the necessary applications can be accessed through this image."}),"\n",(0,n.jsx)(s.admonition,{title:"Links",type:"note",children:(0,n.jsxs)(s.ul,{children:["\n",(0,n.jsxs)(s.li,{children:[(0,n.jsx)(s.strong,{children:"Docker Image:"})," ",(0,n.jsx)(s.a,{href:"https://hub.docker.com/r/bugra9/cpp.js",children:"https://hub.docker.com/r/bugra9/cpp.js"})]}),"\n",(0,n.jsxs)(s.li,{children:[(0,n.jsx)(s.strong,{children:"Dockerfile:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-util-docker/Dockerfile",children:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-util-docker/Dockerfile"})]}),"\n"]})}),"\n",(0,n.jsx)("br",{}),"\n",(0,n.jsx)("br",{}),"\n",(0,n.jsx)(s.h2,{id:"browser",children:"Browser"}),"\n",(0,n.jsx)(s.p,{children:"Cpp.js performs the binding process in the browser with bundler plugins. These plugins; webpack (cppjs-webpack-plugin, cppjs-loader), rollup (rollup-plugin-cppjs), vite (vite-plugin-cppjs)."}),"\n",(0,n.jsx)(s.p,{children:"During import parsing, the plugins create the swig interface for the imported header files and change the import line to import cpp.js."}),"\n",(0,n.jsx)(s.p,{children:"During the bundle creation, bridge files are created for the swig interfaces and all codes are compiled to create wasm and js files in the dist directory."}),"\n",(0,n.jsx)(s.p,{children:"In development mode, wasm and js files are served from the temp directory."}),"\n",(0,n.jsx)(s.mermaid,{value:'flowchart TD\n    Browser --\x3e \n    id2["Bundlers (Webpack, Rollup, Vite)"] -- Transform --\x3e\n    id3["Detect imported c++ headers"] --\x3e\n    id4["Create swig interface for imported headers."]\n    id2 -- Bundle --\x3e\n    id5["Generate bridges using swig"] --\x3e\n    id6["Generate wasm and js files using emscripten"]'}),"\n",(0,n.jsx)("br",{}),"\n",(0,n.jsx)(s.admonition,{title:"Links",type:"note",children:(0,n.jsxs)(s.ul,{children:["\n",(0,n.jsxs)(s.li,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"cppjs-webpack-plugin:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-plugin-webpack/index.js",children:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-plugin-webpack/index.js"})]}),"\n"]}),"\n",(0,n.jsxs)(s.li,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"cppjs-loader:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-plugin-webpack-loader/index.js",children:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-plugin-webpack-loader/index.js"})]}),"\n"]}),"\n",(0,n.jsxs)(s.li,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"rollup-plugin-cppjs:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-plugin-rollup/index.js",children:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-plugin-rollup/index.js"})]}),"\n"]}),"\n",(0,n.jsxs)(s.li,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"vite-plugin-cppjs:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-plugin-vite/index.js",children:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-plugin-vite/index.js"})]}),"\n"]}),"\n"]})}),"\n",(0,n.jsx)("br",{}),"\n",(0,n.jsx)("br",{}),"\n",(0,n.jsx)(s.h2,{id:"react-native",children:"React Native"}),"\n",(0,n.jsx)(s.p,{children:"Cpp.js is designed to bind the same on all platforms. In browsers, embind is used for bind, so embind is also used on React Native."}),"\n",(0,n.jsx)(s.p,{children:"For this, Embind was moved from Emscripten to a separate package called react-native-embind and the webassembly integration was replaced with JSI."}),"\n",(0,n.jsx)(s.p,{children:"The react-native-cppjs package was created for easy integration with React native. This package runs a node script on build.gradle to get the cmake parameters in cpp.js and the path to the CMakeLists.txt file. Using these, the compilation process is performed on the android ecosystem."}),"\n",(0,n.jsx)(s.mermaid,{value:'flowchart TD\n    id1["React Native"] --\x3e \n    id2["react-native-cppjs"] -- Android --\x3e\n    id3["Create swig interface for all headers."] --\x3e\n    id4["Generate bridges using swig"] --\x3e\n    id5["Generate .so library"]\n    id2["react-native-cppjs"] -- IOS --\x3e\n    id7["Not implemented yet"]'}),"\n",(0,n.jsx)("br",{}),"\n",(0,n.jsx)(s.admonition,{title:"Links",type:"note",children:(0,n.jsxs)(s.ul,{children:["\n",(0,n.jsxs)(s.li,{children:[(0,n.jsx)(s.strong,{children:"react-native-embind:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/react-native-embind/tree/main/react-native-embind",children:"https://github.com/bugra9/react-native-embind/tree/main/react-native-embind"})]}),"\n",(0,n.jsxs)(s.li,{children:[(0,n.jsx)(s.strong,{children:"react-native-cppjs:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/react-native-embind/tree/main/react-native-cppjs",children:"https://github.com/bugra9/react-native-embind/tree/main/react-native-cppjs"})]}),"\n",(0,n.jsxs)(s.li,{children:[(0,n.jsx)(s.strong,{children:"react-native-sample:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-mobile-reactnative",children:"https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-mobile-reactnative"})]}),"\n"]})}),"\n",(0,n.jsx)("br",{}),"\n",(0,n.jsx)("br",{}),"\n",(0,n.jsx)(s.h2,{id:"cppjs-build",children:"Cpp.js Build"}),"\n",(0,n.jsx)(s.p,{children:"Cpp.js has a config system for customization. Most information such as path of native code, file extensions, dependencies are defined in the cppjs.config.js file in the project directory. If the file does not exist or attributes are not defined, it continues with default values."}),"\n",(0,n.jsx)(s.p,{children:"Cpp.js prepares the parameters needed for compilation, such as files to be compiled using the values in config."}),"\n",(0,n.jsx)(s.p,{children:"Compilation is done by giving CMakeLists.txt in cpp.js and the previously prepared parameters to cmake."}),"\n",(0,n.jsx)(s.p,{children:"As a final step, just for webassembly, the output library is converted into wasm and js files using Emscripten"}),"\n",(0,n.jsx)(s.mermaid,{value:'flowchart TD\n    id2["Cpp.js"] -- Prepare --\x3e\n    id3["Find all project and dependencies headers"] --\x3e\n    id4["Find all project and dependencies c/c++ files"] --\x3e\n    id5["Find all project and dependencies CMakeLists.txt"]\n    id2["Cpp.js"] -- Build with Cmake --\x3e\n    id7["Create Cmake params"] --\x3e\n    id8["Add dependencies to cmake"] -- Wasm --\x3e\n    id9["Create static wasm lib using Emscripten"]\n    id2["Cpp.js"] -- Create Wasm and js files --\x3e\n    id10["Create Wasm and js files using Emscripten"]\n    id8["Add dependencies to cmake"] -- Android --\x3e\n    id11["Create dynamic (.so) library"]'}),"\n",(0,n.jsx)("br",{}),"\n",(0,n.jsx)(s.admonition,{title:"Links",type:"note",children:(0,n.jsxs)(s.ul,{children:["\n",(0,n.jsxs)(s.li,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"cpp.js:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/tree/main/packages/cppjs-app-cli/src",children:"https://github.com/bugra9/cpp.js/tree/main/packages/cppjs-app-cli/src"})]}),"\n"]}),"\n",(0,n.jsxs)(s.li,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"Sample Config:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/blob/main/samples/cppjs-sample-web-vue-vite/cppjs.config.js",children:"https://github.com/bugra9/cpp.js/blob/main/samples/cppjs-sample-web-vue-vite/cppjs.config.js"})]}),"\n"]}),"\n",(0,n.jsxs)(s.li,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"getConfig:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-app-cli/src/utils/getConfig.js",children:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-app-cli/src/utils/getConfig.js"})]}),"\n"]}),"\n",(0,n.jsxs)(s.li,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"CMakeLists.txt:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-app-cli/src/assets/CMakeLists.txt",children:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-app-cli/src/assets/CMakeLists.txt"})]}),"\n"]}),"\n",(0,n.jsxs)(s.li,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"build:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-app-cli/src/functions/createWasm.js",children:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-app-cli/src/functions/createWasm.js"})]}),"\n"]}),"\n"]})}),"\n",(0,n.jsx)("br",{}),"\n",(0,n.jsx)(s.admonition,{title:"Samples",type:"note",children:(0,n.jsxs)(s.ul,{children:["\n",(0,n.jsxs)(s.li,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"React Native:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-mobile-reactnative",children:"https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-mobile-reactnative"})]}),"\n"]}),"\n",(0,n.jsxs)(s.li,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"Vite + Vue:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-web-vue-vite",children:"https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-web-vue-vite"})]}),"\n"]}),"\n",(0,n.jsxs)(s.li,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"Webpack + React:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-web-react-cra",children:"https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-web-react-cra"})]}),"\n"]}),"\n",(0,n.jsxs)(s.li,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"Basic Lib"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-lib-basic",children:"https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-lib-basic"})]}),"\n"]}),"\n",(0,n.jsxs)(s.li,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"Complex Lib:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-lib-complex",children:"https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-lib-complex"})]}),"\n"]}),"\n",(0,n.jsxs)(s.li,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"Cmake Lib:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-lib-basic-cmake",children:"https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-lib-basic-cmake"})]}),"\n"]}),"\n",(0,n.jsxs)(s.li,{children:["\n",(0,n.jsxs)(s.p,{children:[(0,n.jsx)(s.strong,{children:"Prebuilt Lib:"})," ",(0,n.jsx)(s.a,{href:"https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-lib-basic-prebuilt",children:"https://github.com/bugra9/cpp.js/tree/main/samples/cppjs-sample-lib-basic-prebuilt"})]}),"\n"]}),"\n"]})})]})}function o(e={}){const{wrapper:s}={...(0,t.M)(),...e.components};return s?(0,n.jsx)(s,{...e,children:(0,n.jsx)(d,{...e})}):d(e)}},2436:(e,s,i)=>{i.d(s,{I:()=>a,M:()=>r});var n=i(5496);const t={},p=n.createContext(t);function r(e){const s=n.useContext(p);return n.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function a(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(t):e.components||t:r(e.components),n.createElement(p.Provider,{value:s},e.children)}}}]);
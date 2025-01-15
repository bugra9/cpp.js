"use strict";(self.webpackChunk_cpp_js_website=self.webpackChunk_cpp_js_website||[]).push([[7684],{905:(e,a,i)=>{i.r(a),i.d(a,{assets:()=>l,contentTitle:()=>t,default:()=>d,frontMatter:()=>r,metadata:()=>n,toc:()=>p});const n=JSON.parse('{"id":"guide/features/packages","title":"Packages","description":"Cpp.js offers flexibility with three types of packages, all available on NPM. You can use the existing packages or publish your own.","source":"@site/docs/guide/features/packages.md","sourceDirName":"guide/features","slug":"/guide/features/packages","permalink":"/docs/guide/features/packages","draft":false,"unlisted":false,"tags":[],"version":"current","lastUpdatedAt":1736899655000,"frontMatter":{},"sidebar":"guide","previous":{"title":"Monorepo","permalink":"/docs/guide/features/monorepo"},"next":{"title":"Plugins","permalink":"/docs/guide/features/plugins"}}');var s=i(7557),c=i(7266);const r={},t="Packages",l={},p=[{value:"Prebuilt Packages",id:"prebuilt-packages",level:3},{value:"Usage",id:"usage",level:4},{value:"Build",id:"build",level:4},{value:"Package Structure",id:"package-structure",level:4},{value:"Configuration",id:"configuration",level:4},{value:"Source Code Packages",id:"source-code-packages",level:3},{value:"Usage",id:"usage-1",level:4},{value:"Package Structure",id:"package-structure-1",level:4},{value:"Configuration",id:"configuration-1",level:4},{value:"Cmake Packages",id:"cmake-packages",level:3},{value:"Usage",id:"usage-2",level:4},{value:"Package Structure",id:"package-structure-2",level:4},{value:"Configuration",id:"configuration-2",level:4}];function o(e){const a={a:"a",admonition:"admonition",code:"code",h1:"h1",h3:"h3",h4:"h4",header:"header",li:"li",p:"p",pre:"pre",ul:"ul",...(0,c.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(a.header,{children:(0,s.jsx)(a.h1,{id:"packages",children:"Packages"})}),"\n",(0,s.jsx)(a.p,{children:"Cpp.js offers flexibility with three types of packages, all available on NPM. You can use the existing packages or publish your own."}),"\n",(0,s.jsx)(a.h3,{id:"prebuilt-packages",children:"Prebuilt Packages"}),"\n",(0,s.jsx)(a.p,{children:"This package includes prebuilt libraries for different platforms (Web, Android, iOS), enabling quick integration without needing to compile. By default, a package is of this type, meaning that most packages fall into this category."}),"\n",(0,s.jsx)(a.h4,{id:"usage",children:"Usage"}),"\n",(0,s.jsxs)(a.p,{children:["Import the necessary header file directly from the package. Header files can be accessed from the ",(0,s.jsx)(a.code,{children:"dist/prebuilt/PLATFORM_NAME/include"})," path."]}),"\n",(0,s.jsx)(a.p,{children:"Here is a minimal example:"}),"\n",(0,s.jsx)(a.pre,{children:(0,s.jsx)(a.code,{className:"language-js",metastring:'title="JavaScript"',children:"import { initCppJs, Gdal } from '@cpp.js/package-gdal/gdal.h';\n\nawait initCppJs();\n"})}),"\n",(0,s.jsx)(a.h4,{id:"build",children:"Build"}),"\n",(0,s.jsx)(a.p,{children:"Cpp.js can compile external projects using CMake and configure. To set up the build process for an external project, you can create a cppjs.build.js file in your project\u2019s home directory to configure the build process. Once configured, use the cppjs build command to compile the project."}),"\n",(0,s.jsx)(a.p,{children:"Here are some examples of how cppjs.build.js files are structured for different projects:"}),"\n",(0,s.jsxs)(a.ul,{children:["\n",(0,s.jsx)(a.li,{children:(0,s.jsx)(a.a,{href:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-package-zlib/cppjs.build.js",children:"@cpp.js/package-zlib/cppjs.build.js"})}),"\n",(0,s.jsx)(a.li,{children:(0,s.jsx)(a.a,{href:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-package-webp/cppjs.build.js",children:"@cpp.js/package-webp/cppjs.build.js"})}),"\n",(0,s.jsx)(a.li,{children:(0,s.jsx)(a.a,{href:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-package-gdal/cppjs.build.js",children:"@cpp.js/package-gdal/cppjs.build.js"})}),"\n",(0,s.jsx)(a.li,{children:(0,s.jsx)(a.a,{href:"https://github.com/bugra9/cpp.js/blob/main/packages/cppjs-package-spatialite/cppjs.build.js",children:"@cpp.js/package-spatialite/cppjs.build.js"})}),"\n"]}),"\n",(0,s.jsx)(a.h4,{id:"package-structure",children:"Package Structure"}),"\n",(0,s.jsx)(a.pre,{children:(0,s.jsx)(a.code,{children:"\u251c\u2500\u2500 dist\n\u2502   \u251c\u2500\u2500 mylib.wasm\n\u2502   \u251c\u2500\u2500 mylib.browser.js\n\u2502   \u251c\u2500\u2500 mylib.node.js\n\u2502   \u2514\u2500\u2500 prebuilt\n\u2502       \u251c\u2500\u2500 Android-arm64-v8a\n\u2502       \u2502   \u251c\u2500\u2500 include\n\u2502       \u2502   \u2502   \u2514\u2500\u2500 ...\n\u2502       \u2502   \u2514\u2500\u2500 lib\n\u2502       \u2502       \u2514\u2500\u2500 mylib.so\n\u2502       \u2502\n\u2502       \u251c\u2500\u2500 Android-x86_64\n\u2502       \u2502   \u251c\u2500\u2500 include\n\u2502       \u2502   \u2502   \u2514\u2500\u2500 ...\n\u2502       \u2502   \u2514\u2500\u2500 lib\n\u2502       \u2502       \u2514\u2500\u2500 mylib.so\n\u2502       \u2502\n\u2502       \u251c\u2500\u2500 Emscripten-x86_64\n\u2502       \u2502   \u251c\u2500\u2500 include\n\u2502       \u2502   \u2502   \u2514\u2500\u2500 ...\n\u2502       \u2502   \u2514\u2500\u2500 lib\n\u2502       \u2502       \u2514\u2500\u2500 mylib.a\n\u2502       \u2502\n\u2502       \u251c\u2500\u2500 iOS-iphoneos\n\u2502       \u2502   \u251c\u2500\u2500 include\n\u2502       \u2502   \u2502   \u2514\u2500\u2500 ...\n\u2502       \u2502   \u2514\u2500\u2500 lib\n\u2502       \u2502       \u2514\u2500\u2500 mylib.a\n\u2502       \u2502\n\u2502       \u251c\u2500\u2500 iOS-iphonesimulator\n\u2502       \u2502   \u251c\u2500\u2500 include\n\u2502       \u2502   \u2502   \u2514\u2500\u2500 ...\n\u2502       \u2502   \u2514\u2500\u2500 lib\n\u2502       \u2502       \u2514\u2500\u2500 mylib.a\n\u2502       \u2502\n\u2502       \u251c\u2500\u2500 mylib.xcframework.zip\n\u2502       \u2514\u2500\u2500 CMakeLists.txt\n|\n\u2514\u2500\u2500 mylib.xcframework\n    \u251c\u2500\u2500 ios-arm64_arm64e\n    \u2502   \u251c\u2500\u2500 Headers\n    \u2502   \u2502   \u2514\u2500\u2500 ...\n    \u2502   \u2514\u2500\u2500 mylib.a\n    \u2502\n    \u251c\u2500\u2500 ios-arm64_arm64e_x86_64-simulator\n    \u2502   \u251c\u2500\u2500 Headers\n    \u2502   \u2502   \u2514\u2500\u2500 ...\n    \u2502   \u2514\u2500\u2500 mylib.a\n    \u2502\n    \u2514\u2500\u2500 Info.plist\n \n"})}),"\n",(0,s.jsx)(a.h4,{id:"configuration",children:"Configuration"}),"\n",(0,s.jsx)(a.pre,{children:(0,s.jsx)(a.code,{className:"language-diff",metastring:'title="cppjs.config.js"',children:"export default {\n    export: {\n+       type: 'cmake',\n    },\n    paths: {\n        config: import.meta.url,\n    },\n};\n"})}),"\n",(0,s.jsx)(a.admonition,{type:"info",children:(0,s.jsxs)(a.p,{children:["You can find the sample prebuilt package ",(0,s.jsx)(a.a,{href:"https://www.npmjs.com/package/@cpp.js/sample-lib-prebuilt-matrix",children:"here"}),"."]})}),"\n",(0,s.jsx)(a.h3,{id:"source-code-packages",children:"Source Code Packages"}),"\n",(0,s.jsx)(a.p,{children:"This package contains the raw C++ source code, which will be compiled during your project's build process. It\u2019s suitable for users who want more control over the compilation or need platform-specific customizations."}),"\n",(0,s.jsx)(a.h4,{id:"usage-1",children:"Usage"}),"\n",(0,s.jsxs)(a.p,{children:["Import the necessary header file directly from the package. Header files can be accessed from the ",(0,s.jsx)(a.code,{children:"src/native"})," path."]}),"\n",(0,s.jsx)(a.p,{children:"Here is a minimal example:"}),"\n",(0,s.jsx)(a.pre,{children:(0,s.jsx)(a.code,{className:"language-js",metastring:'title="JavaScript"',children:"import { initCppJs, SampleBasic } from '@cppjs/sample-lib-source/samplebasic.h';\n\nawait initCppJs();\n"})}),"\n",(0,s.jsx)(a.h4,{id:"package-structure-1",children:"Package Structure"}),"\n",(0,s.jsx)(a.pre,{children:(0,s.jsx)(a.code,{children:"\u2514\u2500\u2500 src\n    \u2514\u2500\u2500 native\n        \u251c\u2500\u2500 samplebasic.h\n        \u2514\u2500\u2500 samplebasic.cpp\n"})}),"\n",(0,s.jsx)(a.h4,{id:"configuration-1",children:"Configuration"}),"\n",(0,s.jsx)(a.pre,{children:(0,s.jsx)(a.code,{className:"language-diff",metastring:'title="cppjs.config.js"',children:"export default {\n    export: {\n+       type: 'source',\n    },\n    paths: {\n        config: import.meta.url,\n    },\n};\n"})}),"\n",(0,s.jsx)(a.admonition,{type:"info",children:(0,s.jsxs)(a.p,{children:["You can find the sample source code package ",(0,s.jsx)(a.a,{href:"https://www.npmjs.com/package/@cppjs/sample-lib-source",children:"here"}),"."]})}),"\n",(0,s.jsx)(a.h3,{id:"cmake-packages",children:"Cmake Packages"}),"\n",(0,s.jsx)(a.p,{children:"In addition to the source code, this package includes a CMakeLists.txt file, which provides users with more flexibility when integrating with custom CMake build systems. This package is ideal for projects that rely on CMake to manage builds and dependencies."}),"\n",(0,s.jsx)(a.h4,{id:"usage-2",children:"Usage"}),"\n",(0,s.jsxs)(a.p,{children:["Import the necessary header file directly from the package. Header files can be accessed from the ",(0,s.jsx)(a.code,{children:"src/native"})," path."]}),"\n",(0,s.jsx)(a.p,{children:"Here is a minimal example:"}),"\n",(0,s.jsx)(a.pre,{children:(0,s.jsx)(a.code,{className:"language-js",metastring:'title="JavaScript"',children:"import { initCppJs, SampleBasicCmake } from '@cpp.js/sample-lib-cmake/samplebasiccmake.h';\n\nawait initCppJs();\n"})}),"\n",(0,s.jsx)(a.h4,{id:"package-structure-2",children:"Package Structure"}),"\n",(0,s.jsx)(a.pre,{children:(0,s.jsx)(a.code,{children:"\u251c\u2500\u2500 src\n\u2502   \u2514\u2500\u2500 native\n\u2502       \u251c\u2500\u2500 samplebasiccmake.h\n\u2502       \u2514\u2500\u2500 samplebasiccmake.cpp\n\u2502\n\u2514\u2500\u2500 CMakeLists.txt\n"})}),"\n",(0,s.jsx)(a.h4,{id:"configuration-2",children:"Configuration"}),"\n",(0,s.jsx)(a.pre,{children:(0,s.jsx)(a.code,{className:"language-diff",metastring:'title="cppjs.config.js"',children:"export default {\n    export: {\n+       type: 'cmake',\n    },\n    paths: {\n        config: import.meta.url,\n    },\n};\n"})}),"\n",(0,s.jsx)(a.admonition,{type:"info",children:(0,s.jsxs)(a.p,{children:["You can find the cmake package ",(0,s.jsx)(a.a,{href:"https://www.npmjs.com/package/@cpp.js/sample-lib-cmake",children:"here"}),"."]})})]})}function d(e={}){const{wrapper:a}={...(0,c.R)(),...e.components};return a?(0,s.jsx)(a,{...e,children:(0,s.jsx)(o,{...e})}):o(e)}},7266:(e,a,i)=>{i.d(a,{R:()=>r,x:()=>t});var n=i(8225);const s={},c=n.createContext(s);function r(e){const a=n.useContext(c);return n.useMemo((function(){return"function"==typeof e?e(a):{...a,...e}}),[a,e])}function t(e){let a;return a=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:r(e.components),n.createElement(c.Provider,{value:a},e.children)}}}]);
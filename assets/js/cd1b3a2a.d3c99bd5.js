"use strict";(self.webpackChunk_cpp_js_website=self.webpackChunk_cpp_js_website||[]).push([[7684],{3125:(e,a,n)=>{n.r(a),n.d(a,{assets:()=>l,contentTitle:()=>r,default:()=>d,frontMatter:()=>t,metadata:()=>c,toc:()=>o});var i=n(6106),s=n(945);const t={},r="Packages",c={id:"guide/features/packages",title:"Packages",description:"Cpp.js offers flexibility with three types of packages, all available on NPM. You can use the existing packages or publish your own.",source:"@site/docs/guide/features/packages.md",sourceDirName:"guide/features",slug:"/guide/features/packages",permalink:"/docs/guide/features/packages",draft:!1,unlisted:!1,tags:[],version:"current",lastUpdatedAt:1734793756e3,frontMatter:{},sidebar:"guide",previous:{title:"Monorepo",permalink:"/docs/guide/features/monorepo"},next:{title:"Plugins",permalink:"/docs/guide/features/plugins"}},l={},o=[{value:"Prebuilt Packages",id:"prebuilt-packages",level:3},{value:"Usage",id:"usage",level:4},{value:"Package Structure",id:"package-structure",level:4},{value:"Configuration",id:"configuration",level:4},{value:"Source Code Packages",id:"source-code-packages",level:3},{value:"Usage",id:"usage-1",level:4},{value:"Package Structure",id:"package-structure-1",level:4},{value:"Configuration",id:"configuration-1",level:4},{value:"Cmake Packages",id:"cmake-packages",level:3},{value:"Usage",id:"usage-2",level:4},{value:"Package Structure",id:"package-structure-2",level:4},{value:"Configuration",id:"configuration-2",level:4}];function p(e){const a={a:"a",admonition:"admonition",code:"code",h1:"h1",h3:"h3",h4:"h4",header:"header",p:"p",pre:"pre",...(0,s.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(a.header,{children:(0,i.jsx)(a.h1,{id:"packages",children:"Packages"})}),"\n",(0,i.jsx)(a.p,{children:"Cpp.js offers flexibility with three types of packages, all available on NPM. You can use the existing packages or publish your own."}),"\n",(0,i.jsx)(a.h3,{id:"prebuilt-packages",children:"Prebuilt Packages"}),"\n",(0,i.jsx)(a.p,{children:"This package includes prebuilt libraries for different platforms (Web, Android, iOS), enabling quick integration without needing to compile. By default, a package is of this type, meaning that most packages fall into this category."}),"\n",(0,i.jsx)(a.h4,{id:"usage",children:"Usage"}),"\n",(0,i.jsxs)(a.p,{children:["Import the necessary header file directly from the package. Header files can be accessed from the ",(0,i.jsx)(a.code,{children:"dist/prebuilt/PLATFORM_NAME/include"})," path."]}),"\n",(0,i.jsx)(a.p,{children:"Here is a minimal example:"}),"\n",(0,i.jsx)(a.pre,{children:(0,i.jsx)(a.code,{className:"language-js",metastring:'title="JavaScript"',children:"import { initCppJs } '@cpp.js/package-gdal/gdal.h';\n\nconst { Gdal } = await initCppJs();\n"})}),"\n",(0,i.jsx)(a.h4,{id:"package-structure",children:"Package Structure"}),"\n",(0,i.jsx)(a.pre,{children:(0,i.jsx)(a.code,{children:"\u2514\u2500\u2500 dist\n    \u251c\u2500\u2500 mylib.wasm\n    \u251c\u2500\u2500 mylib.browser.js\n    \u251c\u2500\u2500 mylib.node.js\n    \u2514\u2500\u2500 prebuilt\n        \u251c\u2500\u2500 Android-arm64-v8a\n        \u2502   \u251c\u2500\u2500 include\n        \u2502   \u2502   \u2514\u2500\u2500 ...\n        \u2502   \u2514\u2500\u2500 lib\n        \u2502       \u2514\u2500\u2500 mylib.so\n        \u2502\n        \u251c\u2500\u2500 Emscripten-x86_64\n        \u2502   \u251c\u2500\u2500 include\n        \u2502   \u2502   \u2514\u2500\u2500 ...\n        \u2502   \u2514\u2500\u2500 lib\n        \u2502       \u2514\u2500\u2500 mylib.a\n        \u2502\n        \u251c\u2500\u2500 iOS-iphoneos\n        \u2502   \u251c\u2500\u2500 include\n        \u2502   \u2502   \u2514\u2500\u2500 ...\n        \u2502   \u2514\u2500\u2500 lib\n        \u2502       \u2514\u2500\u2500 mylib.a\n        \u2502\n        \u251c\u2500\u2500 iOS-iphonesimulator\n        \u2502   \u251c\u2500\u2500 include\n        \u2502   \u2502   \u2514\u2500\u2500 ...\n        \u2502   \u2514\u2500\u2500 lib\n        \u2502       \u2514\u2500\u2500 mylib.a\n        \u2502\n        \u251c\u2500\u2500 mylib.xcframework\n        \u2502   \u251c\u2500\u2500 ios-arm64_arm64e\n        \u2502   \u2502   \u251c\u2500\u2500 Headers\n        \u2502   \u2502   \u2502   \u2514\u2500\u2500 ...\n        \u2502   \u2502   \u2514\u2500\u2500 mylib.a\n        \u2502   \u2502\n        \u2502   \u251c\u2500\u2500 ios-arm64_arm64e_x86_64-simulator\n        \u2502   \u2502   \u251c\u2500\u2500 Headers\n        \u2502   \u2502   \u2502   \u2514\u2500\u2500 ...\n        \u2502   \u2502   \u2514\u2500\u2500 mylib.a\n        \u2502   \u2502\n        \u2502   \u2514\u2500\u2500 Info.plist\n        \u2502\n        \u251c\u2500\u2500 mylib.xcframework.zip\n        \u2514\u2500\u2500 CMakeLists.txt\n\n"})}),"\n",(0,i.jsx)(a.h4,{id:"configuration",children:"Configuration"}),"\n",(0,i.jsx)(a.pre,{children:(0,i.jsx)(a.code,{className:"language-diff",metastring:'title="cppjs.config.js"',children:"import getDirName from 'cpp.js/src/utils/getDirName.js';\n\nexport default {\n    export: {\n+       type: 'cmake',\n    },\n    paths: {\n        project: getDirName(import.meta.url),\n    },\n};\n"})}),"\n",(0,i.jsx)(a.admonition,{type:"info",children:(0,i.jsxs)(a.p,{children:["You can find the sample prebuilt package ",(0,i.jsx)(a.a,{href:"https://www.npmjs.com/package/@cpp.js/sample-lib-prebuilt-matrix",children:"here"}),"."]})}),"\n",(0,i.jsx)(a.h3,{id:"source-code-packages",children:"Source Code Packages"}),"\n",(0,i.jsx)(a.p,{children:"This package contains the raw C++ source code, which will be compiled during your project's build process. It\u2019s suitable for users who want more control over the compilation or need platform-specific customizations."}),"\n",(0,i.jsx)(a.h4,{id:"usage-1",children:"Usage"}),"\n",(0,i.jsxs)(a.p,{children:["Import the necessary header file directly from the package. Header files can be accessed from the ",(0,i.jsx)(a.code,{children:"src/native"})," path."]}),"\n",(0,i.jsx)(a.p,{children:"Here is a minimal example:"}),"\n",(0,i.jsx)(a.pre,{children:(0,i.jsx)(a.code,{className:"language-js",metastring:'title="JavaScript"',children:"import { initCppJs } '@cppjs/sample-lib-source/samplebasic.h';\n\nconst { SampleBasic } = await initCppJs();\n"})}),"\n",(0,i.jsx)(a.h4,{id:"package-structure-1",children:"Package Structure"}),"\n",(0,i.jsx)(a.pre,{children:(0,i.jsx)(a.code,{children:"\u2514\u2500\u2500 src\n    \u2514\u2500\u2500 native\n        \u251c\u2500\u2500 samplebasic.h\n        \u2514\u2500\u2500 samplebasic.cpp\n"})}),"\n",(0,i.jsx)(a.h4,{id:"configuration-1",children:"Configuration"}),"\n",(0,i.jsx)(a.pre,{children:(0,i.jsx)(a.code,{className:"language-diff",metastring:'title="cppjs.config.js"',children:"import getDirName from 'cpp.js/src/utils/getDirName.js';\n\nexport default {\n    export: {\n+       type: 'source',\n    },\n    paths: {\n        project: getDirName(import.meta.url),\n    },\n};\n"})}),"\n",(0,i.jsx)(a.admonition,{type:"info",children:(0,i.jsxs)(a.p,{children:["You can find the sample source code package ",(0,i.jsx)(a.a,{href:"https://www.npmjs.com/package/@cppjs/sample-lib-source",children:"here"}),"."]})}),"\n",(0,i.jsx)(a.h3,{id:"cmake-packages",children:"Cmake Packages"}),"\n",(0,i.jsx)(a.p,{children:"In addition to the source code, this package includes a CMakeLists.txt file, which provides users with more flexibility when integrating with custom CMake build systems. This package is ideal for projects that rely on CMake to manage builds and dependencies."}),"\n",(0,i.jsx)(a.h4,{id:"usage-2",children:"Usage"}),"\n",(0,i.jsxs)(a.p,{children:["Import the necessary header file directly from the package. Header files can be accessed from the ",(0,i.jsx)(a.code,{children:"src/native"})," path."]}),"\n",(0,i.jsx)(a.p,{children:"Here is a minimal example:"}),"\n",(0,i.jsx)(a.pre,{children:(0,i.jsx)(a.code,{className:"language-js",metastring:'title="JavaScript"',children:"import { initCppJs } '@cpp.js/sample-lib-cmake/samplebasiccmake.h';\n\nconst { SampleBasicCmake } = await initCppJs();\n"})}),"\n",(0,i.jsx)(a.h4,{id:"package-structure-2",children:"Package Structure"}),"\n",(0,i.jsx)(a.pre,{children:(0,i.jsx)(a.code,{children:"\u251c\u2500\u2500 src\n\u2502   \u2514\u2500\u2500 native\n\u2502       \u251c\u2500\u2500 samplebasiccmake.h\n\u2502       \u2514\u2500\u2500 samplebasiccmake.cpp\n\u2502\n\u2514\u2500\u2500 CMakeLists.txt\n"})}),"\n",(0,i.jsx)(a.h4,{id:"configuration-2",children:"Configuration"}),"\n",(0,i.jsx)(a.pre,{children:(0,i.jsx)(a.code,{className:"language-diff",metastring:'title="cppjs.config.js"',children:"import getDirName from 'cpp.js/src/utils/getDirName.js';\n\nexport default {\n    export: {\n+       type: 'cmake',\n    },\n    paths: {\n        project: getDirName(import.meta.url),\n    },\n};\n"})}),"\n",(0,i.jsx)(a.admonition,{type:"info",children:(0,i.jsxs)(a.p,{children:["You can find the cmake package ",(0,i.jsx)(a.a,{href:"https://www.npmjs.com/package/@cpp.js/sample-lib-cmake",children:"here"}),"."]})})]})}function d(e={}){const{wrapper:a}={...(0,s.R)(),...e.components};return a?(0,i.jsx)(a,{...e,children:(0,i.jsx)(p,{...e})}):p(e)}},945:(e,a,n)=>{n.d(a,{R:()=>r,x:()=>c});var i=n(7378);const s={},t=i.createContext(s);function r(e){const a=i.useContext(t);return i.useMemo((function(){return"function"==typeof e?e(a):{...a,...e}}),[a,e])}function c(e){let a;return a=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:r(e.components),i.createElement(t.Provider,{value:a},e.children)}}}]);
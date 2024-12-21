"use strict";(self.webpackChunk_cpp_js_website=self.webpackChunk_cpp_js_website||[]).push([[8965],{9657:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>u,contentTitle:()=>l,default:()=>h,frontMatter:()=>o,metadata:()=>c,toc:()=>d});var r=t(6106),a=t(6952),s=t(6212),i=t(598);const o={},l="Expo",c={id:"guide/integrate-into-existing-project/expo",title:"Expo",description:"To proceed with incorporating custom native code, you need to transition from Expo Go to a development build. This is necessary because Expo Go only supports libraries included in the Expo SDK or those without custom native code.",source:"@site/docs/guide/integrate-into-existing-project/expo.md",sourceDirName:"guide/integrate-into-existing-project",slug:"/guide/integrate-into-existing-project/expo",permalink:"/docs/guide/integrate-into-existing-project/expo",draft:!1,unlisted:!1,tags:[],version:"current",lastUpdatedAt:1734777283e3,frontMatter:{},sidebar:"guide",previous:{title:"React Native",permalink:"/docs/guide/integrate-into-existing-project/react-native"},next:{title:"Calling C++ from JavaScript",permalink:"/docs/guide/features/calling-cpp-from-javascript"}},u={},d=[{value:"Run on iOS",id:"run-on-ios",level:3},{value:"Run on Android",id:"run-on-android",level:3}];function p(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",h3:"h3",header:"header",p:"p",pre:"pre",strong:"strong",...(0,a.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.header,{children:(0,r.jsx)(n.h1,{id:"expo",children:"Expo"})}),"\n",(0,r.jsx)(n.p,{children:"To proceed with incorporating custom native code, you need to transition from Expo Go to a development build. This is necessary because Expo Go only supports libraries included in the Expo SDK or those without custom native code."}),"\n",(0,r.jsx)(n.p,{children:"If your project does not currently include the 'ios' and 'android' directories, you can create them by executing the following command in your project directory:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"npx expo prebuild\nnpx expo customize metro.config.js\n"})}),"\n",(0,r.jsx)(n.p,{children:"This creates the android and ios directories for running your React code."}),"\n",(0,r.jsx)(n.p,{children:"To integrate cpp.js into your project using React Native, you can utilize the @cpp.js/plugin-react-native, @cpp.js/plugin-react-native-ios-helper. Start by installing these package with the following command:"}),"\n",(0,r.jsxs)(s.A,{groupId:"npm2yarn",children:[(0,r.jsx)(i.A,{value:"npm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"npm install @cpp.js/plugin-react-native @cpp.js/plugin-react-native-ios-helper\n"})})}),(0,r.jsx)(i.A,{value:"yarn",label:"Yarn",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"yarn add @cpp.js/plugin-react-native @cpp.js/plugin-react-native-ios-helper\n"})})}),(0,r.jsx)(i.A,{value:"pnpm",label:"pnpm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"pnpm add @cpp.js/plugin-react-native @cpp.js/plugin-react-native-ios-helper\n"})})}),(0,r.jsx)(i.A,{value:"bun",label:"bun",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"bun add @cpp.js/plugin-react-native @cpp.js/plugin-react-native-ios-helper\n"})})})]}),"\n",(0,r.jsxs)(n.p,{children:["To enable the plugin, modify the ",(0,r.jsx)(n.code,{children:"metro.config.js"})," file as shown below."]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-diff",metastring:'title="metro.config.js"',children:"// Learn more https://docs.expo.io/guides/customizing-metro\nconst { getDefaultConfig } = require('expo/metro-config');\n+const { mergeConfig } = require('metro-config');\n+const CppjsMetroPlugin = require('@cpp.js/plugin-metro/metro-plugin.cjs');\n\n/** @type {import('expo/metro-config').MetroConfig} */\nconst config = getDefaultConfig(__dirname);\n\n+const newConfig = {\n+    ...CppjsMetroPlugin(config),\n+};\n\n-module.exports = config;\n+module.exports = mergeConfig(config, newConfig);\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Cpp.js requires a configuration file to work. For a minimal setup, create a ",(0,r.jsx)(n.code,{children:"cppjs.config.mjs"})," file and add the following content."]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-js",metastring:'title="cppjs.config.mjs"',children:"import getDirName from 'cpp.js/src/utils/getDirName.js';\n\nexport default {\n    paths: {\n        project: getDirName(import.meta.url),\n    },\n};\n"})}),"\n",(0,r.jsx)(n.p,{children:"Move your C++ code to the src/native directory. For example;"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-cpp",metastring:'title="src/native/MySampleClass.h"',children:'#pragma once\n#include <string>\n\nclass MySampleClass {\npublic:\n    static std::string sample() {\n        return "Hello World!";\n    }\n};\n'})}),"\n",(0,r.jsx)(n.p,{children:"Modify the React file to call the c++ function from your React page. For example;"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-diff",metastring:'title="app/(tabs)/index.tsx"',children:"+import { useState, useEffect } from 'react';\n+import '../../src/native/MySampleClass.h';\n+import { initCppJs } from 'cpp.js';\n\nexport default function HomeScreen() {\n+  const [message, setMessage] = useState('compiling ...');\n\n+  useEffect(() => {\n+    initCppJs().then(({ MySampleClass }) => {\n+        setMessage(MySampleClass.sample());\n+    });\n+  }, []);\n\n  return (\n      <ThemedView style={styles.titleContainer}>\n-       <ThemedText type=\"title\">Welcome!</ThemedText>\n+       <ThemedText type=\"title\">Response from c++ : {message}</ThemedText>\n        <HelloWave />\n      </ThemedView>\n  );\n}\n"})}),"\n",(0,r.jsx)(n.p,{children:"The project is now fully set up and ready to run."}),"\n",(0,r.jsx)(n.admonition,{type:"warning",children:(0,r.jsxs)(n.p,{children:["Before proceeding, ensure that you have met all the ",(0,r.jsx)(n.a,{href:"/docs/guide/getting-started/prerequisites",children:"prerequisites"})," for setting up a working development environment."]})}),"\n",(0,r.jsx)(n.h3,{id:"run-on-ios",children:"Run on iOS"}),"\n",(0,r.jsx)(n.p,{children:"You can run the app on iOS using the following command:"}),"\n",(0,r.jsxs)(s.A,{groupId:"npm2yarn",children:[(0,r.jsx)(i.A,{value:"npm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"npm run ios\n"})})}),(0,r.jsx)(i.A,{value:"yarn",label:"Yarn",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"yarn ios\n"})})}),(0,r.jsx)(i.A,{value:"pnpm",label:"pnpm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"pnpm run ios\n"})})}),(0,r.jsx)(i.A,{value:"bun",label:"bun",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"bun run ios\n"})})})]}),"\n",(0,r.jsx)(n.h3,{id:"run-on-android",children:"Run on Android"}),"\n",(0,r.jsx)(n.p,{children:"You can run the app on Android using the following command:"}),"\n",(0,r.jsxs)(s.A,{groupId:"npm2yarn",children:[(0,r.jsx)(i.A,{value:"npm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"npm run android\n"})})}),(0,r.jsx)(i.A,{value:"yarn",label:"Yarn",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"yarn android\n"})})}),(0,r.jsx)(i.A,{value:"pnpm",label:"pnpm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"pnpm run android\n"})})}),(0,r.jsx)(i.A,{value:"bun",label:"bun",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"bun run android\n"})})})]}),"\n",(0,r.jsx)(n.admonition,{type:"info",children:(0,r.jsxs)(n.p,{children:[(0,r.jsx)(n.strong,{children:"Sample Source Code:"})," You can access the sample source code from ",(0,r.jsx)(n.a,{href:"https://github.com/bugra9/cpp.js/tree/main/packages/cppjs-sample-mobile-reactnative-expo",children:"this link"}),"."]})})]})}function h(e={}){const{wrapper:n}={...(0,a.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(p,{...e})}):p(e)}},598:(e,n,t)=>{t.d(n,{A:()=>i});t(7378);var r=t(3372);const a={tabItem:"tabItem_tIVj"};var s=t(6106);function i(e){let{children:n,hidden:t,className:i}=e;return(0,s.jsx)("div",{role:"tabpanel",className:(0,r.A)(a.tabItem,i),hidden:t,children:n})}},6212:(e,n,t)=>{t.d(n,{A:()=>w});var r=t(7378),a=t(3372),s=t(5849),i=t(505),o=t(2938),l=t(2578),c=t(3947),u=t(5586);function d(e){return r.Children.toArray(e).filter((e=>"\n"!==e)).map((e=>{if(!e||(0,r.isValidElement)(e)&&function(e){const{props:n}=e;return!!n&&"object"==typeof n&&"value"in n}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}function p(e){const{values:n,children:t}=e;return(0,r.useMemo)((()=>{const e=n??function(e){return d(e).map((e=>{let{props:{value:n,label:t,attributes:r,default:a}}=e;return{value:n,label:t,attributes:r,default:a}}))}(t);return function(e){const n=(0,c.XI)(e,((e,n)=>e.value===n.value));if(n.length>0)throw new Error(`Docusaurus error: Duplicate values "${n.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[n,t])}function h(e){let{value:n,tabValues:t}=e;return t.some((e=>e.value===n))}function m(e){let{queryString:n=!1,groupId:t}=e;const a=(0,i.W6)(),s=function(e){let{queryString:n=!1,groupId:t}=e;if("string"==typeof n)return n;if(!1===n)return null;if(!0===n&&!t)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return t??null}({queryString:n,groupId:t});return[(0,l.aZ)(s),(0,r.useCallback)((e=>{if(!s)return;const n=new URLSearchParams(a.location.search);n.set(s,e),a.replace({...a.location,search:n.toString()})}),[s,a])]}function g(e){const{defaultValue:n,queryString:t=!1,groupId:a}=e,s=p(e),[i,l]=(0,r.useState)((()=>function(e){let{defaultValue:n,tabValues:t}=e;if(0===t.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(n){if(!h({value:n,tabValues:t}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${n}" but none of its children has the corresponding value. Available values are: ${t.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return n}const r=t.find((e=>e.default))??t[0];if(!r)throw new Error("Unexpected error: 0 tabValues");return r.value}({defaultValue:n,tabValues:s}))),[c,d]=m({queryString:t,groupId:a}),[g,f]=function(e){let{groupId:n}=e;const t=function(e){return e?`docusaurus.tab.${e}`:null}(n),[a,s]=(0,u.Dv)(t);return[a,(0,r.useCallback)((e=>{t&&s.set(e)}),[t,s])]}({groupId:a}),x=(()=>{const e=c??g;return h({value:e,tabValues:s})?e:null})();(0,o.A)((()=>{x&&l(x)}),[x]);return{selectedValue:i,selectValue:(0,r.useCallback)((e=>{if(!h({value:e,tabValues:s}))throw new Error(`Can't select invalid tab value=${e}`);l(e),d(e),f(e)}),[d,f,s]),tabValues:s}}var f=t(4050);const x={tabList:"tabList_V5ZB",tabItem:"tabItem_cfzH"};var j=t(6106);function b(e){let{className:n,block:t,selectedValue:r,selectValue:i,tabValues:o}=e;const l=[],{blockElementScrollPositionUntilNextRender:c}=(0,s.a_)(),u=e=>{const n=e.currentTarget,t=l.indexOf(n),a=o[t].value;a!==r&&(c(n),i(a))},d=e=>{let n=null;switch(e.key){case"Enter":u(e);break;case"ArrowRight":{const t=l.indexOf(e.currentTarget)+1;n=l[t]??l[0];break}case"ArrowLeft":{const t=l.indexOf(e.currentTarget)-1;n=l[t]??l[l.length-1];break}}n?.focus()};return(0,j.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,a.A)("tabs",{"tabs--block":t},n),children:o.map((e=>{let{value:n,label:t,attributes:s}=e;return(0,j.jsx)("li",{role:"tab",tabIndex:r===n?0:-1,"aria-selected":r===n,ref:e=>l.push(e),onKeyDown:d,onClick:u,...s,className:(0,a.A)("tabs__item",x.tabItem,s?.className,{"tabs__item--active":r===n}),children:t??n},n)}))})}function v(e){let{lazy:n,children:t,selectedValue:s}=e;const i=(Array.isArray(t)?t:[t]).filter(Boolean);if(n){const e=i.find((e=>e.props.value===s));return e?(0,r.cloneElement)(e,{className:(0,a.A)("margin-top--md",e.props.className)}):null}return(0,j.jsx)("div",{className:"margin-top--md",children:i.map(((e,n)=>(0,r.cloneElement)(e,{key:n,hidden:e.props.value!==s})))})}function y(e){const n=g(e);return(0,j.jsxs)("div",{className:(0,a.A)("tabs-container",x.tabList),children:[(0,j.jsx)(b,{...n,...e}),(0,j.jsx)(v,{...n,...e})]})}function w(e){const n=(0,f.A)();return(0,j.jsx)(y,{...e,children:d(e.children)},String(n))}},6952:(e,n,t)=>{t.d(n,{R:()=>i,x:()=>o});var r=t(7378);const a={},s=r.createContext(a);function i(e){const n=r.useContext(s);return r.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:i(e.components),r.createElement(s.Provider,{value:n},e.children)}}}]);
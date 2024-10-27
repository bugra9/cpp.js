"use strict";(self.webpackChunk_cpp_js_website=self.webpackChunk_cpp_js_website||[]).push([[9932],{9940:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>p,contentTitle:()=>c,default:()=>m,frontMatter:()=>l,metadata:()=>o,toc:()=>u});var r=t(7512),a=t(2436),s=t(6504),i=t(6840);const l={},c="Rspack",o={id:"guide/integrate-into-existing-project/rspack",title:"Rspack",description:"To integrate cpp.js into your project using Rspack as a bundler, you can utilize the @cpp.js/plugin-webpack and @cpp.js/plugin-webpack-loader plugins. Start by installing these packages with the following command:",source:"@site/docs/guide/integrate-into-existing-project/rspack.md",sourceDirName:"guide/integrate-into-existing-project",slug:"/guide/integrate-into-existing-project/rspack",permalink:"/docs/guide/integrate-into-existing-project/rspack",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"guide",previous:{title:"Vite",permalink:"/docs/guide/integrate-into-existing-project/vite"},next:{title:"CRA (Create React App)",permalink:"/docs/guide/integrate-into-existing-project/create-react-app"}},p={},u=[];function d(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",header:"header",p:"p",pre:"pre",strong:"strong",...(0,a.M)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.header,{children:(0,r.jsx)(n.h1,{id:"rspack",children:"Rspack"})}),"\n",(0,r.jsx)(n.p,{children:"To integrate cpp.js into your project using Rspack as a bundler, you can utilize the @cpp.js/plugin-webpack and @cpp.js/plugin-webpack-loader plugins. Start by installing these packages with the following command:"}),"\n",(0,r.jsxs)(s.c,{groupId:"npm2yarn",children:[(0,r.jsx)(i.c,{value:"npm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"npm install @cpp.js/plugin-webpack @cpp.js/plugin-webpack-loader --save-dev\n"})})}),(0,r.jsx)(i.c,{value:"yarn",label:"Yarn",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"yarn add @cpp.js/plugin-webpack @cpp.js/plugin-webpack-loader --dev\n"})})}),(0,r.jsx)(i.c,{value:"pnpm",label:"pnpm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"pnpm add @cpp.js/plugin-webpack @cpp.js/plugin-webpack-loader --save-dev\n"})})}),(0,r.jsx)(i.c,{value:"bun",label:"bun",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"bun add @cpp.js/plugin-webpack @cpp.js/plugin-webpack-loader --dev\n"})})})]}),"\n",(0,r.jsxs)(n.p,{children:["To enable the plugin, modify the ",(0,r.jsx)(n.code,{children:"rspack.config.mjs"})," file as shown below."]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-diff",metastring:'title="rspack.config.mjs"',children:"+ import CppjsWebpackPlugin from '@cpp.js/plugin-webpack';\n\n+ const cppjsWebpackPlugin = new CppjsWebpackPlugin();\n+ const compiler = cppjsWebpackPlugin.getCompiler();\n\nexport default defineConfig({\n\tmodule: {\n\t\trules: [\n+            {\n+                test: /\\.h$/,\n+                loader: '@cpp.js/plugin-webpack-loader',\n+                options: { compiler },\n+            }\n\t\t]\n\t},\n\tplugins: [\n+         cppjsWebpackPlugin,\n\t].filter(Boolean),\n+     devServer: {\n+         watchFiles: compiler.config.paths.native,\n+         setupMiddlewares: (middlewares, devServer) => {\n+             if (!devServer) {\n+                 throw new Error('@rspack/dev-server is not defined');\n+             }\n+ \n+             middlewares.unshift({\n+                 name: '/cpp.js',\n+                 path: '/cpp.js',\n+                 middleware: (req, res) => {\n+                     res.sendFile(`${compiler.config.paths.temp}/${compiler.config.general.name}.browser.js`);\n+                 },\n+             });\n+             middlewares.unshift({\n+                 name: '/cpp.wasm',\n+                 path: '/cpp.wasm',\n+                 middleware: (req, res) => {\n+                     res.send(fs.readFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.wasm`));\n+                 },\n+             });\n+ \n+             return middlewares;\n+         },\n+     },\n});\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Cpp.js requires a configuration file to work. For a minimal setup, create a ",(0,r.jsx)(n.code,{children:"cppjs.config.mjs"})," file and add the following content."]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-js",metastring:'title="cppjs.config.mjs"',children:"import getDirName from 'cpp.js/src/utils/getDirName.js';\n\nexport default {\n    paths: {\n        project: getDirName(import.meta.url),\n    },\n};\n"})}),"\n",(0,r.jsx)(n.p,{children:"Move your C++ code to the src/native directory. For example;"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-cpp",metastring:'title="src/native/MySampleClass.h"',children:'#pragma once\n#include <string>\n\nclass MySampleClass {\npublic:\n    static std::string sample() {\n        return "Hello World!";\n    }\n};\n'})}),"\n",(0,r.jsx)(n.p,{children:"Modify the JavaScript file to call the C++ function. For example:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-js",children:"import { initCppJs } from './native/native.h'\n\ninitCppJs().then(({ MySampleClass }) => {;\n  console.log(MySampleClass.sample());\n});\n"})}),"\n",(0,r.jsx)(n.p,{children:"The project is now fully set up and ready to run."}),"\n",(0,r.jsx)(n.admonition,{type:"warning",children:(0,r.jsxs)(n.p,{children:["Before proceeding, ensure that you have met all the ",(0,r.jsx)(n.a,{href:"/docs/guide/getting-started/prerequisites",children:"prerequisites"})," for setting up a working development environment."]})}),"\n",(0,r.jsx)(n.admonition,{type:"info",children:(0,r.jsxs)(n.p,{children:[(0,r.jsx)(n.strong,{children:"Sample Source Code:"})," You can access the sample source code from ",(0,r.jsx)(n.a,{href:"https://github.com/bugra9/cpp.js/tree/main/packages/cppjs-sample-web-react-rspack",children:"this link"}),"."]})})]})}function m(e={}){const{wrapper:n}={...(0,a.M)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(d,{...e})}):d(e)}},6840:(e,n,t)=>{t.d(n,{c:()=>i});t(5496);var r=t(9805);const a={tabItem:"tabItem_QW3X"};var s=t(7512);function i(e){let{children:n,hidden:t,className:i}=e;return(0,s.jsx)("div",{role:"tabpanel",className:(0,r.c)(a.tabItem,i),hidden:t,children:n})}},6504:(e,n,t)=>{t.d(n,{c:()=>k});var r=t(5496),a=t(9805),s=t(448),i=t(6252),l=t(6976),c=t(9140),o=t(4436),p=t(6036);function u(e){return r.Children.toArray(e).filter((e=>"\n"!==e)).map((e=>{if(!e||(0,r.isValidElement)(e)&&function(e){const{props:n}=e;return!!n&&"object"==typeof n&&"value"in n}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}function d(e){const{values:n,children:t}=e;return(0,r.useMemo)((()=>{const e=n??function(e){return u(e).map((e=>{let{props:{value:n,label:t,attributes:r,default:a}}=e;return{value:n,label:t,attributes:r,default:a}}))}(t);return function(e){const n=(0,o.wn)(e,((e,n)=>e.value===n.value));if(n.length>0)throw new Error(`Docusaurus error: Duplicate values "${n.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[n,t])}function m(e){let{value:n,tabValues:t}=e;return t.some((e=>e.value===n))}function h(e){let{queryString:n=!1,groupId:t}=e;const a=(0,i.Uz)(),s=function(e){let{queryString:n=!1,groupId:t}=e;if("string"==typeof n)return n;if(!1===n)return null;if(!0===n&&!t)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return t??null}({queryString:n,groupId:t});return[(0,c._M)(s),(0,r.useCallback)((e=>{if(!s)return;const n=new URLSearchParams(a.location.search);n.set(s,e),a.replace({...a.location,search:n.toString()})}),[s,a])]}function g(e){const{defaultValue:n,queryString:t=!1,groupId:a}=e,s=d(e),[i,c]=(0,r.useState)((()=>function(e){let{defaultValue:n,tabValues:t}=e;if(0===t.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(n){if(!m({value:n,tabValues:t}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${n}" but none of its children has the corresponding value. Available values are: ${t.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return n}const r=t.find((e=>e.default))??t[0];if(!r)throw new Error("Unexpected error: 0 tabValues");return r.value}({defaultValue:n,tabValues:s}))),[o,u]=h({queryString:t,groupId:a}),[g,f]=function(e){let{groupId:n}=e;const t=function(e){return e?`docusaurus.tab.${e}`:null}(n),[a,s]=(0,p.IN)(t);return[a,(0,r.useCallback)((e=>{t&&s.set(e)}),[t,s])]}({groupId:a}),j=(()=>{const e=o??g;return m({value:e,tabValues:s})?e:null})();(0,l.c)((()=>{j&&c(j)}),[j]);return{selectedValue:i,selectValue:(0,r.useCallback)((e=>{if(!m({value:e,tabValues:s}))throw new Error(`Can't select invalid tab value=${e}`);c(e),u(e),f(e)}),[u,f,s]),tabValues:s}}var f=t(4888);const j={tabList:"tabList_BGj2",tabItem:"tabItem_lL16"};var b=t(7512);function v(e){let{className:n,block:t,selectedValue:r,selectValue:i,tabValues:l}=e;const c=[],{blockElementScrollPositionUntilNextRender:o}=(0,s.MV)(),p=e=>{const n=e.currentTarget,t=c.indexOf(n),a=l[t].value;a!==r&&(o(n),i(a))},u=e=>{let n=null;switch(e.key){case"Enter":p(e);break;case"ArrowRight":{const t=c.indexOf(e.currentTarget)+1;n=c[t]??c[0];break}case"ArrowLeft":{const t=c.indexOf(e.currentTarget)-1;n=c[t]??c[c.length-1];break}}n?.focus()};return(0,b.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,a.c)("tabs",{"tabs--block":t},n),children:l.map((e=>{let{value:n,label:t,attributes:s}=e;return(0,b.jsx)("li",{role:"tab",tabIndex:r===n?0:-1,"aria-selected":r===n,ref:e=>c.push(e),onKeyDown:u,onClick:p,...s,className:(0,a.c)("tabs__item",j.tabItem,s?.className,{"tabs__item--active":r===n}),children:t??n},n)}))})}function x(e){let{lazy:n,children:t,selectedValue:s}=e;const i=(Array.isArray(t)?t:[t]).filter(Boolean);if(n){const e=i.find((e=>e.props.value===s));return e?(0,r.cloneElement)(e,{className:(0,a.c)("margin-top--md",e.props.className)}):null}return(0,b.jsx)("div",{className:"margin-top--md",children:i.map(((e,n)=>(0,r.cloneElement)(e,{key:n,hidden:e.props.value!==s})))})}function w(e){const n=g(e);return(0,b.jsxs)("div",{className:(0,a.c)("tabs-container",j.tabList),children:[(0,b.jsx)(v,{...n,...e}),(0,b.jsx)(x,{...n,...e})]})}function k(e){const n=(0,f.c)();return(0,b.jsx)(w,{...e,children:u(e.children)},String(n))}},2436:(e,n,t)=>{t.d(n,{I:()=>l,M:()=>i});var r=t(5496);const a={},s=r.createContext(a);function i(e){const n=r.useContext(s);return r.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:i(e.components),r.createElement(s.Provider,{value:n},e.children)}}}]);
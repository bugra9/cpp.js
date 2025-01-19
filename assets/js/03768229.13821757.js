"use strict";(self.webpackChunk_cpp_js_website=self.webpackChunk_cpp_js_website||[]).push([[6902],{4326:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>u,contentTitle:()=>c,default:()=>h,frontMatter:()=>o,metadata:()=>a,toc:()=>p});const a=JSON.parse('{"id":"guide/integrate-into-existing-project/webpack","title":"Webpack","description":"To integrate cpp.js into your project using Webpack as a bundler, you can utilize the @cpp.js/plugin-webpack and @cpp.js/plugin-webpack-loader plugins. Start by installing these packages with the following command:","source":"@site/docs/guide/integrate-into-existing-project/webpack.md","sourceDirName":"guide/integrate-into-existing-project","slug":"/guide/integrate-into-existing-project/webpack","permalink":"/docs/guide/integrate-into-existing-project/webpack","draft":false,"unlisted":false,"tags":[],"version":"current","lastUpdatedAt":1737301486000,"frontMatter":{},"sidebar":"guide","previous":{"title":"Standalone","permalink":"/docs/guide/integrate-into-existing-project/standalone"},"next":{"title":"Rollup","permalink":"/docs/guide/integrate-into-existing-project/rollup"}}');var r=t(7557),l=t(7266),s=t(2033),i=t(874);const o={},c="Webpack",u={},p=[];function d(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",header:"header",p:"p",pre:"pre",...(0,l.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.header,{children:(0,r.jsx)(n.h1,{id:"webpack",children:"Webpack"})}),"\n",(0,r.jsx)(n.p,{children:"To integrate cpp.js into your project using Webpack as a bundler, you can utilize the @cpp.js/plugin-webpack and @cpp.js/plugin-webpack-loader plugins. Start by installing these packages with the following command:"}),"\n",(0,r.jsxs)(s.A,{groupId:"npm2yarn",children:[(0,r.jsx)(i.A,{value:"npm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"npm install @cpp.js/plugin-webpack @cpp.js/plugin-webpack-loader --save-dev\n"})})}),(0,r.jsx)(i.A,{value:"yarn",label:"Yarn",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"yarn add @cpp.js/plugin-webpack @cpp.js/plugin-webpack-loader --dev\n"})})}),(0,r.jsx)(i.A,{value:"pnpm",label:"pnpm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"pnpm add @cpp.js/plugin-webpack @cpp.js/plugin-webpack-loader --save-dev\n"})})}),(0,r.jsx)(i.A,{value:"bun",label:"Bun",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"bun add @cpp.js/plugin-webpack @cpp.js/plugin-webpack-loader --dev\n"})})})]}),"\n",(0,r.jsxs)(n.p,{children:["To enable the plugin, modify the ",(0,r.jsx)(n.code,{children:"webpack.config.js"})," file as shown below."]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-diff",metastring:'title="webpack.config.js"',children:"+ const CppjsWebpackPlugin = require('@cpp.js/plugin-webpack');\n+ const cppjsWebpackPlugin = new CppjsWebpackPlugin();\n+ const compiler = cppjsWebpackPlugin.getCompiler();\n\nmodule.exports = {\n  //...\n  plugins: [\n+   cppjsWebpackPlugin,\n  ],\n  module: {\n    rules: [\n+     {\n+       test: /\\.h$/,\n+       loader: '@cpp.js/plugin-webpack-loader',\n+       options: { compiler },\n+     }\n    ],\n  },\n};\n"})}),"\n",(0,r.jsxs)(n.p,{children:["Cpp.js requires a configuration file to work. For a minimal setup, create a ",(0,r.jsx)(n.code,{children:"cppjs.config.mjs"})," file and add the following content."]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-js",metastring:'title="cppjs.config.mjs"',children:"export default {\n    paths: {\n        config: import.meta.url,\n    },\n};\n"})}),"\n",(0,r.jsx)(n.p,{children:"Move your C++ code to the src/native directory. For example;"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-cpp",metastring:'title="src/native/MySampleClass.h"',children:'#pragma once\n#include <string>\n\nclass MySampleClass {\npublic:\n    static std::string sample() {\n        return "Hello World!";\n    }\n};\n'})}),"\n",(0,r.jsx)(n.p,{children:"Modify the JavaScript file to call the C++ function. For example:"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-js",children:"import { initCppJs, MySampleClass } from './native/native.h';\n\ninitCppJs().then(() => {\n  console.log(MySampleClass.sample());\n});\n"})}),"\n",(0,r.jsx)(n.p,{children:"The project is now fully set up and ready to run."}),"\n",(0,r.jsx)(n.admonition,{type:"warning",children:(0,r.jsxs)(n.p,{children:["Before proceeding, ensure that you have met all the ",(0,r.jsx)(n.a,{href:"/docs/guide/getting-started/prerequisites",children:"prerequisites"})," for setting up a working development environment."]})})]})}function h(e={}){const{wrapper:n}={...(0,l.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(d,{...e})}):d(e)}},874:(e,n,t)=>{t.d(n,{A:()=>s});t(8225);var a=t(3372);const r={tabItem:"tabItem_BJ5O"};var l=t(7557);function s(e){let{children:n,hidden:t,className:s}=e;return(0,l.jsx)("div",{role:"tabpanel",className:(0,a.A)(r.tabItem,s),hidden:t,children:n})}},2033:(e,n,t)=>{t.d(n,{A:()=>k});var a=t(8225),r=t(3372),l=t(7384),s=t(1654),i=t(464),o=t(1781),c=t(2506),u=t(334);function p(e){return a.Children.toArray(e).filter((e=>"\n"!==e)).map((e=>{if(!e||(0,a.isValidElement)(e)&&function(e){const{props:n}=e;return!!n&&"object"==typeof n&&"value"in n}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}function d(e){const{values:n,children:t}=e;return(0,a.useMemo)((()=>{const e=n??function(e){return p(e).map((e=>{let{props:{value:n,label:t,attributes:a,default:r}}=e;return{value:n,label:t,attributes:a,default:r}}))}(t);return function(e){const n=(0,c.XI)(e,((e,n)=>e.value===n.value));if(n.length>0)throw new Error(`Docusaurus error: Duplicate values "${n.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[n,t])}function h(e){let{value:n,tabValues:t}=e;return t.some((e=>e.value===n))}function g(e){let{queryString:n=!1,groupId:t}=e;const r=(0,s.W6)(),l=function(e){let{queryString:n=!1,groupId:t}=e;if("string"==typeof n)return n;if(!1===n)return null;if(!0===n&&!t)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return t??null}({queryString:n,groupId:t});return[(0,o.aZ)(l),(0,a.useCallback)((e=>{if(!l)return;const n=new URLSearchParams(r.location.search);n.set(l,e),r.replace({...r.location,search:n.toString()})}),[l,r])]}function m(e){const{defaultValue:n,queryString:t=!1,groupId:r}=e,l=d(e),[s,o]=(0,a.useState)((()=>function(e){let{defaultValue:n,tabValues:t}=e;if(0===t.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(n){if(!h({value:n,tabValues:t}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${n}" but none of its children has the corresponding value. Available values are: ${t.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return n}const a=t.find((e=>e.default))??t[0];if(!a)throw new Error("Unexpected error: 0 tabValues");return a.value}({defaultValue:n,tabValues:l}))),[c,p]=g({queryString:t,groupId:r}),[m,b]=function(e){let{groupId:n}=e;const t=function(e){return e?`docusaurus.tab.${e}`:null}(n),[r,l]=(0,u.Dv)(t);return[r,(0,a.useCallback)((e=>{t&&l.set(e)}),[t,l])]}({groupId:r}),f=(()=>{const e=c??m;return h({value:e,tabValues:l})?e:null})();(0,i.A)((()=>{f&&o(f)}),[f]);return{selectedValue:s,selectValue:(0,a.useCallback)((e=>{if(!h({value:e,tabValues:l}))throw new Error(`Can't select invalid tab value=${e}`);o(e),p(e),b(e)}),[p,b,l]),tabValues:l}}var b=t(2028);const f={tabList:"tabList_hNKg",tabItem:"tabItem_rhUr"};var j=t(7557);function x(e){let{className:n,block:t,selectedValue:a,selectValue:s,tabValues:i}=e;const o=[],{blockElementScrollPositionUntilNextRender:c}=(0,l.a_)(),u=e=>{const n=e.currentTarget,t=o.indexOf(n),r=i[t].value;r!==a&&(c(n),s(r))},p=e=>{let n=null;switch(e.key){case"Enter":u(e);break;case"ArrowRight":{const t=o.indexOf(e.currentTarget)+1;n=o[t]??o[0];break}case"ArrowLeft":{const t=o.indexOf(e.currentTarget)-1;n=o[t]??o[o.length-1];break}}n?.focus()};return(0,j.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,r.A)("tabs",{"tabs--block":t},n),children:i.map((e=>{let{value:n,label:t,attributes:l}=e;return(0,j.jsx)("li",{role:"tab",tabIndex:a===n?0:-1,"aria-selected":a===n,ref:e=>{o.push(e)},onKeyDown:p,onClick:u,...l,className:(0,r.A)("tabs__item",f.tabItem,l?.className,{"tabs__item--active":a===n}),children:t??n},n)}))})}function v(e){let{lazy:n,children:t,selectedValue:l}=e;const s=(Array.isArray(t)?t:[t]).filter(Boolean);if(n){const e=s.find((e=>e.props.value===l));return e?(0,a.cloneElement)(e,{className:(0,r.A)("margin-top--md",e.props.className)}):null}return(0,j.jsx)("div",{className:"margin-top--md",children:s.map(((e,n)=>(0,a.cloneElement)(e,{key:n,hidden:e.props.value!==l})))})}function w(e){const n=m(e);return(0,j.jsxs)("div",{className:(0,r.A)("tabs-container",f.tabList),children:[(0,j.jsx)(x,{...n,...e}),(0,j.jsx)(v,{...n,...e})]})}function k(e){const n=(0,b.A)();return(0,j.jsx)(w,{...e,children:p(e.children)},String(n))}},7266:(e,n,t)=>{t.d(n,{R:()=>s,x:()=>i});var a=t(8225);const r={},l=a.createContext(r);function s(e){const n=a.useContext(l);return a.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function i(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:s(e.components),a.createElement(l.Provider,{value:n},e.children)}}}]);
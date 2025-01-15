"use strict";(self.webpackChunk_cpp_js_website=self.webpackChunk_cpp_js_website||[]).push([[8428],{2219:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>u,contentTitle:()=>c,default:()=>h,frontMatter:()=>o,metadata:()=>r,toc:()=>p});const r=JSON.parse('{"id":"guide/integrate-into-existing-project/vite","title":"Vite","description":"To integrate cpp.js into your project using Vite as a bundler, you can utilize the @cpp.js/plugin-vite plugin. Start by installing these package with the following command:","source":"@site/docs/guide/integrate-into-existing-project/vite.md","sourceDirName":"guide/integrate-into-existing-project","slug":"/guide/integrate-into-existing-project/vite","permalink":"/docs/guide/integrate-into-existing-project/vite","draft":false,"unlisted":false,"tags":[],"version":"current","lastUpdatedAt":1736899655000,"frontMatter":{},"sidebar":"guide","previous":{"title":"Rollup","permalink":"/docs/guide/integrate-into-existing-project/rollup"},"next":{"title":"Rspack","permalink":"/docs/guide/integrate-into-existing-project/rspack"}}');var a=t(7557),i=t(7266),s=t(2115),l=t(2687);const o={},c="Vite",u={},p=[];function d(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",header:"header",p:"p",pre:"pre",strong:"strong",...(0,i.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.header,{children:(0,a.jsx)(n.h1,{id:"vite",children:"Vite"})}),"\n",(0,a.jsx)(n.p,{children:"To integrate cpp.js into your project using Vite as a bundler, you can utilize the @cpp.js/plugin-vite plugin. Start by installing these package with the following command:"}),"\n",(0,a.jsxs)(s.A,{groupId:"npm2yarn",children:[(0,a.jsx)(l.A,{value:"npm",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"npm install @cpp.js/plugin-vite --save-dev\n"})})}),(0,a.jsx)(l.A,{value:"yarn",label:"Yarn",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"yarn add @cpp.js/plugin-vite --dev\n"})})}),(0,a.jsx)(l.A,{value:"pnpm",label:"pnpm",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"pnpm add @cpp.js/plugin-vite --save-dev\n"})})}),(0,a.jsx)(l.A,{value:"bun",label:"bun",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"bun add @cpp.js/plugin-vite --dev\n"})})})]}),"\n",(0,a.jsxs)(n.p,{children:["To enable the plugin, modify the ",(0,a.jsx)(n.code,{children:"vite.config.js"})," file as shown below."]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-diff",metastring:'title="vite.config.js"',children:"import { defineConfig } from 'vite'\nimport vue from '@vitejs/plugin-vue'\n+ import viteCppjsPlugin from '@cpp.js/plugin-vite'\n\n// https://vitejs.dev/config/\nexport default defineConfig({\n  plugins: [\n+   viteCppjsPlugin(),\n  ]\n});\n"})}),"\n",(0,a.jsxs)(n.p,{children:["Cpp.js requires a configuration file to work. For a minimal setup, create a ",(0,a.jsx)(n.code,{children:"cppjs.config.mjs"})," file and add the following content."]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-js",metastring:'title="cppjs.config.mjs"',children:"export default {\n    paths: {\n        config: import.meta.url,\n    },\n};\n"})}),"\n",(0,a.jsx)(n.p,{children:"Move your C++ code to the src/native directory. For example;"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-cpp",metastring:'title="src/native/MySampleClass.h"',children:'#pragma once\n#include <string>\n\nclass MySampleClass {\npublic:\n    static std::string sample() {\n        return "Hello World!";\n    }\n};\n'})}),"\n",(0,a.jsx)(n.p,{children:"Modify the JavaScript file to call the C++ function. For example:"}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-js",children:"import { initCppJs, MySampleClass } from './native/native.h';\n\ninitCppJs().then(() => {\n  console.log(MySampleClass.sample());\n});\n"})}),"\n",(0,a.jsx)(n.p,{children:"The project is now fully set up and ready to run."}),"\n",(0,a.jsx)(n.admonition,{type:"warning",children:(0,a.jsxs)(n.p,{children:["Before proceeding, ensure that you have met all the ",(0,a.jsx)(n.a,{href:"/docs/guide/getting-started/prerequisites",children:"prerequisites"})," for setting up a working development environment."]})}),"\n",(0,a.jsx)(n.admonition,{type:"info",children:(0,a.jsxs)(n.p,{children:[(0,a.jsx)(n.strong,{children:"Sample Source Code:"})," You can access the sample source code from ",(0,a.jsx)(n.a,{href:"https://github.com/bugra9/cpp.js/tree/main/packages/cppjs-sample-web-vue-vite",children:"this link"}),"."]})})]})}function h(e={}){const{wrapper:n}={...(0,i.R)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(d,{...e})}):d(e)}},2687:(e,n,t)=>{t.d(n,{A:()=>s});t(8225);var r=t(3372);const a={tabItem:"tabItem_hzpM"};var i=t(7557);function s(e){let{children:n,hidden:t,className:s}=e;return(0,i.jsx)("div",{role:"tabpanel",className:(0,r.A)(a.tabItem,s),hidden:t,children:n})}},2115:(e,n,t)=>{t.d(n,{A:()=>w});var r=t(8225),a=t(3372),i=t(2667),s=t(1654),l=t(2422),o=t(5916),c=t(2165),u=t(6929);function p(e){return r.Children.toArray(e).filter((e=>"\n"!==e)).map((e=>{if(!e||(0,r.isValidElement)(e)&&function(e){const{props:n}=e;return!!n&&"object"==typeof n&&"value"in n}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}function d(e){const{values:n,children:t}=e;return(0,r.useMemo)((()=>{const e=n??function(e){return p(e).map((e=>{let{props:{value:n,label:t,attributes:r,default:a}}=e;return{value:n,label:t,attributes:r,default:a}}))}(t);return function(e){const n=(0,c.XI)(e,((e,n)=>e.value===n.value));if(n.length>0)throw new Error(`Docusaurus error: Duplicate values "${n.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[n,t])}function h(e){let{value:n,tabValues:t}=e;return t.some((e=>e.value===n))}function g(e){let{queryString:n=!1,groupId:t}=e;const a=(0,s.W6)(),i=function(e){let{queryString:n=!1,groupId:t}=e;if("string"==typeof n)return n;if(!1===n)return null;if(!0===n&&!t)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return t??null}({queryString:n,groupId:t});return[(0,o.aZ)(i),(0,r.useCallback)((e=>{if(!i)return;const n=new URLSearchParams(a.location.search);n.set(i,e),a.replace({...a.location,search:n.toString()})}),[i,a])]}function m(e){const{defaultValue:n,queryString:t=!1,groupId:a}=e,i=d(e),[s,o]=(0,r.useState)((()=>function(e){let{defaultValue:n,tabValues:t}=e;if(0===t.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(n){if(!h({value:n,tabValues:t}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${n}" but none of its children has the corresponding value. Available values are: ${t.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return n}const r=t.find((e=>e.default))??t[0];if(!r)throw new Error("Unexpected error: 0 tabValues");return r.value}({defaultValue:n,tabValues:i}))),[c,p]=g({queryString:t,groupId:a}),[m,f]=function(e){let{groupId:n}=e;const t=function(e){return e?`docusaurus.tab.${e}`:null}(n),[a,i]=(0,u.Dv)(t);return[a,(0,r.useCallback)((e=>{t&&i.set(e)}),[t,i])]}({groupId:a}),v=(()=>{const e=c??m;return h({value:e,tabValues:i})?e:null})();(0,l.A)((()=>{v&&o(v)}),[v]);return{selectedValue:s,selectValue:(0,r.useCallback)((e=>{if(!h({value:e,tabValues:i}))throw new Error(`Can't select invalid tab value=${e}`);o(e),p(e),f(e)}),[p,f,i]),tabValues:i}}var f=t(3598);const v={tabList:"tabList_Te4m",tabItem:"tabItem_U1aW"};var j=t(7557);function b(e){let{className:n,block:t,selectedValue:r,selectValue:s,tabValues:l}=e;const o=[],{blockElementScrollPositionUntilNextRender:c}=(0,i.a_)(),u=e=>{const n=e.currentTarget,t=o.indexOf(n),a=l[t].value;a!==r&&(c(n),s(a))},p=e=>{let n=null;switch(e.key){case"Enter":u(e);break;case"ArrowRight":{const t=o.indexOf(e.currentTarget)+1;n=o[t]??o[0];break}case"ArrowLeft":{const t=o.indexOf(e.currentTarget)-1;n=o[t]??o[o.length-1];break}}n?.focus()};return(0,j.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,a.A)("tabs",{"tabs--block":t},n),children:l.map((e=>{let{value:n,label:t,attributes:i}=e;return(0,j.jsx)("li",{role:"tab",tabIndex:r===n?0:-1,"aria-selected":r===n,ref:e=>o.push(e),onKeyDown:p,onClick:u,...i,className:(0,a.A)("tabs__item",v.tabItem,i?.className,{"tabs__item--active":r===n}),children:t??n},n)}))})}function x(e){let{lazy:n,children:t,selectedValue:i}=e;const s=(Array.isArray(t)?t:[t]).filter(Boolean);if(n){const e=s.find((e=>e.props.value===i));return e?(0,r.cloneElement)(e,{className:(0,a.A)("margin-top--md",e.props.className)}):null}return(0,j.jsx)("div",{className:"margin-top--md",children:s.map(((e,n)=>(0,r.cloneElement)(e,{key:n,hidden:e.props.value!==i})))})}function y(e){const n=m(e);return(0,j.jsxs)("div",{className:(0,a.A)("tabs-container",v.tabList),children:[(0,j.jsx)(b,{...n,...e}),(0,j.jsx)(x,{...n,...e})]})}function w(e){const n=(0,f.A)();return(0,j.jsx)(y,{...e,children:p(e.children)},String(n))}},7266:(e,n,t)=>{t.d(n,{R:()=>s,x:()=>l});var r=t(8225);const a={},i=r.createContext(a);function s(e){const n=r.useContext(i);return r.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function l(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:s(e.components),r.createElement(i.Provider,{value:n},e.children)}}}]);
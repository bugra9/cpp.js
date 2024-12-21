"use strict";(self.webpackChunk_cpp_js_website=self.webpackChunk_cpp_js_website||[]).push([[4880],{4106:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>u,contentTitle:()=>c,default:()=>h,frontMatter:()=>o,metadata:()=>a,toc:()=>d});const a=JSON.parse('{"id":"guide/integrate-into-existing-project/standalone","title":"Standalone","description":"If you are using a bundler, you may choose to skip this section.","source":"@site/docs/guide/integrate-into-existing-project/standalone.md","sourceDirName":"guide/integrate-into-existing-project","slug":"/guide/integrate-into-existing-project/standalone","permalink":"/docs/guide/integrate-into-existing-project/standalone","draft":false,"unlisted":false,"tags":[],"version":"current","lastUpdatedAt":1734794644000,"frontMatter":{},"sidebar":"guide","previous":{"title":"Overview","permalink":"/docs/guide/integrate-into-existing-project/overview"},"next":{"title":"Webpack","permalink":"/docs/guide/integrate-into-existing-project/webpack"}}');var r=t(7557),s=t(7266),l=t(6261),i=t(6490);const o={},c="Standalone",u={},d=[];function p(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",header:"header",p:"p",pre:"pre",strong:"strong",...(0,s.R)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(n.header,{children:(0,r.jsx)(n.h1,{id:"standalone",children:"Standalone"})}),"\n",(0,r.jsx)(n.admonition,{type:"info",children:(0,r.jsx)(n.p,{children:"If you are using a bundler, you may choose to skip this section."})}),"\n",(0,r.jsx)(n.p,{children:"You can use cpp.js to compile native code from your project into WebAssembly. To do this, add the build script and cpp.js as a dependency in the package.json file of your project."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-diff",metastring:'title="package.json"',children:'{\n    "name": "myapp",\n    "scripts": {\n+       "build": "cppjs build -p wasm"\n    },\n    "devDependencies": {\n+       "cpp.js": "^1.0.0-beta.1"\n    }\n}\n'})}),"\n",(0,r.jsx)(n.p,{children:"To install the npm packages, use the following command:"}),"\n",(0,r.jsxs)(l.A,{groupId:"npm2yarn",children:[(0,r.jsx)(i.A,{value:"npm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"npm install\n"})})}),(0,r.jsx)(i.A,{value:"yarn",label:"Yarn",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"yarn install\n"})})}),(0,r.jsx)(i.A,{value:"pnpm",label:"pnpm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"pnpm install\n"})})}),(0,r.jsx)(i.A,{value:"bun",label:"bun",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"bun install\n"})})})]}),"\n",(0,r.jsxs)(n.p,{children:["Cpp.js requires a configuration file to work. For a minimal setup, create a ",(0,r.jsx)(n.code,{children:"cppjs.config.mjs"})," file and add the following content."]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-js",metastring:'title="cppjs.config.mjs"',children:"import getDirName from 'cpp.js/src/utils/getDirName.js';\n\nexport default {\n    paths: {\n        project: getDirName(import.meta.url),\n        output: 'dist',\n    },\n};\n"})}),"\n",(0,r.jsx)(n.p,{children:"Move your C++ code to the src/native directory. For example;"}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-cpp",metastring:'title="src/native/MySampleClass.h"',children:'#pragma once\n#include <string>\n\nclass MySampleClass {\npublic:\n    static std::string sample() {\n        return "Hello World!";\n    }\n};\n'})}),"\n",(0,r.jsx)(n.p,{children:"Now, we can compile our C++ code into WebAssembly. Run the following command:"}),"\n",(0,r.jsx)(n.admonition,{type:"warning",children:(0,r.jsxs)(n.p,{children:["Before proceeding, ensure that you have met all the ",(0,r.jsx)(n.a,{href:"/docs/guide/getting-started/prerequisites",children:"prerequisites"})," for setting up a working development environment."]})}),"\n",(0,r.jsxs)(l.A,{groupId:"npm2yarn",children:[(0,r.jsx)(i.A,{value:"npm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"npm run build\n"})})}),(0,r.jsx)(i.A,{value:"yarn",label:"Yarn",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"yarn build\n"})})}),(0,r.jsx)(i.A,{value:"pnpm",label:"pnpm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"pnpm run build\n"})})}),(0,r.jsx)(i.A,{value:"bun",label:"bun",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"bun run build\n"})})})]}),"\n",(0,r.jsx)(n.p,{children:"This command will generate myapp.wasm, myapp.browser.js, and myapp.node.js files inside the dist folder."}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{children:"\u251c\u2500\u2500 src\n\u2502   \u2514\u2500\u2500 native\n|       \u2514\u2500\u2500 MySampleClass.h\n|\n\u251c\u2500\u2500 dist\n\u2502   \u2514\u2500\u2500 myapp.wasm\n|   \u2514\u2500\u2500 myapp.browser.js\n|   \u2514\u2500\u2500 myapp.node.js\n\u251c\u2500\u2500 ...\n"})}),"\n",(0,r.jsxs)(n.p,{children:["You can now access your native code by importing ",(0,r.jsx)(n.strong,{children:"dist/myapp.browser.js"})," into your JavaScript file. For a minimal setup, create a index.html and add the following content."]}),"\n",(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-html",metastring:'title="index.html"',children:'<!DOCTYPE html>\n<html>\n   <head>\n      <meta charset = "utf-8">\n      <title>Cpp.js Vanilla sample</title>\n      <script src="./dist/myapp.browser.js"><\/script>\n      <script>\n        initCppJs({ path: \'./dist\' }).then(({ MySampleClass }) => {\n            document.querySelector(\'#cppMessage\').innerHTML = MySampleClass.sample();\n        });\n      <\/script>\n   </head>\n   <body>\n    <p>Response from c++ : <span id="cppMessage">compiling ...</span></p>\n   </body>\n</html>\n'})}),"\n",(0,r.jsxs)(n.p,{children:["To view the output, you can start a local server, such as using the ",(0,r.jsx)(n.code,{children:"serve"})," command, within the project directory."]}),"\n",(0,r.jsxs)(n.admonition,{type:"tip",children:[(0,r.jsxs)(n.p,{children:["To add ",(0,r.jsx)(n.code,{children:"serve"})," as a project dependency, follow these steps:"]}),(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-diff",metastring:'title="package.json"',children:'{\n    "name": "myapp",\n    "scripts": {\n+      "start": "serve",\n       "build": "cppjs build -p wasm",\n    },\n    "devDependencies": {\n+      "serve": "^14.2.3",\n       "cpp.js": "^1.0.0-beta.1"\n    }\n}\n'})}),(0,r.jsx)(n.p,{children:"To start your project"}),(0,r.jsxs)(l.A,{groupId:"npm2yarn",children:[(0,r.jsx)(i.A,{value:"npm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"npm run start\n"})})}),(0,r.jsx)(i.A,{value:"yarn",label:"Yarn",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"yarn run start\n"})})}),(0,r.jsx)(i.A,{value:"pnpm",label:"pnpm",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"pnpm run start\n"})})}),(0,r.jsx)(i.A,{value:"bun",label:"bun",children:(0,r.jsx)(n.pre,{children:(0,r.jsx)(n.code,{className:"language-shell",children:"bun run start\n"})})})]})]}),"\n",(0,r.jsx)(n.admonition,{type:"info",children:(0,r.jsxs)(n.p,{children:[(0,r.jsx)(n.strong,{children:"Sample Source Code:"})," You can access the sample source code from ",(0,r.jsx)(n.a,{href:"https://github.com/bugra9/cpp.js/tree/main/packages/cppjs-sample-web-vanilla",children:"this link"}),"."]})})]})}function h(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,r.jsx)(n,{...e,children:(0,r.jsx)(p,{...e})}):p(e)}},6490:(e,n,t)=>{t.d(n,{A:()=>l});t(8225);var a=t(3372);const r={tabItem:"tabItem_xEk4"};var s=t(7557);function l(e){let{children:n,hidden:t,className:l}=e;return(0,s.jsx)("div",{role:"tabpanel",className:(0,a.A)(r.tabItem,l),hidden:t,children:n})}},6261:(e,n,t)=>{t.d(n,{A:()=>w});var a=t(8225),r=t(3372),s=t(2248),l=t(1654),i=t(5773),o=t(9733),c=t(2138),u=t(123);function d(e){return a.Children.toArray(e).filter((e=>"\n"!==e)).map((e=>{if(!e||(0,a.isValidElement)(e)&&function(e){const{props:n}=e;return!!n&&"object"==typeof n&&"value"in n}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}function p(e){const{values:n,children:t}=e;return(0,a.useMemo)((()=>{const e=n??function(e){return d(e).map((e=>{let{props:{value:n,label:t,attributes:a,default:r}}=e;return{value:n,label:t,attributes:a,default:r}}))}(t);return function(e){const n=(0,c.XI)(e,((e,n)=>e.value===n.value));if(n.length>0)throw new Error(`Docusaurus error: Duplicate values "${n.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[n,t])}function h(e){let{value:n,tabValues:t}=e;return t.some((e=>e.value===n))}function m(e){let{queryString:n=!1,groupId:t}=e;const r=(0,l.W6)(),s=function(e){let{queryString:n=!1,groupId:t}=e;if("string"==typeof n)return n;if(!1===n)return null;if(!0===n&&!t)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return t??null}({queryString:n,groupId:t});return[(0,o.aZ)(s),(0,a.useCallback)((e=>{if(!s)return;const n=new URLSearchParams(r.location.search);n.set(s,e),r.replace({...r.location,search:n.toString()})}),[s,r])]}function g(e){const{defaultValue:n,queryString:t=!1,groupId:r}=e,s=p(e),[l,o]=(0,a.useState)((()=>function(e){let{defaultValue:n,tabValues:t}=e;if(0===t.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(n){if(!h({value:n,tabValues:t}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${n}" but none of its children has the corresponding value. Available values are: ${t.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return n}const a=t.find((e=>e.default))??t[0];if(!a)throw new Error("Unexpected error: 0 tabValues");return a.value}({defaultValue:n,tabValues:s}))),[c,d]=m({queryString:t,groupId:r}),[g,j]=function(e){let{groupId:n}=e;const t=function(e){return e?`docusaurus.tab.${e}`:null}(n),[r,s]=(0,u.Dv)(t);return[r,(0,a.useCallback)((e=>{t&&s.set(e)}),[t,s])]}({groupId:r}),b=(()=>{const e=c??g;return h({value:e,tabValues:s})?e:null})();(0,i.A)((()=>{b&&o(b)}),[b]);return{selectedValue:l,selectValue:(0,a.useCallback)((e=>{if(!h({value:e,tabValues:s}))throw new Error(`Can't select invalid tab value=${e}`);o(e),d(e),j(e)}),[d,j,s]),tabValues:s}}var j=t(7695);const b={tabList:"tabList_WvRu",tabItem:"tabItem_Wr5P"};var x=t(7557);function f(e){let{className:n,block:t,selectedValue:a,selectValue:l,tabValues:i}=e;const o=[],{blockElementScrollPositionUntilNextRender:c}=(0,s.a_)(),u=e=>{const n=e.currentTarget,t=o.indexOf(n),r=i[t].value;r!==a&&(c(n),l(r))},d=e=>{let n=null;switch(e.key){case"Enter":u(e);break;case"ArrowRight":{const t=o.indexOf(e.currentTarget)+1;n=o[t]??o[0];break}case"ArrowLeft":{const t=o.indexOf(e.currentTarget)-1;n=o[t]??o[o.length-1];break}}n?.focus()};return(0,x.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,r.A)("tabs",{"tabs--block":t},n),children:i.map((e=>{let{value:n,label:t,attributes:s}=e;return(0,x.jsx)("li",{role:"tab",tabIndex:a===n?0:-1,"aria-selected":a===n,ref:e=>o.push(e),onKeyDown:d,onClick:u,...s,className:(0,r.A)("tabs__item",b.tabItem,s?.className,{"tabs__item--active":a===n}),children:t??n},n)}))})}function v(e){let{lazy:n,children:t,selectedValue:s}=e;const l=(Array.isArray(t)?t:[t]).filter(Boolean);if(n){const e=l.find((e=>e.props.value===s));return e?(0,a.cloneElement)(e,{className:(0,r.A)("margin-top--md",e.props.className)}):null}return(0,x.jsx)("div",{className:"margin-top--md",children:l.map(((e,n)=>(0,a.cloneElement)(e,{key:n,hidden:e.props.value!==s})))})}function y(e){const n=g(e);return(0,x.jsxs)("div",{className:(0,r.A)("tabs-container",b.tabList),children:[(0,x.jsx)(f,{...n,...e}),(0,x.jsx)(v,{...n,...e})]})}function w(e){const n=(0,j.A)();return(0,x.jsx)(y,{...e,children:d(e.children)},String(n))}},7266:(e,n,t)=>{t.d(n,{R:()=>l,x:()=>i});var a=t(8225);const r={},s=a.createContext(r);function l(e){const n=a.useContext(s);return a.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function i(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(r):e.components||r:l(e.components),a.createElement(s.Provider,{value:n},e.children)}}}]);
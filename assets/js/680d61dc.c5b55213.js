"use strict";(self.webpackChunk_cpp_js_website=self.webpackChunk_cpp_js_website||[]).push([[205],{9599:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>u,contentTitle:()=>l,default:()=>g,frontMatter:()=>o,metadata:()=>r,toc:()=>p});const r=JSON.parse('{"id":"guide/integrate-into-existing-project/create-react-app","title":"CRA (Create React App)","description":"Create React App (CRA) uses a predefined Webpack configuration that doesn\'t allow direct modifications. To customize it, we can use CRACO (Create React App Configuration Override). Start by installing these packages with the following command:","source":"@site/docs/guide/integrate-into-existing-project/create-react-app.md","sourceDirName":"guide/integrate-into-existing-project","slug":"/guide/integrate-into-existing-project/create-react-app","permalink":"/docs/guide/integrate-into-existing-project/create-react-app","draft":false,"unlisted":false,"tags":[],"version":"current","lastUpdatedAt":1737301486000,"frontMatter":{},"sidebar":"guide","previous":{"title":"Rspack","permalink":"/docs/guide/integrate-into-existing-project/rspack"},"next":{"title":"Node.js","permalink":"/docs/guide/integrate-into-existing-project/nodejs"}}');var a=t(7557),s=t(7266),i=t(2033),c=t(874);const o={},l="CRA (Create React App)",u={},p=[];function d(e){const n={a:"a",admonition:"admonition",code:"code",h1:"h1",header:"header",p:"p",pre:"pre",...(0,s.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(n.header,{children:(0,a.jsx)(n.h1,{id:"cra-create-react-app",children:"CRA (Create React App)"})}),"\n",(0,a.jsx)(n.p,{children:"Create React App (CRA) uses a predefined Webpack configuration that doesn't allow direct modifications. To customize it, we can use CRACO (Create React App Configuration Override). Start by installing these packages with the following command:"}),"\n",(0,a.jsxs)(i.A,{groupId:"npm2yarn",children:[(0,a.jsx)(c.A,{value:"npm",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"npm install @craco/craco @cpp.js/webpack-plugin @cpp.js/webpack-plugin-loader\n"})})}),(0,a.jsx)(c.A,{value:"yarn",label:"Yarn",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"yarn add @craco/craco @cpp.js/webpack-plugin @cpp.js/webpack-plugin-loader\n"})})}),(0,a.jsx)(c.A,{value:"pnpm",label:"pnpm",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"pnpm add @craco/craco @cpp.js/webpack-plugin @cpp.js/webpack-plugin-loader\n"})})}),(0,a.jsx)(c.A,{value:"bun",label:"Bun",children:(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-shell",children:"bun add @craco/craco @cpp.js/webpack-plugin @cpp.js/webpack-plugin-loader\n"})})})]}),"\n",(0,a.jsxs)(n.p,{children:["To enable the CRACO, modify the ",(0,a.jsx)(n.code,{children:"package.json"})," file as shown below."]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-diff",metastring:'title="package.json"',children:'{\n  "scripts": {\n-  "start": "react-scripts start"\n+  "start": "craco start"\n-  "build": "react-scripts build"\n+  "build": "craco build"\n-  "test": "react-scripts test"\n+  "test": "craco test"\n  }\n}\n'})}),"\n",(0,a.jsxs)(n.p,{children:["To enable the plugin, create the ",(0,a.jsx)(n.code,{children:"craco.config.js"})," file as shown below."]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-js",metastring:'title="craco.config.js"',children:"const fs = require('fs');\n\nmodule.exports = async function () {\n    const { default: CppjsWebpackPlugin } = await import('@cpp.js/webpack-plugin');\n    const cppjsWebpackPlugin = new CppjsWebpackPlugin();\n    const compiler = cppjsWebpackPlugin.getCompiler();\n\n    return {\n        webpack: {\n            plugins: {\n                add: [cppjsWebpackPlugin],\n            },\n            configure: (config) => {\n                config.module.rules[1].oneOf = [\n                    {\n                        test: /\\.h$/,\n                        loader: '@cpp.js/webpack-plugin-loader',\n                        options: { compiler },\n                    },\n                    ...config.module.rules[1].oneOf,\n                ];\n                return config;\n            },\n        },\n        devServer: (devServerConfig) => {\n            devServerConfig.watchFiles = compiler.config.paths.native;\n            devServerConfig.onBeforeSetupMiddleware = (devServer) => {\n                if (!devServer) {\n                  throw new Error('webpack-dev-server is not defined');\n                }\n\n                devServer.app.get('/cpp.js', function (req, res) {\n                  res.sendFile(`${compiler.config.paths.temp}/${compiler.config.general.name}.browser.js`);\n                });\n\n                devServer.app.get('/cpp.wasm', function (req, res) {\n                    res.send(fs.readFileSync(`${compiler.config.paths.temp}/${compiler.config.general.name}.wasm`));\n                });\n            };\n\n            return devServerConfig;\n        },\n    };\n};\n"})}),"\n",(0,a.jsxs)(n.p,{children:["Cpp.js requires a configuration file to work. For a minimal setup, create a ",(0,a.jsx)(n.code,{children:"cppjs.config.mjs"})," file and add the following content."]}),"\n",(0,a.jsx)(n.pre,{children:(0,a.jsx)(n.code,{className:"language-js",metastring:'title="cppjs.config.mjs"',children:"export default {\n    paths: {\n        config: import.meta.url,\n    },\n};\n"})}),"\n",(0,a.jsx)(n.p,{children:"The project is now fully set up and ready to run."}),"\n",(0,a.jsx)(n.admonition,{type:"warning",children:(0,a.jsxs)(n.p,{children:["Before proceeding, ensure that you have met all the ",(0,a.jsx)(n.a,{href:"/docs/guide/getting-started/prerequisites",children:"prerequisites"})," for setting up a working development environment."]})})]})}function g(e={}){const{wrapper:n}={...(0,s.R)(),...e.components};return n?(0,a.jsx)(n,{...e,children:(0,a.jsx)(d,{...e})}):d(e)}},874:(e,n,t)=>{t.d(n,{A:()=>i});t(8225);var r=t(3372);const a={tabItem:"tabItem_BJ5O"};var s=t(7557);function i(e){let{children:n,hidden:t,className:i}=e;return(0,s.jsx)("div",{role:"tabpanel",className:(0,r.A)(a.tabItem,i),hidden:t,children:n})}},2033:(e,n,t)=>{t.d(n,{A:()=>k});var r=t(8225),a=t(3372),s=t(7384),i=t(1654),c=t(464),o=t(1781),l=t(2506),u=t(334);function p(e){return r.Children.toArray(e).filter((e=>"\n"!==e)).map((e=>{if(!e||(0,r.isValidElement)(e)&&function(e){const{props:n}=e;return!!n&&"object"==typeof n&&"value"in n}(e))return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))?.filter(Boolean)??[]}function d(e){const{values:n,children:t}=e;return(0,r.useMemo)((()=>{const e=n??function(e){return p(e).map((e=>{let{props:{value:n,label:t,attributes:r,default:a}}=e;return{value:n,label:t,attributes:r,default:a}}))}(t);return function(e){const n=(0,l.XI)(e,((e,n)=>e.value===n.value));if(n.length>0)throw new Error(`Docusaurus error: Duplicate values "${n.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[n,t])}function g(e){let{value:n,tabValues:t}=e;return t.some((e=>e.value===n))}function f(e){let{queryString:n=!1,groupId:t}=e;const a=(0,i.W6)(),s=function(e){let{queryString:n=!1,groupId:t}=e;if("string"==typeof n)return n;if(!1===n)return null;if(!0===n&&!t)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return t??null}({queryString:n,groupId:t});return[(0,o.aZ)(s),(0,r.useCallback)((e=>{if(!s)return;const n=new URLSearchParams(a.location.search);n.set(s,e),a.replace({...a.location,search:n.toString()})}),[s,a])]}function h(e){const{defaultValue:n,queryString:t=!1,groupId:a}=e,s=d(e),[i,o]=(0,r.useState)((()=>function(e){let{defaultValue:n,tabValues:t}=e;if(0===t.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(n){if(!g({value:n,tabValues:t}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${n}" but none of its children has the corresponding value. Available values are: ${t.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return n}const r=t.find((e=>e.default))??t[0];if(!r)throw new Error("Unexpected error: 0 tabValues");return r.value}({defaultValue:n,tabValues:s}))),[l,p]=f({queryString:t,groupId:a}),[h,m]=function(e){let{groupId:n}=e;const t=function(e){return e?`docusaurus.tab.${e}`:null}(n),[a,s]=(0,u.Dv)(t);return[a,(0,r.useCallback)((e=>{t&&s.set(e)}),[t,s])]}({groupId:a}),b=(()=>{const e=l??h;return g({value:e,tabValues:s})?e:null})();(0,c.A)((()=>{b&&o(b)}),[b]);return{selectedValue:i,selectValue:(0,r.useCallback)((e=>{if(!g({value:e,tabValues:s}))throw new Error(`Can't select invalid tab value=${e}`);o(e),p(e),m(e)}),[p,m,s]),tabValues:s}}var m=t(2028);const b={tabList:"tabList_hNKg",tabItem:"tabItem_rhUr"};var j=t(7557);function v(e){let{className:n,block:t,selectedValue:r,selectValue:i,tabValues:c}=e;const o=[],{blockElementScrollPositionUntilNextRender:l}=(0,s.a_)(),u=e=>{const n=e.currentTarget,t=o.indexOf(n),a=c[t].value;a!==r&&(l(n),i(a))},p=e=>{let n=null;switch(e.key){case"Enter":u(e);break;case"ArrowRight":{const t=o.indexOf(e.currentTarget)+1;n=o[t]??o[0];break}case"ArrowLeft":{const t=o.indexOf(e.currentTarget)-1;n=o[t]??o[o.length-1];break}}n?.focus()};return(0,j.jsx)("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,a.A)("tabs",{"tabs--block":t},n),children:c.map((e=>{let{value:n,label:t,attributes:s}=e;return(0,j.jsx)("li",{role:"tab",tabIndex:r===n?0:-1,"aria-selected":r===n,ref:e=>{o.push(e)},onKeyDown:p,onClick:u,...s,className:(0,a.A)("tabs__item",b.tabItem,s?.className,{"tabs__item--active":r===n}),children:t??n},n)}))})}function x(e){let{lazy:n,children:t,selectedValue:s}=e;const i=(Array.isArray(t)?t:[t]).filter(Boolean);if(n){const e=i.find((e=>e.props.value===s));return e?(0,r.cloneElement)(e,{className:(0,a.A)("margin-top--md",e.props.className)}):null}return(0,j.jsx)("div",{className:"margin-top--md",children:i.map(((e,n)=>(0,r.cloneElement)(e,{key:n,hidden:e.props.value!==s})))})}function w(e){const n=h(e);return(0,j.jsxs)("div",{className:(0,a.A)("tabs-container",b.tabList),children:[(0,j.jsx)(v,{...n,...e}),(0,j.jsx)(x,{...n,...e})]})}function k(e){const n=(0,m.A)();return(0,j.jsx)(w,{...e,children:p(e.children)},String(n))}},7266:(e,n,t)=>{t.d(n,{R:()=>i,x:()=>c});var r=t(8225);const a={},s=r.createContext(a);function i(e){const n=r.useContext(s);return r.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function c(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:i(e.components),r.createElement(s.Provider,{value:n},e.children)}}}]);
"use strict";(self.webpackChunk_cpp_js_website=self.webpackChunk_cpp_js_website||[]).push([[8080],{4821:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>a,contentTitle:()=>c,default:()=>l,frontMatter:()=>o,metadata:()=>i,toc:()=>d});const i=JSON.parse('{"id":"api/configuration/overview","title":"Overview","description":"Cpp.js uses the cppjs.config.js file for configuration.","source":"@site/docs/api/configuration/overview.md","sourceDirName":"api/configuration","slug":"/api/configuration/overview","permalink":"/docs/api/configuration/overview","draft":false,"unlisted":false,"tags":[],"version":"current","lastUpdatedAt":1736713895000,"frontMatter":{},"sidebar":"API","previous":{"title":"Utility Functions","permalink":"/docs/api/javascript/utility-functions"},"next":{"title":"General","permalink":"/docs/api/configuration/general"}}');var s=n(7557),r=n(7266);const o={},c="Overview",a={},d=[];function h(e){const t={a:"a",admonition:"admonition",code:"code",h1:"h1",header:"header",p:"p",pre:"pre",strong:"strong",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,r.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(t.header,{children:(0,s.jsx)(t.h1,{id:"overview",children:"Overview"})}),"\n",(0,s.jsxs)(t.p,{children:["Cpp.js uses the ",(0,s.jsx)(t.strong,{children:"cppjs.config.js"})," file for configuration.\nBased on the project structure, the configuration file extension can be ",(0,s.jsx)(t.strong,{children:".js"}),", ",(0,s.jsx)(t.strong,{children:".mjs"}),", or ",(0,s.jsx)(t.strong,{children:".cjs"}),".\nThe configuration file is mandatory, and it must define the path to the project. This ensures that the project directory is located, regardless of which package manager or runtime is used."]}),"\n",(0,s.jsx)(t.p,{children:"A minimal configuration file would look like this:"}),"\n",(0,s.jsx)(t.pre,{children:(0,s.jsx)(t.code,{className:"language-js",children:"export default {\n    paths: {\n        config: import.meta.url,\n    },\n};\n"})}),"\n",(0,s.jsx)(t.p,{children:"The configuration object consists of six sections. These are:"}),"\n",(0,s.jsxs)(t.table,{children:[(0,s.jsx)(t.thead,{children:(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.th,{children:"Attribute"}),(0,s.jsx)(t.th,{children:"Description"})]})}),(0,s.jsxs)(t.tbody,{children:[(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"general"}),(0,s.jsx)(t.td,{children:"This object includes general configurations, such as the project name"})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"dependencies"}),(0,s.jsx)(t.td,{children:"This array includes the dependencies of the project."})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"paths"}),(0,s.jsx)(t.td,{children:"This object defines paths, such as the project path"})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"ext"}),(0,s.jsx)(t.td,{children:"This object specifies file extensions, including those for header files."})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"export"}),(0,s.jsx)(t.td,{children:"This object includes configurations related to lib generation."})]}),(0,s.jsxs)(t.tr,{children:[(0,s.jsx)(t.td,{children:"platform"}),(0,s.jsx)(t.td,{children:"This object includes platform-specific configuration."})]})]})]}),"\n",(0,s.jsx)("br",{}),"\n",(0,s.jsx)(t.admonition,{type:"tip",children:(0,s.jsxs)(t.p,{children:["You can find the JavaScript file that generates the configuration ",(0,s.jsx)(t.a,{href:"https://github.com/bugra9/cpp.js/blob/main/packages/cpp.js/src/utils/getConfig.js",children:"here."})]})})]})}function l(e={}){const{wrapper:t}={...(0,r.R)(),...e.components};return t?(0,s.jsx)(t,{...e,children:(0,s.jsx)(h,{...e})}):h(e)}},7266:(e,t,n)=>{n.d(t,{R:()=>o,x:()=>c});var i=n(8225);const s={},r=i.createContext(s);function o(e){const t=i.useContext(r);return i.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function c(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:o(e.components),i.createElement(r.Provider,{value:t},e.children)}}}]);
"use strict";(self.webpackChunk_cpp_js_website=self.webpackChunk_cpp_js_website||[]).push([[8966],{1385:(t,e,n)=>{n.r(e),n.d(e,{assets:()=>h,contentTitle:()=>c,default:()=>o,frontMatter:()=>d,metadata:()=>s,toc:()=>a});const s=JSON.parse('{"id":"api/configuration/paths","title":"Paths","description":"This object defines paths, such as the project path.","source":"@site/docs/api/configuration/paths.md","sourceDirName":"api/configuration","slug":"/api/configuration/paths","permalink":"/docs/api/configuration/paths","draft":false,"unlisted":false,"tags":[],"version":"current","lastUpdatedAt":1736899655000,"frontMatter":{},"sidebar":"API","previous":{"title":"Dependencies","permalink":"/docs/api/configuration/dependencies"},"next":{"title":"File Extensions","permalink":"/docs/api/configuration/extensions"}}');var i=n(7557),r=n(7266);const d={},c="Paths",h={},a=[{value:"Attributes",id:"attributes",level:3}];function l(t){const e={code:"code",h1:"h1",h3:"h3",header:"header",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,r.R)(),...t.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(e.header,{children:(0,i.jsx)(e.h1,{id:"paths",children:"Paths"})}),"\n",(0,i.jsx)(e.p,{children:"This object defines paths, such as the project path."}),"\n",(0,i.jsx)(e.p,{children:"Here is a minimal example:"}),"\n",(0,i.jsx)(e.pre,{children:(0,i.jsx)(e.code,{className:"language-js",children:"export default {\n    general: {\n        name: 'sampleName',\n    },\n    paths: {\n        config: import.meta.url,\n        base: '../..',\n\n    },\n};\n"})}),"\n",(0,i.jsx)(e.h3,{id:"attributes",children:"Attributes"}),"\n",(0,i.jsxs)(e.table,{children:[(0,i.jsx)(e.thead,{children:(0,i.jsxs)(e.tr,{children:[(0,i.jsx)(e.th,{children:"Name"}),(0,i.jsx)(e.th,{children:"Type"}),(0,i.jsx)(e.th,{children:"Default"}),(0,i.jsx)(e.th,{children:"Description"})]})}),(0,i.jsxs)(e.tbody,{children:[(0,i.jsxs)(e.tr,{children:[(0,i.jsx)(e.td,{children:"config"}),(0,i.jsx)(e.td,{children:"string"}),(0,i.jsx)(e.td,{children:"undefined"}),(0,i.jsx)(e.td,{children:"Cpp.js config path"})]}),(0,i.jsxs)(e.tr,{children:[(0,i.jsx)(e.td,{children:"project"}),(0,i.jsx)(e.td,{children:"string"}),(0,i.jsx)(e.td,{children:"config.paths.config parent path"}),(0,i.jsx)(e.td,{children:"Project path"})]}),(0,i.jsxs)(e.tr,{children:[(0,i.jsx)(e.td,{children:"base"}),(0,i.jsx)(e.td,{children:"string"}),(0,i.jsx)(e.td,{children:"config.paths.project"}),(0,i.jsx)(e.td,{children:"Base path for monorepo structure"})]}),(0,i.jsxs)(e.tr,{children:[(0,i.jsx)(e.td,{children:"cache"}),(0,i.jsx)(e.td,{children:"string"}),(0,i.jsx)(e.td,{children:"config.paths.project/.cppjs"}),(0,i.jsx)(e.td,{children:"Cache path"})]}),(0,i.jsxs)(e.tr,{children:[(0,i.jsx)(e.td,{children:"build"}),(0,i.jsx)(e.td,{children:"string"}),(0,i.jsx)(e.td,{children:"config.paths.cache/build"}),(0,i.jsx)(e.td,{children:"Build path"})]}),(0,i.jsxs)(e.tr,{children:[(0,i.jsx)(e.td,{children:"native"}),(0,i.jsx)(e.td,{children:"array"}),(0,i.jsx)(e.td,{children:"['src/native']"}),(0,i.jsx)(e.td,{children:"Source files path"})]}),(0,i.jsxs)(e.tr,{children:[(0,i.jsx)(e.td,{children:"module"}),(0,i.jsx)(e.td,{children:"array"}),(0,i.jsx)(e.td,{children:"config.paths.native"}),(0,i.jsx)(e.td,{children:"Path to the directory containing source files"})]}),(0,i.jsxs)(e.tr,{children:[(0,i.jsx)(e.td,{children:"header"}),(0,i.jsx)(e.td,{children:"array"}),(0,i.jsx)(e.td,{children:"config.paths.native"}),(0,i.jsx)(e.td,{children:"Path to the directory containing header files"})]}),(0,i.jsxs)(e.tr,{children:[(0,i.jsx)(e.td,{children:"bridge"}),(0,i.jsx)(e.td,{children:"array"}),(0,i.jsx)(e.td,{children:"[...config.paths.native, config.paths.temp]"}),(0,i.jsx)(e.td,{children:"Path to the directory containing bridge files"})]}),(0,i.jsxs)(e.tr,{children:[(0,i.jsx)(e.td,{children:"output"}),(0,i.jsx)(e.td,{children:"string"}),(0,i.jsx)(e.td,{children:"config.paths.temp"}),(0,i.jsx)(e.td,{children:"Directory path where the output files will be saved."})]}),(0,i.jsxs)(e.tr,{children:[(0,i.jsx)(e.td,{children:"cmake"}),(0,i.jsx)(e.td,{children:"string"}),(0,i.jsx)(e.td,{children:"auto find CMakeLists.txt path"}),(0,i.jsx)(e.td,{children:"Path to the directory containing CMakeLists.txt"})]})]})]})]})}function o(t={}){const{wrapper:e}={...(0,r.R)(),...t.components};return e?(0,i.jsx)(e,{...t,children:(0,i.jsx)(l,{...t})}):l(t)}},7266:(t,e,n)=>{n.d(e,{R:()=>d,x:()=>c});var s=n(8225);const i={},r=s.createContext(i);function d(t){const e=s.useContext(r);return s.useMemo((function(){return"function"==typeof t?t(e):{...e,...t}}),[e,t])}function c(t){let e;return e=t.disableParentContext?"function"==typeof t.components?t.components(i):t.components||i:d(t.components),s.createElement(r.Provider,{value:e},t.children)}}}]);
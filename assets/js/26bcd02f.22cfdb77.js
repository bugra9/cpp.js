"use strict";(self.webpackChunk_cpp_js_website=self.webpackChunk_cpp_js_website||[]).push([[888],{9556:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>a,contentTitle:()=>d,default:()=>l,frontMatter:()=>i,metadata:()=>c,toc:()=>h});var r=n(7512),s=n(2436);const i={},d="Paths",c={id:"api/configuration/paths",title:"Paths",description:"This object defines paths, such as the project path.",source:"@site/docs/api/configuration/paths.md",sourceDirName:"api/configuration",slug:"/api/configuration/paths",permalink:"/docs/api/configuration/paths",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"API",previous:{title:"Dependencies",permalink:"/docs/api/configuration/dependencies"},next:{title:"File Extensions",permalink:"/docs/api/configuration/extensions"}},a={},h=[{value:"Attributes",id:"attributes",level:3}];function o(e){const t={code:"code",h1:"h1",h3:"h3",header:"header",p:"p",pre:"pre",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,s.M)(),...e.components};return(0,r.jsxs)(r.Fragment,{children:[(0,r.jsx)(t.header,{children:(0,r.jsx)(t.h1,{id:"paths",children:"Paths"})}),"\n",(0,r.jsx)(t.p,{children:"This object defines paths, such as the project path."}),"\n",(0,r.jsx)(t.p,{children:"Here is a minimal example:"}),"\n",(0,r.jsx)(t.pre,{children:(0,r.jsx)(t.code,{className:"language-js",children:"import getDirName from 'cpp.js/src/utils/getDirName.js';\n\nexport default {\n    general: {\n        name: 'sampleName',\n    },\n    paths: {\n        project: getDirName(import.meta.url),\n        base: '../..',\n\n    },\n};\n"})}),"\n",(0,r.jsx)(t.h3,{id:"attributes",children:"Attributes"}),"\n",(0,r.jsxs)(t.table,{children:[(0,r.jsx)(t.thead,{children:(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.th,{children:"Name"}),(0,r.jsx)(t.th,{children:"Type"}),(0,r.jsx)(t.th,{children:"Default"}),(0,r.jsx)(t.th,{children:"Description"})]})}),(0,r.jsxs)(t.tbody,{children:[(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"project"}),(0,r.jsx)(t.td,{children:"string"}),(0,r.jsx)(t.td,{children:"undefined"}),(0,r.jsx)(t.td,{children:"Project path"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"base"}),(0,r.jsx)(t.td,{children:"string"}),(0,r.jsx)(t.td,{children:"config.paths.project"}),(0,r.jsx)(t.td,{children:"Base path for monorepo structure"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"temp"}),(0,r.jsx)(t.td,{children:"string"}),(0,r.jsx)(t.td,{children:"config.paths.project/RANDOM"}),(0,r.jsx)(t.td,{children:"Temp path"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"native"}),(0,r.jsx)(t.td,{children:"array"}),(0,r.jsx)(t.td,{children:"['src/native']"}),(0,r.jsx)(t.td,{children:"Source files path"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"module"}),(0,r.jsx)(t.td,{children:"array"}),(0,r.jsx)(t.td,{children:"config.paths.native"}),(0,r.jsx)(t.td,{children:"Path to the directory containing source files"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"header"}),(0,r.jsx)(t.td,{children:"array"}),(0,r.jsx)(t.td,{children:"config.paths.native"}),(0,r.jsx)(t.td,{children:"Path to the directory containing header files"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"bridge"}),(0,r.jsx)(t.td,{children:"array"}),(0,r.jsx)(t.td,{children:"[...config.paths.native, config.paths.temp]"}),(0,r.jsx)(t.td,{children:"Path to the directory containing bridge files"})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"output"}),(0,r.jsx)(t.td,{children:"string"}),(0,r.jsx)(t.td,{children:"config.paths.temp"}),(0,r.jsx)(t.td,{children:"Directory path where the output files will be saved."})]}),(0,r.jsxs)(t.tr,{children:[(0,r.jsx)(t.td,{children:"cmake"}),(0,r.jsx)(t.td,{children:"string"}),(0,r.jsx)(t.td,{children:"auto find CMakeLists.txt path"}),(0,r.jsx)(t.td,{children:"Path to the directory containing CMakeLists.txt"})]})]})]})]})}function l(e={}){const{wrapper:t}={...(0,s.M)(),...e.components};return t?(0,r.jsx)(t,{...e,children:(0,r.jsx)(o,{...e})}):o(e)}},2436:(e,t,n)=>{n.d(t,{I:()=>c,M:()=>d});var r=n(5496);const s={},i=r.createContext(s);function d(e){const t=r.useContext(i);return r.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function c(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:d(e.components),r.createElement(i.Provider,{value:t},e.children)}}}]);
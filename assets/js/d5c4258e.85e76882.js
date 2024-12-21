"use strict";(self.webpackChunk_cpp_js_website=self.webpackChunk_cpp_js_website||[]).push([[1205],{8696:(e,t,s)=>{s.r(t),s.d(t,{assets:()=>o,contentTitle:()=>d,default:()=>h,frontMatter:()=>c,metadata:()=>i,toc:()=>a});const i=JSON.parse('{"id":"api/cpp-bindings/overview","title":"Overview","description":"Cpp.js supports binding for most C++ constructs, including features from C++11 and C++14. The only major limitation is the lack of support for raw pointers at this time.","source":"@site/docs/api/cpp-bindings/overview.md","sourceDirName":"api/cpp-bindings","slug":"/api/cpp-bindings/overview","permalink":"/docs/api/cpp-bindings/overview","draft":false,"unlisted":false,"tags":[],"version":"current","lastUpdatedAt":1734794644000,"frontMatter":{},"sidebar":"API","next":{"title":"Data Types","permalink":"/docs/api/cpp-bindings/data-types"}}');var n=s(7557),r=s(7266);const c={},d="Overview",o={},a=[];function p(e){const t={a:"a",admonition:"admonition",h1:"h1",header:"header",p:"p",table:"table",tbody:"tbody",td:"td",th:"th",thead:"thead",tr:"tr",...(0,r.R)(),...e.components};return(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(t.header,{children:(0,n.jsx)(t.h1,{id:"overview",children:"Overview"})}),"\n",(0,n.jsx)(t.p,{children:"Cpp.js supports binding for most C++ constructs, including features from C++11 and C++14. The only major limitation is the lack of support for raw pointers at this time."}),"\n",(0,n.jsx)(t.p,{children:"The table below outlines the headings discussed in this section."}),"\n",(0,n.jsxs)(t.table,{children:[(0,n.jsx)(t.thead,{children:(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.th,{children:(0,n.jsx)(t.a,{href:"/docs/api/cpp-bindings/data-types",children:"Data Types"})}),(0,n.jsx)(t.th,{children:(0,n.jsx)(t.a,{href:"/docs/api/cpp-bindings/functions",children:"Functions"})}),(0,n.jsx)(t.th,{children:(0,n.jsx)(t.a,{href:"/docs/api/cpp-bindings/classes",children:"Classes and Objects"})})]})}),(0,n.jsxs)(t.tbody,{children:[(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:"Primitive Types"}),(0,n.jsx)(t.td,{children:"Function Call"}),(0,n.jsx)(t.td,{children:"Constructors, Member Functions"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:"Vector"}),(0,n.jsx)(t.td,{children:"Function Overloading"}),(0,n.jsx)(t.td,{children:"Inheritance"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:"Map"}),(0,n.jsx)(t.td,{}),(0,n.jsx)(t.td,{children:"Polymorphism"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:"Enum"}),(0,n.jsx)(t.td,{}),(0,n.jsx)(t.td,{children:"Interfaces (Abstract Classes)"})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:"Vector"}),(0,n.jsx)(t.td,{}),(0,n.jsx)(t.td,{})]}),(0,n.jsxs)(t.tr,{children:[(0,n.jsx)(t.td,{children:"Class Object"}),(0,n.jsx)(t.td,{}),(0,n.jsx)(t.td,{})]})]})]}),"\n",(0,n.jsx)("br",{}),"\n",(0,n.jsxs)(t.admonition,{type:"info",children:[(0,n.jsxs)(t.p,{children:[(0,n.jsx)(t.a,{href:"https://emscripten.org/docs/porting/connecting_cpp_and_javascript/embind.html",children:"Embind"})," is utilized to bind C++ functions and classes to JavaScript. In WebAssembly, this functionality is provided by Emscripten. In React Native, the binding is achieved through the ",(0,n.jsx)(t.a,{href:"https://github.com/bugra9/cpp.js/tree/main/packages/cppjs-core-embind-jsi",children:"@cpp.js/core-embind-jsi"})," project, which replaces WebAssembly bindings with JavaScript Interface (JSI)."]}),(0,n.jsxs)(t.p,{children:["The ",(0,n.jsx)(t.a,{href:"https://github.com/bugra9/swig/tree/add-embind-support",children:"bugra9/swig"})," project, a fork of the original ",(0,n.jsx)(t.a,{href:"https://github.com/swig/swig",children:"Swig"})," project adapted to support Embind, is used to create Embind definitions."]}),(0,n.jsxs)(t.p,{children:["In addition, a customized version of Embind is used to support overloaded functions. The modified version is accessible via ",(0,n.jsx)(t.a,{href:"https://github.com/emscripten-core/emscripten/pull/17445",children:"this link"}),"."]})]})]})}function h(e={}){const{wrapper:t}={...(0,r.R)(),...e.components};return t?(0,n.jsx)(t,{...e,children:(0,n.jsx)(p,{...e})}):p(e)}},7266:(e,t,s)=>{s.d(t,{R:()=>c,x:()=>d});var i=s(8225);const n={},r=i.createContext(n);function c(e){const t=i.useContext(r);return i.useMemo((function(){return"function"==typeof e?e(t):{...t,...e}}),[t,e])}function d(e){let t;return t=e.disableParentContext?"function"==typeof e.components?e.components(n):e.components||n:c(e.components),i.createElement(r.Provider,{value:t},e.children)}}}]);
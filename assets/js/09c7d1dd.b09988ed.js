"use strict";(self.webpackChunk_cpp_js_website=self.webpackChunk_cpp_js_website||[]).push([[512],{7552:(e,n,s)=>{s.r(n),s.d(n,{assets:()=>r,contentTitle:()=>a,default:()=>p,frontMatter:()=>i,metadata:()=>o,toc:()=>c});var t=s(7512),l=s(2436);const i={},a="Functions",o={id:"api/cpp-bindings/functions",title:"Functions",description:"Simple function call",source:"@site/docs/api/cpp-bindings/functions.md",sourceDirName:"api/cpp-bindings",slug:"/api/cpp-bindings/functions",permalink:"/docs/api/cpp-bindings/functions",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"API",previous:{title:"Data Types",permalink:"/docs/api/cpp-bindings/data-types"},next:{title:"Classes and Objects",permalink:"/docs/api/cpp-bindings/classes"}},r={},c=[{value:"Simple function call",id:"simple-function-call",level:3},{value:"Function Overloading",id:"function-overloading",level:3}];function g(e){const n={admonition:"admonition",code:"code",h1:"h1",h3:"h3",header:"header",p:"p",pre:"pre",...(0,l.M)(),...e.components};return(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)(n.header,{children:(0,t.jsx)(n.h1,{id:"functions",children:"Functions"})}),"\n",(0,t.jsx)(n.h3,{id:"simple-function-call",children:"Simple function call"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-cpp",metastring:'title="/src/native/hello.h"',children:"std::string getHelloMessage(std::string name) {\n  return 'Hello' + name + '!';\n}\n"})}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-js",metastring:'title="/src/index.js"',children:"import { initCppJs } './native/hello.h';\nconst { getHelloMessage } = await initCppJs();\n\nconst helloMessage = getHelloMessage('Bugra');\nconsole.log(helloMessage); // Hello Bugra!\n"})}),"\n",(0,t.jsx)(n.h3,{id:"function-overloading",children:"Function Overloading"}),"\n",(0,t.jsx)(n.p,{children:"Function overloading allows multiple functions with the same name but different JavaScript parameter types or numbers of parameters, enabling flexibility in handling various inputs. Cpp.js differentiates the functions based on their signature (the number and JavaScript type of arguments)."}),"\n",(0,t.jsx)(n.p,{children:"Here is a minimal example:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-cpp",metastring:'title="/src/native/hello.h"',children:"std::string getHelloMessage(std::string name) {\n  return 'Hello' + name + '!';\n}\n\nstd::string getHelloMessage(std::string name, std::string lastName) {\n  return 'Hello' + name + ' ' + lastName + '!';\n}\n\nstd::string getHelloMessage(int a) {\n  return 'Hello' + std::to_string(a) + '!';\n}\n"})}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-js",metastring:'title="/src/index.js"',children:"import { initCppJs } './native/hello.h';\nconst { getHelloMessage } = await initCppJs();\n\nconst helloMessage = getHelloMessage('Bugra');\nconsole.log(helloMessage); // Hello Bugra!\n\nconst helloMessage2 = getHelloMessage('Bugra', 'Sari');\nconsole.log(helloMessage2); // Hello Bugra Sari!\n\nconst helloMessage3 = getHelloMessage(9);\nconsole.log(helloMessage3); // Hello 9!\n"})}),"\n",(0,t.jsx)(n.admonition,{type:"warning",children:(0,t.jsx)(n.p,{children:"If the functions cannot be overloaded, they are differentiated by appending sequential numbers to the end of their names."})}),"\n",(0,t.jsx)(n.p,{children:"Here is a minimal example:"}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-cpp",metastring:'title="/src/native/hello.h"',children:"std::string getHelloMessage(short a) { // JS Type: Number\n  return 'Hello' + std::to_string(a) + '!';\n}\nstd::string getHelloMessage(int a) { // JS Type: Number\n  return 'Hello' + std::to_string(a) + '!';\n}\n"})}),"\n",(0,t.jsx)(n.pre,{children:(0,t.jsx)(n.code,{className:"language-js",metastring:'title="/src/index.js"',children:"import { initCppJs } './native/hello.h';\nconst { getHelloMessage } = await initCppJs();\n\nconst helloMessage = getHelloMessage(9);\nconsole.log(helloMessage); // Hello 9!\n\nconst helloMessage2 = getHelloMessage2(8);\nconsole.log(helloMessage2); // Hello 8!\n"})})]})}function p(e={}){const{wrapper:n}={...(0,l.M)(),...e.components};return n?(0,t.jsx)(n,{...e,children:(0,t.jsx)(g,{...e})}):g(e)}},2436:(e,n,s)=>{s.d(n,{I:()=>o,M:()=>a});var t=s(5496);const l={},i=t.createContext(l);function a(e){const n=t.useContext(i);return t.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function o(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(l):e.components||l:a(e.components),t.createElement(i.Provider,{value:n},e.children)}}}]);
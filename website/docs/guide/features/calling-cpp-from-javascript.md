# Calling C++ from JavaScript
Cpp.js enables you to call C++ functions directly from JavaScript with ease. By compiling C++ into WebAssembly for web applications or native code for mobile, it allows seamless integration between the two languages, combining the power and performance of C++ with the flexibility of JavaScript.

The key advantage of Cpp.js is that it automatically handles the binding process, so you can focus on writing your application logic. C++ classes and functions can be used in JavaScript as if they were native objects, with no manual bindings required.

For more detailed information on how to use C++ with JavaScript, refer to the [API/C++ Bindings](/docs/api/cpp-bindings/overview) section.

- [Data Types](/docs/api/cpp-bindings/data-types)
- [Functions](/docs/api/cpp-bindings/functions)
- [Classes and Objects](/docs/api/cpp-bindings/classes)

Here is a minimal example:
```jsx title="/src/main.js"
import { initCppJs, getHelloWorldMessage } from './native/helloWorld.h';

await initCppJs();
console.log(getHelloWorldMessage());

```
```jsx title="/src/native/helloWorld.h"
std::string getHelloWorldMessage() {
  return 'Hello World!';
}
```

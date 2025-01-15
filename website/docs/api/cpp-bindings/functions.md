# Functions
### Simple function call
```cpp title="/src/native/hello.h"
std::string getHelloMessage(std::string name) {
  return 'Hello' + name + '!';
}
```

```js title="/src/index.js"
import { initCppJs, getHelloMessage } from './native/hello.h';

await initCppJs();
const helloMessage = getHelloMessage('Bugra');
console.log(helloMessage); // Hello Bugra!
```

### Function Overloading
Function overloading allows multiple functions with the same name but different JavaScript parameter types or numbers of parameters, enabling flexibility in handling various inputs. Cpp.js differentiates the functions based on their signature (the number and JavaScript type of arguments).

Here is a minimal example:
```cpp title="/src/native/hello.h"
std::string getHelloMessage(std::string name) {
  return 'Hello' + name + '!';
}

std::string getHelloMessage(std::string name, std::string lastName) {
  return 'Hello' + name + ' ' + lastName + '!';
}

std::string getHelloMessage(int a) {
  return 'Hello' + std::to_string(a) + '!';
}
```

```js title="/src/index.js"
import { initCppJs, getHelloMessage } from './native/hello.h';

await initCppJs();
const helloMessage = getHelloMessage('Bugra');
console.log(helloMessage); // Hello Bugra!

const helloMessage2 = getHelloMessage('Bugra', 'Sari');
console.log(helloMessage2); // Hello Bugra Sari!

const helloMessage3 = getHelloMessage(9);
console.log(helloMessage3); // Hello 9!
```
:::warning
If the functions cannot be overloaded, they are differentiated by appending sequential numbers to the end of their names.
:::

Here is a minimal example:
```cpp title="/src/native/hello.h"
std::string getHelloMessage(short a) { // JS Type: Number
  return 'Hello' + std::to_string(a) + '!';
}
std::string getHelloMessage(int a) { // JS Type: Number
  return 'Hello' + std::to_string(a) + '!';
}
```

```js title="/src/index.js"
import { initCppJs, getHelloMessage } from './native/hello.h';

await initCppJs();
const helloMessage = getHelloMessage(9);
console.log(helloMessage); // Hello 9!

const helloMessage2 = getHelloMessage2(8);
console.log(helloMessage2); // Hello 8!
```

# Function
### Simple function call
```cpp title="/src/native/hello.h"
std::string getHelloMessage(std::string name) {
  return 'Hello' + name + '!';
}
```

```js title="/src/index.js"
import { initCppJs } './native/hello.h';
const { getHelloMessage } = await initCppJs();

const helloMessage = getHelloMessage('Bugra');
console.log(helloMessage); // Hello Bugra!
```

### Overloaded functions
Functions can be overloaded based on the types of arguments in JavaScript. If the functions cannot be overloaded, they are distinguished by appending consecutive numbers to the end of their names.

<h1 align="center">Cpp.js</h1>

Bind C++ codes to JS on the web and react native without writing extra code.  

> **Note:** This project is currently under heavy development.

<https://gdal3.js.org>
  
  \
**Why Cpp.js?**  
- Seamless integration of C++ and JavaScript
- Power of native performance
- Use or create prebuilt cpp.js libraries
- Cross Platform

## Usage
**/src/index.js**
```js
import { Factorial } from './native/Factorial.h';

const factorial = new Factorial(99999);
const result = factorial.calculate();
console.log(result); // execution time: 2s
```

**/src/native/Factorial.h**
```c++
class Factorial {
private:
    int number;

public:
    Factorial(int num) : number(num) {}

    int calculate() {
        if (number < 0) return -1;

        int result = 1;
        for (int i = 2; i <= number; i++) {
            result *= i;
        }
        return result;
    }
};
```

## License
[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2013-present, Buğra Sarı

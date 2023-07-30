<h1 align="center">Cpp.js</h1>

Bind c++ libraries to js on web and mobile. Created by Buğra Sarı.

**Why Cpp.js?**  
- Perfect harmony of c++ and javascript
- Exceed native performance
- Cross Platform
- Use libraries from another platform.

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

# Data Types
Cpp.js efficiently bridges C++ and JavaScript, ensuring seamless type conversions. This page will cover primitive types as well as complex data structures, including enums, vectors, and maps.

### Primitive Types
When C++ code is bound to JavaScript, the data types in C++ are mapped to equivalent JavaScript types. The following table outlines these mappings:

| C++ type | JavaScript type | Cpp.js Sample | JavaScript Sample |
| -------- | --------------- | ------------- | ----------------- |
| `void` | undefined | `void sample()` | `sample()` |
| `bool` | true or false | `void sample(bool a)` | `sample(true)` |
| `char` | Number | `void sample(char a)` | `sample(9)` |
| `signed char` | Number | `void sample(signed char a)` | `sample(9)` |
| `unsigned char` | Number | `void sample(unsigned char a)` | `sample(9)` |
| `short` | Number | `void sample(short a)` | `sample(9)` |
| `unsigned short` | Number | `void sample(unsigned short a)` | `sample(9)` |
| `int` | Number | `void sample(int a)` | `sample(9)` |
| `unsigned int` | Number | `void sample(unsigned int a)` | `sample(9)` |
| `long` | BigInt | `void sample(long a)` | `sample(9n)` |
| `unsigned long` | BigInt | `void sample(unsigned long a)` | `sample(9n)` |
| `float` | Number | `void sample(float a)` | `sample(9.9)` |
| `double` | Number | `void sample(double a)` | `sample(9.9)` |
| `int64_t` | BigInt | `void sample(int64_t a)` | `sample(9n)` |
| `uint64_t` | BigInt | `void sample(uint64_t a)` | `sample(9n)` |
| `std::string` | String | `void sample(std::string a)` | `sample('s')` |
| `emscripten::val` | anything | `void sample(emscripten::val a)` | `sample('s')` |

This table highlights how common primitive types in C++ correspond to their closest JavaScript equivalents when using Cpp.js

### Vector
Cpp.js supports vectors for the following primitive types:

| C++ vector type  | Javascript class name |
| ----------------- | ---------- |
| `std::vector<char>` | VectorChar |
| `std::vector<short>` | VectorShort |
| `std::vector<int>` | VectorInt |
| `std::vector<int64_t>` | VectorInt64 |
| `std::vector<float>` | VectorFloat |
| `std::vector<double>` | VectorDouble |
| `std::vector<std::string>` | VectorString |

Additionally, Cpp.js supports vectors for any class. In JavaScript, the corresponding class name is formed by adding Vector to the beginning of the C++ class name.

For example:
    - `std::vector<MyClass>` in C++ becomes `VectorMyClass` in JavaScript.

Here is a minimal example:

```cpp title="C++"
std::vector<int> getMyVector();
void setMyVector(std::vector<int>);
```

```js title="JavaScript"
const myVector = getMyVector();

for (let i = 0; i < myVector.size(); i += 1) {
    console.log("Vector Value: ", myVector.get(i));
}

const newMyVector = new VectorInt();
newMyVector.push_back(9);
setMyVector(newMyVector);
```

:::info
For unsupported types, you can still use vectors, but you will need to manage them manually. This involves creating a module file and defining embind bindings for the required types.

Here is a minimal example:

```cpp title="/src/native/mycustom.i"
#pragma once

%module mycustom

%{
EMSCRIPTEN_BINDINGS(mycustom) {
    emscripten::register_vector<Abc>("VectorAbc");
}
%}

%feature("shared_ptr");
%feature("polymorphic_shared_ptr");
```

```js title="/src/index.js"
import './native/mycustom.i';
:::

**Conversion Between JavaScript Arrays and C++ Vectors**  
[The utility JavaScript functions](/docs/api/javascript/utility-functions), `toVector` and `toArray`, are used to convert a C++ Vector into a complete JavaScript Array and vice versa, transforming a JavaScript Array into a complete C++ Vector.

Here is a minimal example:

```js title="JavaScript"
const myVectorArray = toArray(getMyVector());
myVectorArray.forEach(value => console.log("Vector Value: ", value))

myVectorArray.push(9);
setMyVector(toVector(VectorInt, myVectorArray));
```

### Map
Cpp.js supports maps for the following primitive types:

| C++ vector type  | Javascript class name |
| ----------------- | ---------- |
| `std::map<int,int>` | MapIntInt |
| `std::map<int,std::string>` | MapIntString |
| `std::map<std::string,std::string>` | MapStringString |
| `std::map<std::string,int>` | MapStringInt |


Here is a minimal example:

```cpp title="C++"
std::unordered_map<int, int> getMyMap();
void setMyMap(std::unordered_map<int, int>);
```

```js title="JavaScript"
const myMap = getMyMap();
const myMapKeys = myMap.keys();

for (var i = 0; i < myMapKeys.size(); i++) {
    var key = myMapKeys.get(i);
    console.log("Map key/value: ", key, myMap.get(key));
}

const newMyMap = new MapIntInt();
newMyMap.set(9, 9);
setMyMap(newMyMap);
```

:::info
For unsupported types, you can still use maps, but you will need to manage them manually. This involves creating a module file and defining embind bindings for the required types.

Here is a minimal example:

```cpp title="/src/native/mycustom.i"
#pragma once

%module mycustom

%{
EMSCRIPTEN_BINDINGS(mycustom) {
    emscripten::register_map<double, double>("MapDoubleDouble");
}
%}

%feature("shared_ptr");
%feature("polymorphic_shared_ptr");
```

```js title="/src/index.js"
import './native/mycustom.i';
:::

### Enum
In C++, an enum is a user-defined type that consists of a set of named integral constants. It can be defined using the traditional "old style" or the strongly-typed "new style" introduced in C++11 (enum class).

Here is a minimal example:

```cpp title="C++"
enum OldStyle {
    OLD_STYLE_ONE,
    OLD_STYLE_TWO
};

enum class NewStyle {
    ONE,
    TWO
};
```

```js title="JavaScript"
const oldStyle = OldStyle.ONE;
const newStyle = NewStyle.TWO;
```

### Class Object

Here is a minimal example:

```cpp title="C++"
class A {};

std::shared_ptr<A> getClassObject();
void passClassObject(std::shared_ptr<A>);
```

```js title="JavaScript"
const classObject = getClassObject();
setClassObject(classObject);
```

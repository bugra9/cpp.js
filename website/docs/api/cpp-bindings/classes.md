# Classes and Objects
A class is a blueprint for creating objects, defining their attributes (data members) and behaviors (member functions). Objects are instances of a class, allowing you to create and manipulate data in a structured, reusable way.

### Constructors, Member Functions

Here is a minimal example:
```cpp title="/src/native/MyClass.h"
class MyClass {
    public:
        MyClass(int x) : x(x) {}
        int getX() { return x; }
        static int getVersion() { return 1; }
    private:
        int x;
}
```

```js title="/src/index.js"
import { initCppJs, MyClass } from './native/MyClass.h';

await initCppJs();
const version = MyClass.getVersion(); // static member function

const myObject = new MyClass(9); // constructor
const x = myObject.getX(); // member function

console.log(`version: ${version}, x: ${x}`); // version: 1, x: 9
```

### Inheritance
Here is a minimal example:

```cpp title="C++"
class Shape {
   public:
      void setWidth(int w) {
         width = w;
      }
      void setHeight(int h) {
         height = h;
      }
      
   protected:
      int width;
      int height;
};

// Derived class
class Rectangle: public Shape {
   public:
      int getArea() { 
         return (width * height); 
      }
};
```

```js title="JavaScript"
const rectangle = new Rectangle();

rectangle.setWidth(5);
rectangle.setHeight(7);

console.log(`Total area: ${rectangle.getArea()}`); // Print the area of the object.
```

### Polymorphism
Here is a minimal example:

```cpp title="C++"
class Shape {
   protected:
      int width, height;
      
   public:
      Shape( int a = 0, int b = 0){
         width = a;
         height = b;
      }
      int area() {
         return width * height;
      }
};

class Triangle: public Shape {
   public:
      Triangle( int a = 0, int b = 0) : Shape(a, b) { }
      
      int area () { 
         return (width * height / 2); 
      }
};

int getShapeArea(std::shared_ptr<Shape> shape) {
    return shape->area();
}
```

```js title="JavaScript"
const triangle = new Triangle(10, 5);
const triangleArea = triangle.area();
const shapeArea = getShapeArea(triangle);

console.log(`triangle area: ${triangleArea}`); // triangle area: 25
console.log(`shape area: ${shapeArea}`); // shape area: 50
```

### Interfaces (Abstract Classes)
Pure virtual functions must be implemented in JavaScript.

Here is a minimal example:

```cpp title="C++"
class Rectangle {
   public:
      // pure virtual function providing interface framework.
      virtual int getArea() = 0;

      void setWidth(int w) {
         width = w;
      }
   
      void setHeight(int h) {
         height = h;
      }

      int getWidth() { return width; }
      int getHeight() { return height; }
   
   protected:
      int width;
      int height;
};
```

```js title="JavaScript"
Rectangle.implement({
    getArea: function() {
        return this.getWidth() * this.getHeight();
    }
});

const rectangle = new Rectangle();

rectangle.setWidth(5);
rectangle.setHeight(7);

console.log(`Total area: ${rectangle.getArea()}`); // Total area: 35

```

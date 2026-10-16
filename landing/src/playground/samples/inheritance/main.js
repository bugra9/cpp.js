import {
    initNative, Circle, Square, Shape, describe,
} from './native/native.h';

await initNative();

const shapes = [new Circle(1), new Square(2)];

for (const shape of shapes) {
    console.log(describe(shape));
}
console.log('is a Shape:', shapes[0] instanceof Shape);

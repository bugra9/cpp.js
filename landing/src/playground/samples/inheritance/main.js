const shapes = [new Module.Circle(1), new Module.Square(2)];

for (const shape of shapes) {
    console.log(Module.describe(shape));
}
console.log('is a Shape:', shapes[0] instanceof Module.Shape);

console.log(Module.shout('hello'));

const colors = Module.split('red,green,blue', ',');
console.log(colors.size(), 'parts:', Module.toArray(colors));

const numbers = Module.toVector('VectorInt', [1, 2, 3, 4]);
console.log('total:', Module.total(numbers));

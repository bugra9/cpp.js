import {
    initNative, shout, split, total,
} from './native/native.h';

const m = await initNative();

console.log(shout('hello'));

const colors = split('red,green,blue', ',');
console.log(colors.size(), 'parts:', m.toArray(colors));

const numbers = m.toVector('VectorInt', [1, 2, 3, 4]);
console.log('total:', total(numbers));

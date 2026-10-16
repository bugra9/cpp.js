import { initNative, greet, Counter } from './native/native.h';

await initNative();

console.log(greet('crossbind'));

const counter = new Counter(41);
counter.increment();
console.log('the counter is at', counter.value());

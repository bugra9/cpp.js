import { initNative, countdown, applyTwice } from './native/native.h';

const m = await initNative();

const tick = (value) => console.log('tick', value);
const timesTen = (value) => value * 10;

countdown(3, tick);
console.log('applied twice:', applyTwice(timesTen, 4));

// Each function passed to C++ holds a slot until it is released.
m.releaseCallback(tick);
m.releaseCallback(timesTen);

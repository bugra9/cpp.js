const tick = (value) => console.log('tick', value);
const timesTen = (value) => value * 10;

Module.countdown(3, tick);
console.log('applied twice:', Module.applyTwice(timesTen, 4));

// Each function passed to C++ holds a slot until it is released.
Module.releaseCallback(tick);
Module.releaseCallback(timesTen);

// Module holds everything native.h declares.
console.log(Module.greet('crossbind'));

const counter = new Module.Counter(41);
counter.increment();
console.log('the counter is at', counter.value());

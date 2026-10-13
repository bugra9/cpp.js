console.log('average:', Module.average(3, 4));
console.log('is 10 even?', Module.isEven(10));

// A Number is exact up to 2^53; the BigInt keeps every digit.
const big = Module.fibonacci(90);
console.log(`fibonacci(90) = ${big}`);
console.log(`as a Number:    ${Number(big)}`);

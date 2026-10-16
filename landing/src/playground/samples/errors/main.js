import { initNative, squareRoot, parsePercent } from './native/native.h';

await initNative();

console.log('squareRoot(16) =', squareRoot(16));

for (const text of ['42', '250', 'abc']) {
    try {
        console.log(`${text} -> ${parsePercent(text)}`);
    } catch (error) {
        console.log(`${text} -> ${error.message}`);
    }
}

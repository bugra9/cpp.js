import {
    initNative, Tally, parseScore,
} from './native/words.rs';

await initNative();

const tally = new Tally();
tally.add('crossbind imports Rust');
tally.add('like a header');

// A Vec arrives as an array, and None as null.
console.log(tally.words());
console.log('the longest:', tally.longest());
console.log('in a new tally:', new Tally().longest());

for (const text of ['42', '250', 'abc']) {
    try {
        console.log(`${text} -> ${parseScore(text)}`);
    } catch (error) {
        console.log(`${text} -> ${error.message}`);
    }
}

console.log('squareRoot(16) =', Module.squareRoot(16));

for (const text of ['42', '250', 'abc']) {
    try {
        console.log(`${text} -> ${Module.parsePercent(text)}`);
    } catch (error) {
        console.log(`${text} -> ${error.message}`);
    }
}

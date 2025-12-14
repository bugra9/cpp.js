class Matrix extends Array {
    constructor(size, initValue) { super(size); this.fill(initValue); }

    get(i) { return this[i]; }

    multiple(otherMatrix) {
        const size = Math.sqrt(this.length);
        const result = new Matrix(this.length, 0);

        for (let i = 0; i < size; i += 1) {
            for (let j = 0; j < size; j += 1) {
                for (let k = 0; k < size; k += 1) {
                    result[i * size + j] += this[i * size + k] * otherMatrix[k * size + j];
                }
            }
        }
        return result;
    }
}

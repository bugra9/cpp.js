#include "Matrix.h"

int Matrix::get(int i) { return this->at(i); }

std::shared_ptr<Matrix> Matrix::multiple(std::shared_ptr<Matrix> b) {
    int size = sqrt(this->size());
    auto result = std::make_shared<Matrix>(this->size(), 0);

    for (int i = 0; i < size; i += 1) {
        for (int j = 0; j < size; j += 1) {
            for (int k = 0; k < size; k += 1) {
                (*result)[i * size + j] += this->at(i * size + k) * (*b)[k * size + j];
            }
        }
    }
    return result;
}

#pragma once

#include <vector>
#include <memory>
#include <cmath>

class Matrix : public std::vector<int> {
public:
    Matrix(int size, int initValue) : std::vector<int>(size, initValue) {}
    int get(int i) { return this->at(i); }
    Matrix multiple(Matrix &b) {
        int size = sqrt(this->size());
        Matrix result(this->size(), 0);

        for (int i = 0; i < size; ++i) {
            for (int j = 0; j < size; ++j) {
                for (int k = 0; k < size; ++k) {
                    result[i * size + j] += this->at(i * size + k) * b[k * size + j];
                }
            }
        }
        return result;
    }
};

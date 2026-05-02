#pragma once

#include <vector>
#include <memory>
#include <cmath>

class Matrix : public std::vector<int> {
public:
    Matrix(int size, int initValue) : std::vector<int>(size, initValue) {}
    int get(int i);
    std::shared_ptr<Matrix> multiple(std::shared_ptr<Matrix> b);
};

#include "native.h"

#include <cmath>
#include <stdexcept>

double squareRoot(double value) {
    if (value < 0) {
        throw std::invalid_argument("negative value");
    }
    return std::sqrt(value);
}

int parsePercent(const std::string &text) {
    const int value = std::stoi(text);
    if (value < 0 || value > 100) {
        throw std::out_of_range("not between 0 and 100");
    }
    return value;
}

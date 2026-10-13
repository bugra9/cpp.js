#include "native.h"

#include <cstdio>

namespace {
constexpr double PI = 3.14159265358979323846;
}

Circle::Circle(double radius) : radius(radius) {}

double Circle::area() const {
    return PI * radius * radius;
}

std::string Circle::name() const {
    return "circle";
}

Square::Square(double side) : side(side) {}

double Square::area() const {
    return side * side;
}

std::string Square::name() const {
    return "square";
}

std::string describe(const Shape &shape) {
    char area[32];
    std::snprintf(area, sizeof area, "%.2f", shape.area());
    return "a " + shape.name() + " with an area of " + area;
}

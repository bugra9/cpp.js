#pragma once

#include <string>

// A Circle or a Square goes wherever a Shape is expected,
// and a virtual call runs the derived class's code.
class Shape {
public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
    virtual std::string name() const = 0;
};

class Circle : public Shape {
public:
    explicit Circle(double radius);
    double area() const override;
    std::string name() const override;

private:
    double radius;
};

class Square : public Shape {
public:
    explicit Square(double side);
    double area() const override;
    std::string name() const override;

private:
    double side;
};

std::string describe(const Shape &shape);

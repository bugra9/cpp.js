#pragma once

#include <memory>
#include <vector>
#include <string>

int bugra_a(int a);

class BugraClass {
public:
    BugraClass(int b);
    int deneme(int a);

    int getB() const;
    void setB(int b_);

private:
    int b;
};

class Bugra2Class: public BugraClass {
public:
    Bugra2Class(int b) : BugraClass(b) {}
};

class Bugra3Class {
public:
    static int waav(std::shared_ptr<BugraClass>& b, int a);
    static int oo(int d);
    static std::vector<int> getIntVector();
    static std::vector<std::string> getStringVector();
};

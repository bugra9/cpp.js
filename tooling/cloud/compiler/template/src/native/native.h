#pragma once

#include <string>

// Every public function and class declared here can be called
// from JavaScript.
std::string greet(const std::string &name);

class Counter {
public:
    explicit Counter(int start);
    int increment();
    int value() const;

private:
    int current;
};

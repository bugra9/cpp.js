#pragma once

#include <string>
#include <vector>

// std::string crosses as a JavaScript string.
std::string shout(const std::string &text);

// A returned std::vector arrives as a vector object:
// size() and get(i) read it; the module's toArray makes an array.
std::vector<std::string> split(std::string text, char separator);

// A function's std::vector parameter takes a plain array.
int total(const std::vector<int> &values);

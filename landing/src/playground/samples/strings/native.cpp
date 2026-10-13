#include "native.h"

#include <cctype>
#include <sstream>

std::string shout(const std::string &text) {
    std::string loud;
    for (unsigned char c : text) loud += std::toupper(c);
    return loud + "!";
}

std::vector<std::string> split(std::string text, char separator) {
    std::vector<std::string> parts;
    std::istringstream stream(text);
    std::string part;
    while (std::getline(stream, part, separator)) {
        parts.push_back(part);
    }
    return parts;
}

int total(const std::vector<int> &values) {
    int sum = 0;
    for (const int value : values) sum += value;
    return sum;
}

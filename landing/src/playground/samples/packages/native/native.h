#pragma once

#include <string>

// nlohmann_json is all C++ templates, so JavaScript reaches it
// through a function of the project's own.
std::string pretty(const std::string &json);

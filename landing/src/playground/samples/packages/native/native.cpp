#include "native.h"

#include <nlohmann/json.hpp>

std::string pretty(const std::string &json) {
    return nlohmann::json::parse(json).dump(2);
}

#include <emscripten/bind.h>

EMSCRIPTEN_BINDINGS(CommonBridges) {
    emscripten::register_vector<char>("VectorChar");
    emscripten::register_vector<short>("VectorShort");
    emscripten::register_vector<int>("VectorInt");
    emscripten::register_vector<int64_t>("VectorInt64");
    emscripten::register_vector<float>("VectorFloat");
    emscripten::register_vector<double>("VectorDouble");
    emscripten::register_vector<std::string>("VectorString");

    emscripten::register_map<int,int>("MapIntInt");
    emscripten::register_map<int,std::string>("MapIntString");
    emscripten::register_map<std::string,std::string>("MapStringString");
    emscripten::register_map<std::string,int>("MapStringInt");
}

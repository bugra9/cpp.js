cmake_minimum_required(VERSION 3.4.1)
project(react-native-cppjs VERSION "1.0.0")
set(CMAKE_CXX_STANDARD 17)

# add_subdirectory(../node_modules/react-native-embind/cpp ${CMAKE_CURRENT_BINARY_DIR}/react-native-embind)
file(GLOB_RECURSE SRC_FILES ../../../src/native/*.cpp)
add_library(react-native-cppjs SHARED ${SRC_FILES} ./src/JSI_module.cpp ../../react-native-embind/cpp/src/emscripten/bind.cpp ../../react-native/ReactCommon/jsi/jsi/jsi.cpp)

#target_link_libraries(react-native-cppjs
#    react_native_embind
#    )

target_include_directories(react-native-cppjs PUBLIC ./src ../../react-native-embind/cpp/src ../../react-native/ReactCommon/jsi ../../../src/native)

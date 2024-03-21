cmake_minimum_required(VERSION 3.13)
set(CMAKE_CXX_COMPILER clang++)
set(MODULE_NAME react_native_embind)
add_definitions(-D__wasm64__)

add_compile_options(
        -fexceptions
        -frtti
        -std=c++17)

file(GLOB_RECURSE CPP_SOURCE ./src/*.cpp)
add_library(${MODULE_NAME} STATIC ${CPP_SOURCE})

target_include_directories(${MODULE_NAME} PUBLIC src)

target_link_libraries(${MODULE_NAME} jsi)

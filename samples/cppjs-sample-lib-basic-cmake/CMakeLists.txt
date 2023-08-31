cmake_minimum_required(VERSION 3.1)
set(CMAKE_CXX_STANDARD 11)
project(cppjs-lib-samplebasiccmake-wasm)

add_library(cppjs-lib-samplebasiccmake-wasm STATIC src/native/samplebasiccmake.cpp)

target_include_directories(cppjs-lib-samplebasiccmake-wasm PUBLIC
    src/native
)

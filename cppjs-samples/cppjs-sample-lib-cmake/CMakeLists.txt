cmake_minimum_required(VERSION 3.28)
set(CMAKE_CXX_STANDARD 11)

# The consuming cpp.js build adds this file with add_subdirectory and links the library by
# the name it passes in as CPPJS_LIB_NAME; PUBLIC includes only propagate to the app when
# the target carries exactly that name.
if(NOT DEFINED CPPJS_LIB_NAME)
    set(CPPJS_LIB_NAME cppjs-lib-samplebasiccmake-wasm)
endif()
project(${CPPJS_LIB_NAME})

add_library(${CPPJS_LIB_NAME} STATIC ${CMAKE_CURRENT_SOURCE_DIR}/src/native/samplebasiccmake.cpp)

target_include_directories(${CPPJS_LIB_NAME} PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/src/native
)

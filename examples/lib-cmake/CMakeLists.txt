cmake_minimum_required(VERSION 3.28)
set(CMAKE_CXX_STANDARD 11)

# The consuming crossbind build adds this file with add_subdirectory and links the library by
# the name it passes in as CROSSBIND_LIB_NAME; PUBLIC includes only propagate to the app when
# the target carries exactly that name.
if(NOT DEFINED CROSSBIND_LIB_NAME)
    set(CROSSBIND_LIB_NAME crossbind-lib-samplebasiccmake-wasm)
endif()
project(${CROSSBIND_LIB_NAME})

add_library(${CROSSBIND_LIB_NAME} STATIC ${CMAKE_CURRENT_SOURCE_DIR}/src/native/samplebasiccmake.cpp)

target_include_directories(${CROSSBIND_LIB_NAME} PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}/src/native
)

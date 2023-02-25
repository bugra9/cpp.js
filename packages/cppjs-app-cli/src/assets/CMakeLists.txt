cmake_minimum_required(VERSION 3.1)
project("${PROJECT_NAME}")

option(BUILD_BRIDGE "Build Bridge" OFF)
option(BUILD_SOURCE "Build Source" OFF)

if(BUILD_SOURCE)
file(GLOB BUILD_SRC_FILES "${BASE_DIR}/native/**/*.cpp" "${BASE_DIR}/native/*.cpp" "${BASE_DIR}/src/native/**/*.cpp" "${BASE_DIR}/src/native/*.cpp")
endif(BUILD_SOURCE)
unset(BUILD_SOURCE CACHE)

message("aa", BUILD_SRC_FILES)

if(BUILD_BRIDGE)
file(GLOB BRIDGE_SRC_FILES "${BRIDGE_DIR}/*.i.cpp")
endif(BUILD_BRIDGE)
unset(BUILD_BRIDGE CACHE)

set(SRC_FILES "${BUILD_SRC_FILES}" "${BRIDGE_SRC_FILES}")
add_library("${PROJECT_NAME}" STATIC ${SRC_FILES})

file(GLOB HEADERS "${BASE_DIR}/node_modules/cppjs-lib-*/include")
include_directories("${HEADERS};${BASE_DIR}/native;${BASE_DIR}/src/native")

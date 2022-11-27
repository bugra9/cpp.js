cmake_minimum_required(VERSION 3.1)
project(cppjs)

file(GLOB SRC_FILES "${BASE_DIR}/native/**/*.cpp" "${BASE_DIR}/native/*.cpp" "${BRIDGE_DIR}/*.i.cpp")
add_library(cppjs STATIC ${SRC_FILES})

file(GLOB HEADERS "${BASE_DIR}/node_modules/cppjs-lib-*/include")
message("... ${SRC_FILES} . ${HEADERS};${BASE_DIR}/native")
include_directories("${HEADERS};${BASE_DIR}/native")

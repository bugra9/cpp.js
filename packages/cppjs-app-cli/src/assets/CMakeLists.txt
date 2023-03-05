cmake_minimum_required(VERSION 3.25)
project("${PROJECT_NAME}")

option(BUILD_BRIDGE "Build Bridge" OFF)
option(BUILD_SOURCE "Build Source" OFF)

if(BUILD_SOURCE)
file(GLOB_RECURSE BUILD_SRC_FILES ${NATIVE_GLOB})
endif(BUILD_SOURCE)

if(BUILD_BRIDGE)
file(GLOB BRIDGE_SRC_FILES "${BRIDGE_DIR}/*.i.cpp")
endif(BUILD_BRIDGE)

set(SRC_FILES "${BUILD_SRC_FILES}" "${BRIDGE_SRC_FILES}")
add_library("${PROJECT_NAME}" STATIC ${SRC_FILES})

file(GLOB LIB_HEADERS_DIR "${BASE_DIR}/node_modules/cppjs-lib-*/include" "${BASE_DIR}/node_modules/cppjs-lib-*/node_modules/cppjs-lib-*/include")
file(GLOB_RECURSE HEADER_FILES ${HEADER_GLOB})
target_include_directories("${PROJECT_NAME}" PUBLIC "${LIB_HEADERS_DIR}" "${HEADER_DIR}")

if(BUILD_SOURCE)
target_sources("${PROJECT_NAME}"
    PUBLIC FILE_SET HEADERS
    BASE_DIRS "${HEADER_DIR}"
    FILES "${HEADER_FILES}")

string(REPLACE "-" ";" HEADER_FOLDER ${PROJECT_NAME})
list(GET HEADER_FOLDER 2 HEADER_FOLDER)
install(TARGETS "${PROJECT_NAME}" FILE_SET HEADERS DESTINATION "include/cppjs-lib-${HEADER_FOLDER}")
endif(BUILD_SOURCE)
unset(BUILD_SOURCE CACHE)

if(BUILD_BRIDGE)
install(TARGETS "${PROJECT_NAME}")
endif(BUILD_BRIDGE)
unset(BUILD_BRIDGE CACHE)

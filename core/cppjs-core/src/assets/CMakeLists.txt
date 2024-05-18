cmake_minimum_required(VERSION 3.25)
set(CMAKE_CXX_STANDARD 17)
project("${PROJECT_NAME}")

if (CMAKE_SYSTEM_NAME STREQUAL "iOS")
    if (CMAKE_OSX_SYSROOT MATCHES "/iPhoneOS.platform/")
        set(PACKAGE_HOST "iOS-iphoneos")
    elseif(CMAKE_OSX_SYSROOT MATCHES "/iPhoneSimulator.platform/")
        set(PACKAGE_HOST "iOS-iphonesimulator")
    else()
        set(PACKAGE_HOST "iOS-unknown")
    endif()
else()
    set(PACKAGE_HOST "${CMAKE_SYSTEM_NAME}-${CMAKE_HOST_SYSTEM_PROCESSOR}")
endif()

option(BUILD_BRIDGE "Build Bridge" OFF)
option(BUILD_SOURCE "Build Source" OFF)

foreach(depend IN ZIP_LISTS DEPENDS_CMAKE_PATHS DEPENDS_CMAKE_NAMES)
    add_subdirectory("${depend_0}" "${CMAKE_CURRENT_BINARY_DIR}/dependencies/${depend_1}")
endforeach()

if (BUILD_SOURCE)
    file(GLOB_RECURSE BUILD_SRC_FILES ${NATIVE_GLOB})
endif(BUILD_SOURCE)

if (BUILD_BRIDGE)
    file(GLOB BRIDGE_SRC_FILES "${BRIDGE_DIR}/*.i.cpp")
endif(BUILD_BRIDGE)

set(SRC_FILES "${BUILD_SRC_FILES}" "${BRIDGE_SRC_FILES}")
add_library("${PROJECT_NAME}" "${BUILD_TYPE}" ${SRC_FILES})

set(EXTRA_LINK_LIBRARIES "")
if(ANDROID)
    set(EXTRA_LINK_LIBRARIES "log")
endif()

if (NOT ${CMAKE_SYSTEM_NAME} STREQUAL "")
    target_link_libraries("${PROJECT_NAME}" "${DEPENDS_CMAKE_NAMES}" "${EXTRA_LINK_LIBRARIES}")
endif()

file(GLOB_RECURSE HEADER_FILES ${HEADER_GLOB})
target_include_directories("${PROJECT_NAME}" PUBLIC "${HEADER_DIR}")

if (BUILD_SOURCE)
    install(TARGETS "${PROJECT_NAME}" DESTINATION "lib")
    if(NOT "${HEADER_FILES}" STREQUAL "")
        target_sources("${PROJECT_NAME}"
            PUBLIC FILE_SET HEADERS
            BASE_DIRS "${HEADER_DIR}"
            FILES "${HEADER_FILES}")
        install(TARGETS "${PROJECT_NAME}" FILE_SET HEADERS DESTINATION "include")
    endif()
endif(BUILD_SOURCE)
unset(BUILD_SOURCE CACHE)

if (BUILD_BRIDGE)
    install(TARGETS "${PROJECT_NAME}")
endif(BUILD_BRIDGE)
unset(BUILD_BRIDGE CACHE)

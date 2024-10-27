cmake_minimum_required(VERSION 3.28)
set(CMAKE_CXX_STANDARD 11)
set(PROJECT_NAME "___PROJECT_NAME___")
set(PROJECT_LIBS "___PROJECT_LIBS___")
project("${PROJECT_NAME}")

if(ANDROID)
    set(PACKAGE_HOST "${CMAKE_SYSTEM_NAME}-${CMAKE_ANDROID_ARCH_ABI}")
    set(PACKAGE_DIR "${PROJECT_SOURCE_DIR}/${PACKAGE_HOST}/lib")
elseif(APPLE)
    if (CMAKE_SYSTEM_NAME STREQUAL "iOS")
        set(PACKAGE_DIR "${PROJECT_SOURCE_DIR}")
    else()
        set(PACKAGE_HOST "${CMAKE_SYSTEM_NAME}-${CMAKE_HOST_SYSTEM_PROCESSOR}")
        set(PACKAGE_DIR "${PROJECT_SOURCE_DIR}/${PACKAGE_HOST}/lib")
    endif()
elseif(UNIX)
    set(PACKAGE_HOST "${CMAKE_SYSTEM_NAME}-${CMAKE_HOST_SYSTEM_PROCESSOR}")
    set(PACKAGE_DIR "${PROJECT_SOURCE_DIR}/${PACKAGE_HOST}/lib")
else()
    set(PACKAGE_HOST "${CMAKE_SYSTEM_NAME}-${CMAKE_HOST_SYSTEM_PROCESSOR}")
    set(PACKAGE_DIR "${PROJECT_SOURCE_DIR}/${PACKAGE_HOST}/lib")
endif()

set(PROJECT_LIBS_DIR)
foreach(L IN LISTS PROJECT_LIBS)
    SET(FOUND_LIB "FOUND_LIB-NOTFOUND")
    find_library(FOUND_LIB
        NAMES "${L}"
        PATHS "${PACKAGE_DIR}"
        NO_CACHE
        NO_DEFAULT_PATH
        NO_CMAKE_FIND_ROOT_PATH
        REQUIRED
    )
    LIST(APPEND PROJECT_LIBS_DIR ${FOUND_LIB})
endforeach()

add_library("${PROJECT_NAME}" INTERFACE)
target_link_libraries("${PROJECT_NAME}" INTERFACE "${PROJECT_LIBS_DIR}")

if(NOT APPLE)
target_include_directories("${PROJECT_NAME}" INTERFACE "${PROJECT_SOURCE_DIR}/${PACKAGE_HOST}/include")
endif()
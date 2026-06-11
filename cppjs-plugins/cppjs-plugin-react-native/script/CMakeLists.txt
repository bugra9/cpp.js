cmake_minimum_required(VERSION 3.28)

execute_process(
    COMMAND node ${CMAKE_SOURCE_DIR}/getCliPath.js
    WORKING_DIRECTORY ${CPPJS_PROJECT_PATH}
    OUTPUT_VARIABLE NODE_OUTPUT
    OUTPUT_STRIP_TRAILING_WHITESPACE
    RESULT_VARIABLE NODE_RESULT
)

if(NODE_RESULT)
    message(FATAL_ERROR "Node script failed")
endif()

set(CPPJS_CLI_PATH "${NODE_OUTPUT}")

execute_process(
    COMMAND node ${CMAKE_SOURCE_DIR}/build_js.js android
    WORKING_DIRECTORY ${CPPJS_PROJECT_PATH}
    RESULT_VARIABLE NODE_RESULT
)

if(NODE_RESULT)
    message(FATAL_ERROR "Node script failed")
endif()

# build_android.js writes the parameter list to a file instead of stdout, so cpp.js
# log lines can never corrupt the parsing below.
set(CPPJS_PARAMS_FILE "${CMAKE_CURRENT_BINARY_DIR}/cppjs-cmake-params.txt")
execute_process(
    COMMAND node ${CMAKE_SOURCE_DIR}/build_android.js ${ANDROID_ABI} ${CMAKE_BUILD_TYPE} ${CPPJS_PARAMS_FILE}
    WORKING_DIRECTORY ${CPPJS_PROJECT_PATH}
    RESULT_VARIABLE NODE_RESULT
)

if(NODE_RESULT)
    message(FATAL_ERROR "Node script failed")
endif()

# One -DKEY=VALUE per line; file(STRINGS) escapes embedded semicolons so list
# values (globs, search paths) survive intact.
file(STRINGS "${CPPJS_PARAMS_FILE}" CPPJS_PARAM_LINES)

foreach(arg IN LISTS CPPJS_PARAM_LINES)
    if("${arg}" STREQUAL "")
        continue()
    endif()
    string(SUBSTRING "${arg}" 2 -1 def)
    string(FIND "${def}" "=" eq_pos)

    if(eq_pos EQUAL -1)
        set(key "${def}")
        set(value "")
    else()
        string(SUBSTRING "${def}" 0 ${eq_pos} key)
        math(EXPR val_pos "${eq_pos} + 1")
        string(SUBSTRING "${def}" ${val_pos} -1 value)
    endif()

    set(${key} "${value}")
    message("${key} = ${value}")
endforeach()

message("PROJECT_NAME = ${PROJECT_NAME}")

# build_android_deps.js (gradle task cppjsDeps) refreshes this stamp whenever the
# consumed rebuilt-dependency set changes; registering it as a configure dependency
# makes ninja re-run CMake automatically — no gradle-argument tricks needed.
set(CPPJS_DEPS_STAMP_FILE "${CPPJS_PROJECT_PATH}/.cppjs/deps-stamp")
set_property(DIRECTORY APPEND PROPERTY CMAKE_CONFIGURE_DEPENDS "${CPPJS_DEPS_STAMP_FILE}")
if(EXISTS "${CPPJS_DEPS_STAMP_FILE}")
    file(READ "${CPPJS_DEPS_STAMP_FILE}" CPPJS_DEPS_STAMP)
endif()
message("CPPJS_DEPS_STAMP = ${CPPJS_DEPS_STAMP}")

include("${CPPJS_CLI_PATH}/assets/cmake/CMakeLists.txt")

if(ANDROID)
    find_package(ReactAndroid REQUIRED CONFIG)
    find_package(fbjni REQUIRED CONFIG)
    target_link_libraries("${PROJECT_NAME}"
        ReactAndroid::jsi
        ReactAndroid::reactnative
        fbjni::fbjni)
endif()

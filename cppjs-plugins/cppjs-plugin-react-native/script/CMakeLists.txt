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

file(READ "${CPPJS_PARAMS_FILE}" NODE_OUTPUT)
string(STRIP "${NODE_OUTPUT}" NODE_OUTPUT)

set(remaining "${NODE_OUTPUT}")

while(TRUE)
    string(FIND "${remaining}" ";;;" delim_pos)

    if(delim_pos EQUAL -1)
        set(arg "${remaining}")
    else()
        string(SUBSTRING "${remaining}" 0 ${delim_pos} arg)
        math(EXPR next_pos "${delim_pos} + 3")
        string(SUBSTRING "${remaining}" ${next_pos} -1 remaining)
    endif()

    if(NOT "${arg}" STREQUAL "")
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
    endif()

    if(delim_pos EQUAL -1)
        break()
    endif()
endwhile()

message("PROJECT_NAME = ${PROJECT_NAME}")
message("NODE_OUTPUT = ${NODE_OUTPUT}")
# Passed from build.gradle solely to invalidate AGP's cached configure when the
# source-rebuilt dependency set changes; referencing it also avoids the unused-variable warning.
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

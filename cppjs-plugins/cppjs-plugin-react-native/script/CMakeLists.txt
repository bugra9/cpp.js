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
    OUTPUT_VARIABLE NODE_OUTPUT
    OUTPUT_STRIP_TRAILING_WHITESPACE
    RESULT_VARIABLE NODE_RESULT
)

if(NODE_RESULT)
    message(FATAL_ERROR "Node script failed")
endif()

execute_process(
    COMMAND node ${CMAKE_SOURCE_DIR}/build_android.js ${ANDROID_ABI} ${CMAKE_BUILD_TYPE}
    WORKING_DIRECTORY ${CPPJS_PROJECT_PATH}
    OUTPUT_VARIABLE NODE_OUTPUT
    OUTPUT_STRIP_TRAILING_WHITESPACE
    RESULT_VARIABLE NODE_RESULT
)

if(NODE_RESULT)
    message(FATAL_ERROR "Node script failed")
endif()

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

include("${CPPJS_CLI_PATH}/assets/cmake/CMakeLists.txt")

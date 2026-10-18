cmake_minimum_required(VERSION 3.28)
project(crossbind_app CXX OBJCXX)

# crossbind configures this project for one app host: the window and its webview, Hermes and the embind runtime
# compile here, the project's own code arrives as prebuilt archives in CROSSBIND_LINK_ARGS.

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_OBJCXX_STANDARD 20)

set(THIRD_PARTY "${CMAKE_CURRENT_SOURCE_DIR}/../third_party")
set(PLATFORM_SOURCES src/darwin/bundle.mm src/darwin/channels.mm src/darwin/navigation.mm)

add_executable(app
    src/host_core.cpp
    src/main.cpp
    ${PLATFORM_SOURCES}
    "${THIRD_PARTY}/jsi/jsi.cpp"
    "${CROSSBIND_JSI_ROOT}/cpp/src/emscripten/bind.cpp"
    ${CROSSBIND_EXTRA_SOURCES})

set_target_properties(app PROPERTIES OUTPUT_NAME "${CROSSBIND_APP_FILE}")
set_source_files_properties(${PLATFORM_SOURCES} PROPERTIES COMPILE_OPTIONS -fobjc-arc)
# Only a debug host opens the page of a dev server.
target_compile_definitions(app PRIVATE "$<$<CONFIG:Debug>:CROSSBIND_APP_DEV>")

target_include_directories(app PRIVATE
    src
    "${CROSSBIND_HERMES}/include"
    "${CROSSBIND_JSI_ROOT}/cpp/src"
    "${THIRD_PARTY}/webview/core/include")

# Hermes is a framework the app bundle carries next to the executable. Only what main() and the bindings' static
# initializers reach stays, without the local symbols of a release build.
target_link_options(app PRIVATE "-F${CROSSBIND_HERMES}/Library/Frameworks/macosx" "LINKER:-rpath,@executable_path/../Frameworks"
    "LINKER:-dead_strip" "$<$<CONFIG:Release>:LINKER:-x>")
target_link_libraries(app PRIVATE ${CROSSBIND_LINK_ARGS} "-framework hermesvm" "-framework WebKit" "-framework Cocoa")
# A force-loaded archive reaches the link as a linker flag, which CMake does not track: without this, a rebuilt bridge
# archive would leave the previous host in place.
set_property(TARGET app APPEND PROPERTY LINK_DEPENDS ${CROSSBIND_LINK_DEPENDS})

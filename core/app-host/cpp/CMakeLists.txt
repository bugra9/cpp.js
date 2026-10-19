cmake_minimum_required(VERSION 3.28)
if(APPLE)
    project(crossbind_app CXX OBJCXX)
else()
    project(crossbind_app CXX)
endif()

# crossbind configures this project for one app host: the window and its webview, Hermes and the embind runtime
# compile here, the project's own code arrives as prebuilt archives in CROSSBIND_LINK_ARGS.

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(THIRD_PARTY "${CMAKE_CURRENT_SOURCE_DIR}/../third_party")
if(APPLE)
    set(CMAKE_OBJCXX_STANDARD 20)
    set(PLATFORM_SOURCES src/darwin/bundle.mm src/darwin/channels.mm src/darwin/navigation.mm)
else()
    set(PLATFORM_SOURCES src/linux/app.cpp src/linux/channels.cpp src/linux/navigation.cpp)
endif()

add_executable(app
    src/host_core.cpp
    src/main.cpp
    ${PLATFORM_SOURCES}
    "${THIRD_PARTY}/jsi/jsi.cpp"
    "${CROSSBIND_JSI_ROOT}/cpp/src/emscripten/bind.cpp"
    ${CROSSBIND_EXTRA_SOURCES})

set_target_properties(app PROPERTIES OUTPUT_NAME "${CROSSBIND_APP_FILE}")
# Only a debug host opens the page of a dev server.
target_compile_definitions(app PRIVATE "$<$<CONFIG:Debug>:CROSSBIND_APP_DEV>")

target_include_directories(app PRIVATE
    src
    "${CROSSBIND_HERMES}/include"
    "${CROSSBIND_JSI_ROOT}/cpp/src"
    "${THIRD_PARTY}/webview/core/include")
target_link_libraries(app PRIVATE ${CROSSBIND_LINK_ARGS})
# A force-loaded archive reaches the link as a linker flag, which CMake does not track: without this, a rebuilt bridge
# archive would leave the previous host in place.
set_property(TARGET app APPEND PROPERTY LINK_DEPENDS ${CROSSBIND_LINK_DEPENDS})

if(APPLE)
    set_source_files_properties(${PLATFORM_SOURCES} PROPERTIES COMPILE_OPTIONS -fobjc-arc)
    # Hermes is a framework the app bundle carries next to the executable. Only what main() and the bindings' static
    # initializers reach stays, without the local symbols of a release build.
    target_link_options(app PRIVATE "-F${CROSSBIND_HERMES}/Library/Frameworks/macosx" "LINKER:-rpath,@executable_path/../Frameworks"
        "LINKER:-dead_strip" "$<$<CONFIG:Release>:LINKER:-x>")
    target_link_libraries(app PRIVATE "-framework hermesvm" "-framework WebKit" "-framework Cocoa")
else()
    # WebKitGTK comes from the Ubuntu 22.04 packages crossbind downloads: its headers are searched after the C library's,
    # which the image's glibc 2.28 sysroot keeps, and its libraries are only linked against, as the system's load at run
    # time.
    set(GTK_LIB "${CROSSBIND_GTK_SYSROOT}/usr/lib/${CROSSBIND_GTK_MULTIARCH}")
    foreach(dir webkitgtk-4.1 libsoup-3.0 gtk-3.0 at-spi2-atk/2.0 at-spi-2.0 dbus-1.0 gio-unix-2.0 cairo pango-1.0 harfbuzz
            fribidi atk-1.0 pixman-1 uuid freetype2 gdk-pixbuf-2.0 libpng16 libmount blkid glib-2.0)
        target_include_directories(app SYSTEM PRIVATE "${CROSSBIND_GTK_SYSROOT}/usr/include/${dir}")
    endforeach()
    target_include_directories(app SYSTEM PRIVATE "${GTK_LIB}/glib-2.0/include" "${GTK_LIB}/dbus-1.0/include")
    target_compile_options(app PRIVATE "SHELL:-idirafter ${CROSSBIND_GTK_SYSROOT}/usr/include")
    target_link_directories(app PRIVATE "${GTK_LIB}")
    target_link_libraries(app PRIVATE "${CROSSBIND_HERMES}/lib/libhermesvm_a.a" "${CROSSBIND_HERMES}/lib/libboost_context.a"
        -Wl,--as-needed webkit2gtk-4.1 javascriptcoregtk-4.1 soup-3.0 gtk-3 gdk-3 gio-2.0 gobject-2.0 glib-2.0 pthread dl)
    # The static libc++ stays inside: WebKitGTK loads the system's libstdc++, which must not bind to it.
    target_link_options(app PRIVATE "LINKER:--allow-shlib-undefined" "LINKER:--exclude-libs,ALL" "LINKER:--gc-sections"
        "$<$<CONFIG:Release>:LINKER:-s>")
endif()

cmake_minimum_required(VERSION 3.28)
if(APPLE)
    project(crossbind_app CXX OBJCXX)
else()
    project(crossbind_app CXX)
endif()

# crossbind configures this project for one app host: the window and its webview, Hermes and the embind runtime
# compile here, the project's own code arrives as prebuilt archives in CROSSBIND_LINK_ARGS. An iOS host is a static
# library instead, which the app's Xcode project links with those archives, and an Android host a shared library the
# app's activity loads, beside the JSI its Hermes loads.

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(THIRD_PARTY "${CMAKE_CURRENT_SOURCE_DIR}/../third_party")
if(CMAKE_SYSTEM_NAME STREQUAL "iOS")
    set(PLATFORM_SOURCES src/ios/main.mm src/ios/bundle.mm src/darwin/channels.mm src/darwin/navigation.mm)
elseif(APPLE)
    set(PLATFORM_SOURCES src/darwin/bundle.mm src/darwin/channels.mm src/darwin/navigation.mm)
elseif(ANDROID)
    set(PLATFORM_SOURCES src/android/jni.cpp)
else()
    set(PLATFORM_SOURCES src/linux/app.cpp src/linux/channels.cpp src/linux/navigation.cpp)
endif()
if(APPLE)
    set(CMAKE_OBJCXX_STANDARD 20)
endif()

set(SOURCES
    src/app.cpp
    src/host_core.cpp
    ${PLATFORM_SOURCES}
    "${CROSSBIND_JSI_ROOT}/cpp/src/emscripten/bind.cpp"
    ${CROSSBIND_EXTRA_SOURCES})
if(CMAKE_SYSTEM_NAME STREQUAL "iOS")
    add_library(app STATIC src/attach.cpp "${THIRD_PARTY}/jsi/jsi.cpp" ${SOURCES})
elseif(ANDROID)
    add_library(jsi SHARED "${THIRD_PARTY}/jsi/jsi.cpp")
    target_include_directories(jsi PUBLIC "${THIRD_PARTY}/jsi/include")
    add_library(app SHARED ${SOURCES})
else()
    add_executable(app src/main.cpp src/attach.cpp "${THIRD_PARTY}/jsi/jsi.cpp" ${SOURCES})
endif()

set_target_properties(app PROPERTIES OUTPUT_NAME "${CROSSBIND_APP_FILE}")
# Only a debug host opens the page of a dev server.
target_compile_definitions(app PRIVATE "$<$<CONFIG:Debug>:CROSSBIND_APP_DEV>")

target_include_directories(app PRIVATE
    src
    "${CROSSBIND_HERMES}/include"
    "${CROSSBIND_JSI_ROOT}/cpp/src"
    "${THIRD_PARTY}/webview/core/include")
if(APPLE)
    set_source_files_properties(${PLATFORM_SOURCES} PROPERTIES COMPILE_OPTIONS -fobjc-arc)
endif()
if(CMAKE_SYSTEM_NAME STREQUAL "iOS")
    return()
endif()

target_link_libraries(app PRIVATE ${CROSSBIND_LINK_ARGS})
# A force-loaded archive reaches the link as a linker flag, which CMake does not track: without this, a rebuilt bridge
# archive would leave the previous host in place.
set_property(TARGET app APPEND PROPERTY LINK_DEPENDS ${CROSSBIND_LINK_DEPENDS})

if(APPLE)
    # Hermes is a framework the app bundle carries next to the executable. Only what main() and the bindings' static
    # initializers reach stays, without the local symbols of a release build.
    target_link_options(app PRIVATE "-F${CROSSBIND_HERMES}/Library/Frameworks/macosx" "LINKER:-rpath,@executable_path/../Frameworks"
        "LINKER:-dead_strip" "$<$<CONFIG:Release>:LINKER:-x>")
    target_link_libraries(app PRIVATE "-framework hermesvm" "-framework WebKit" "-framework Cocoa")
elseif(ANDROID)
    # Hermes comes with the app from its own package; the C++ runtime the host shares with it is this NDK's, which goes
    # beside the host, stripped.
    target_link_libraries(app PRIVATE jsi "${CROSSBIND_HERMES}/libs/android.${ANDROID_ABI}/libhermesvm.so" log)
    target_link_options(app PRIVATE "LINKER:--gc-sections" "$<$<CONFIG:Release>:LINKER:-s>")
    target_link_options(jsi PRIVATE "$<$<CONFIG:Release>:LINKER:-s>")
    add_custom_command(TARGET app POST_BUILD
        COMMAND "${CMAKE_STRIP}" -o "$<TARGET_FILE_DIR:app>/libc++_shared.so"
            "${CMAKE_SYSROOT}/usr/lib/${CMAKE_LIBRARY_ARCHITECTURE}/libc++_shared.so")
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

#ifndef _GDAL_I
#define _GDAL_I

%module gdal

%{
#include "gdalcpp.h"

EMSCRIPTEN_BINDINGS(stl_wrappers) {
    emscripten::register_vector<int>("VectorInt");
    emscripten::register_vector<std::string>("VectorString");
    emscripten::register_map<int,int>("MapIntInt");
    emscripten::register_map<std::string, std::string>("MapStringString");
}

%}

%feature("shared_ptr");
%feature("polymorphic_shared_ptr");

%include "gdalcpp.h"

#endif

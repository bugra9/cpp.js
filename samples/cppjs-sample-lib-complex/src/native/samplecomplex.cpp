#include "samplecomplex.h"
#include <cppjs-lib-samplebasicprebuilt/samplebasic.h>

std::string SampleComplex::sample() {
    return "this message comes from complex sample lib, " + SampleBasic::sample() + " and " + SampleBasicCmake::sample() + ".";
}

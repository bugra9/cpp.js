#include "samplecomplex.h"

std::string SampleComplex::sample() {
    return "this message comes from complex sample lib and " + SampleBasic::sample();
}

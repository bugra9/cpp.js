#include "native.h"

std::string Native::sample() {
    return "This message comes from cpp and " + SampleComplex::sample();
}

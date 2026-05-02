#ifndef _SAMPLE_BASIC_CMAKE_H
#define _SAMPLE_BASIC_CMAKE_H

#include <string>
#include <Matrix.h>
#include <thread>
#include <memory>

static std::string threadResult = "waiting...";

class SampleBasicCmake {
public:
    static std::string sample();
    static void runOnThread();
    static std::string getThreadResult();
};

#endif

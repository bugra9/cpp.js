#include "cppjs-lib-samplebasic-cmake-multithread/samplebasiccmake.h"

std::string SampleBasicCmake::sample() {
    auto firstMatrix = std::make_shared<Matrix>(9, 1);
    auto secondMatrix = std::make_shared<Matrix>(9, 2);
    auto resultStr = std::to_string(firstMatrix->multiple(secondMatrix)->get(0));
    return "J₃ * (2*J₃) = " + resultStr + "*J₃";
}

void SampleBasicCmake::runOnThread() {
    std::thread t([]() {
        // Simulate some work on a separate thread
        auto firstMatrix = std::make_shared<Matrix>(9, 3);
        auto secondMatrix = std::make_shared<Matrix>(9, 4);
        auto result = firstMatrix->multiple(secondMatrix)->get(0);
        threadResult = "Thread computed: (3*J₃) * (4*J₃) = " + std::to_string(result) + "*J₃";
    });
    t.join();
}

std::string SampleBasicCmake::getThreadResult() {
    return threadResult;
}

// A Windows build of Hermes runs JavaScript: bytecode the host's hermesc compiled, source the VM compiles itself, and
// an error that crosses JSI as a C++ exception. Prints one line for each and exits 0 when all three behave.
#include <hermes/hermes.h>
#include <jsi/jsi.h>

#include <cstdio>
#include <fstream>
#include <iterator>
#include <memory>
#include <string>

using namespace facebook;

namespace {

std::string run(jsi::Runtime &runtime, std::string code, const char *name) {
    jsi::Value value = runtime.evaluateJavaScript(std::make_shared<jsi::StringBuffer>(std::move(code)), name);
    return value.asString(runtime).utf8(runtime);
}

}  // namespace

int main(int argc, char **argv) {
    if (argc < 2) {
        std::fprintf(stderr, "usage: hermes-smoke <smoke.hbc>\n");
        return 2;
    }
    auto runtime = facebook::hermes::makeHermesRuntime();
    std::ifstream file(argv[1], std::ios::binary);
    std::string bytecode((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    const std::string fromBytecode = run(*runtime, bytecode, "smoke.hbc");
    std::printf("bytecode: %s\n", fromBytecode.c_str());
    const std::string fromSource = run(*runtime, "new Date(Date.UTC(2026, 9, 20)).toISOString() + ' ' + Math.PI.toFixed(5)", "inline.js");
    std::printf("source: %s\n", fromSource.c_str());
    std::string caught;
    try {
        run(*runtime, "(function fail() { throw new Error('boom'); })()", "throw.js");
    } catch (const jsi::JSError &error) {
        caught = error.getMessage();
    }
    std::printf("caught: %s\n", caught.c_str());
    std::fflush(stdout);
    const bool ok = fromBytecode == "2,4,6 12 {\"e\":\"2.7183\"}" && fromSource == "2026-10-20T00:00:00.000Z 3.14159" && caught == "boom";
    return ok ? 0 : 1;
}

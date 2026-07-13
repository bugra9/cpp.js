#include <cstdio>
#include <cstring>
#include <stdexcept>
#include <string>

// The three things a WASI command must prove: argv arrives, the preopened
// directory is a real read-write filesystem, and C++ exceptions unwind
// (wasm-EH new format; run under `wasmtime -W exceptions=y`).
int main(int argc, char **argv) {
    printf("hello from wasi command (argc=%d%s%s)\n", argc,
           argc > 1 ? ", argv[1]=" : "", argc > 1 ? argv[1] : "");

    FILE *w = fopen("roundtrip.txt", "w");
    if (!w) {
        printf("FAIL: fs write\n");
        return 1;
    }
    fputs("wasi-roundtrip", w);
    fclose(w);

    char buf[64] = {0};
    FILE *r = fopen("roundtrip.txt", "r");
    if (!r) {
        printf("FAIL: fs read\n");
        return 1;
    }
    fgets(buf, sizeof buf, r);
    fclose(r);
    printf("fs roundtrip: %s\n", strcmp(buf, "wasi-roundtrip") == 0 ? "PASS" : "FAIL");

    try {
        throw std::runtime_error(std::string("expected-") + "throw");
    } catch (const std::exception &e) {
        printf("exceptions: PASS (%s)\n", e.what());
    }

    return 0;
}

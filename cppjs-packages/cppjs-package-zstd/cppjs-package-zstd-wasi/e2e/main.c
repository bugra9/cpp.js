#include <stdio.h>
#include <string.h>
#include <zstd.h>

int main(void)
{
    const char *msg = "cpp.js wasi zstd roundtrip cpp.js wasi zstd roundtrip cpp.js wasi zstd roundtrip";
    char comp[512], back[512];
    size_t clen = ZSTD_compress(comp, sizeof comp, msg, strlen(msg) + 1, 19);
    if (ZSTD_isError(clen)) return 1;
    size_t blen = ZSTD_decompress(back, sizeof back, comp, clen);
    if (ZSTD_isError(blen) || strcmp(back, msg) != 0) return 2;
    printf("zstd %s: PASS (%zu -> %zu B)\n", ZSTD_versionString(), strlen(msg) + 1, clen);
    return 0;
}

/* wasi runtime stubs: no dynamic loading / fork on WASI */
void *dlopen(const char *f, int m) { (void)f; (void)m; return 0; }
char *dlerror(void) { return (char *)"no dynamic loading on WASI"; }
void *dlsym(void *h, const char *s) { (void)h; (void)s; return 0; }
int dlclose(void *h) { (void)h; return -1; }
int pthread_atfork(void (*a)(void), void (*b)(void), void (*c)(void)) { (void)a; (void)b; (void)c; return 0; }

#include <stdio.h>
#include <string.h>
#include <Lerc_c_api.h>

int main(void)
{
    float data[64], back[64];
    for (int i = 0; i < 64; i++) data[i] = (float)i * 0.5f;
    unsigned char blob[4096];
    unsigned int written = 0;
    if (lerc_encode(data, 6 /* float */, 1, 8, 8, 1, 0, NULL, 0.0, blob, sizeof blob, &written) != 0) return 1;
    if (lerc_decode(blob, written, 0, NULL, 1, 8, 8, 1, 6, back) != 0) return 2;
    if (memcmp(data, back, sizeof data) != 0) return 3;
    printf("Lerc: PASS (8x8 float lossless roundtrip, %u B blob)\n", written);
    return 0;
}

/* wasi runtime stubs: no dynamic loading / fork on WASI */
void *dlopen(const char *f, int m) { (void)f; (void)m; return 0; }
char *dlerror(void) { return (char *)"no dynamic loading on WASI"; }
void *dlsym(void *h, const char *s) { (void)h; (void)s; return 0; }
int dlclose(void *h) { (void)h; return -1; }
int pthread_atfork(void (*a)(void), void (*b)(void), void (*c)(void)) { (void)a; (void)b; (void)c; return 0; }

#include <stdio.h>
#include <webp/encode.h>
#include <webp/decode.h>

int main(void)
{
    unsigned char rgb[16 * 16 * 3];
    for (int i = 0; i < 16 * 16 * 3; i += 3) { rgb[i] = 10; rgb[i + 1] = 160; rgb[i + 2] = 60; }
    unsigned char *out = NULL;
    size_t n = WebPEncodeRGB(rgb, 16, 16, 16 * 3, 80.0f, &out);
    if (n == 0) return 1;
    int w = 0, h = 0;
    if (!WebPGetInfo(out, n, &w, &h) || w != 16 || h != 16) return 2;
    WebPFree(out);
    printf("libwebp: PASS (16x16 rgb -> %zu B webp, dims back)\n", n);
    return 0;
}

/* wasi runtime stubs: no dynamic loading / fork on wasm32-wasip1 */
void *dlopen(const char *f, int m) { (void)f; (void)m; return 0; }
char *dlerror(void) { return (char *)"no dynamic loading on WASI"; }
void *dlsym(void *h, const char *s) { (void)h; (void)s; return 0; }
int dlclose(void *h) { (void)h; return -1; }
int pthread_atfork(void (*a)(void), void (*b)(void), void (*c)(void)) { (void)a; (void)b; (void)c; return 0; }

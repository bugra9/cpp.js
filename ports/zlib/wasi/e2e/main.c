#include <stdio.h>
#include <string.h>
#include <zlib.h>

int main(void)
{
    const char *msg = "crossbind wasi zlib roundtrip payload 0123456789 crossbind wasi zlib roundtrip payload";
    unsigned char comp[512], back[512];
    uLongf clen = sizeof comp, blen = sizeof back;
    if (compress2(comp, &clen, (const Bytef *)msg, strlen(msg) + 1, 9) != Z_OK) return 1;
    if (uncompress(back, &blen, comp, clen) != Z_OK) return 2;
    if (strcmp((const char *)back, msg) != 0) return 3;
    printf("zlib %s: PASS (%lu -> %lu B)\n", zlibVersion(), (unsigned long)(strlen(msg) + 1), (unsigned long)clen);
    return 0;
}

/* wasi runtime stubs: no dynamic loading / fork on WASI */
void *dlopen(const char *f, int m) { (void)f; (void)m; return 0; }
char *dlerror(void) { return (char *)"no dynamic loading on WASI"; }
void *dlsym(void *h, const char *s) { (void)h; (void)s; return 0; }
int dlclose(void *h) { (void)h; return -1; }
int pthread_atfork(void (*a)(void), void (*b)(void), void (*c)(void)) { (void)a; (void)b; (void)c; return 0; }

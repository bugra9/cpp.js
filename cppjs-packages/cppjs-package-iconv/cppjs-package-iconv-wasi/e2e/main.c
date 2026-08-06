#include <stdio.h>
#include <string.h>
#include <iconv.h>

int main(void)
{
    iconv_t cd = iconv_open("UTF-16LE", "UTF-8");
    if (cd == (iconv_t)-1) return 1;
    char in[] = "merhaba";
    char out[64];
    char *ip = in, *op = out;
    size_t il = strlen(in), ol = sizeof out;
    if (iconv(cd, &ip, &il, &op, &ol) == (size_t)-1) return 2;
    size_t written = sizeof out - ol;
    iconv_close(cd);
    if (written != 14) return 3;
    printf("iconv: PASS (utf-8 'merhaba' -> %zu B utf-16le)\n", written);
    return 0;
}

/* wasi runtime stubs: no dynamic loading / fork on WASI */
void *dlopen(const char *f, int m) { (void)f; (void)m; return 0; }
char *dlerror(void) { return (char *)"no dynamic loading on WASI"; }
void *dlsym(void *h, const char *s) { (void)h; (void)s; return 0; }
int dlclose(void *h) { (void)h; return -1; }
int pthread_atfork(void (*a)(void), void (*b)(void), void (*c)(void)) { (void)a; (void)b; (void)c; return 0; }

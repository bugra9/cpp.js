#include <stdio.h>
#include <proj.h>

int main(void)
{
    PJ_CONTEXT *ctx = proj_context_create();
    PJ *p = proj_create_crs_to_crs(ctx, "EPSG:4326", "EPSG:3857", NULL);
    if (!p) {
        fprintf(stderr, "crs_to_crs failed: %s\n", proj_context_errno_string(ctx, proj_context_errno(ctx)));
        return 1;
    }
    PJ_COORD in = proj_coord(39.93, 32.85, 0, 0); /* Ankara: lat, lon */
    PJ_COORD out = proj_trans(p, PJ_FWD, in);
    double x = out.xy.x, y = out.xy.y;
    if (!(x > 3.6e6 && x < 3.7e6 && y > 4.8e6 && y < 4.9e6)) {
        fprintf(stderr, "unexpected result: %f %f\n", x, y);
        return 2;
    }
    printf("proj %d.%d: PASS (EPSG:4326->3857 via proj.db, x=%.0f y=%.0f)\n",
           PROJ_VERSION_MAJOR, PROJ_VERSION_MINOR, x, y);
    proj_destroy(p);
    proj_context_destroy(ctx);
    return 0;
}

/* wasi runtime stubs: no dynamic loading / fork on wasm32-wasip1 */
void *dlopen(const char *f, int m) { (void)f; (void)m; return 0; }
char *dlerror(void) { return (char *)"no dynamic loading on WASI"; }
void *dlsym(void *h, const char *s) { (void)h; (void)s; return 0; }
int dlclose(void *h) { (void)h; return -1; }
int pthread_atfork(void (*a)(void), void (*b)(void), void (*c)(void)) { (void)a; (void)b; (void)c; return 0; }

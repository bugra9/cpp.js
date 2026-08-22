#include <stdio.h>
#include <string.h>
#include <sqlite3.h>
#include <spatialite.h>

int main(void)
{
    sqlite3 *db;
    if (sqlite3_open(":memory:", &db) != SQLITE_OK) return 1;
    void *cache = spatialite_alloc_connection();
    spatialite_init_ex(db, cache, 0);
    sqlite3_stmt *st;
    if (sqlite3_prepare_v2(db, "SELECT ST_AsText(MakePoint(1, 2))", -1, &st, NULL) != SQLITE_OK) return 2;
    if (sqlite3_step(st) != SQLITE_ROW) return 3;
    const char *txt = (const char *)sqlite3_column_text(st, 0);
    if (!txt || strcmp(txt, "POINT(1 2)") != 0) {
        fprintf(stderr, "got: %s\n", txt ? txt : "(null)");
        return 4;
    }
    printf("spatialite %s: PASS (%s)\n", spatialite_version(), txt);
    sqlite3_finalize(st);
    sqlite3_close(db);
    spatialite_cleanup_ex(cache);
    spatialite_shutdown();
    return 0;
}

/* wasi runtime stubs: no dynamic loading / fork on WASI */
void *dlopen(const char *f, int m) { (void)f; (void)m; return 0; }
char *dlerror(void) { return (char *)"no dynamic loading on WASI"; }
void *dlsym(void *h, const char *s) { (void)h; (void)s; return 0; }
int dlclose(void *h) { (void)h; return -1; }
int pthread_atfork(void (*a)(void), void (*b)(void), void (*c)(void)) { (void)a; (void)b; (void)c; return 0; }

/* The wasi sqlite3 is built with SQLITE_OMIT_LOAD_EXTENSION (no dlopen);
 * spatialite references the toggle unconditionally - satisfy it, loading
 * itself can never happen at runtime. */
int sqlite3_enable_load_extension(sqlite3 *db, int onoff) { (void)db; (void)onoff; return 0; }

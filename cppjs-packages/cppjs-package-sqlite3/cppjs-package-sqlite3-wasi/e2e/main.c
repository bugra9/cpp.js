#include <stdio.h>
#include <stdlib.h>
#include <sqlite3.h>

static int got = 0;
static int cb(void *u, int n, char **v, char **c)
{
    (void)u; (void)c;
    if (n == 1 && v[0]) got = atoi(v[0]);
    return 0;
}

int main(void)
{
    sqlite3 *db;
    char *err = 0;
    if (sqlite3_open("/work/e2e.db", &db) != SQLITE_OK) return 1;
    if (sqlite3_exec(db, "CREATE TABLE t(a INTEGER); INSERT INTO t VALUES(19),(23);", 0, 0, &err) != SQLITE_OK) {
        fprintf(stderr, "%s\n", err ? err : "?");
        return 2;
    }
    if (sqlite3_exec(db, "SELECT SUM(a) FROM t;", cb, 0, &err) != SQLITE_OK) return 3;
    if (got != 42) return 4;
    printf("sqlite3 %s: PASS (file db on wasi fs, sum=42)\n", sqlite3_libversion());
    sqlite3_close(db);
    return 0;
}

/* wasi runtime stubs: no dynamic loading / fork on wasm32-wasip1 */
void *dlopen(const char *f, int m) { (void)f; (void)m; return 0; }
char *dlerror(void) { return (char *)"no dynamic loading on WASI"; }
void *dlsym(void *h, const char *s) { (void)h; (void)s; return 0; }
int dlclose(void *h) { (void)h; return -1; }
int pthread_atfork(void (*a)(void), void (*b)(void), void (*c)(void)) { (void)a; (void)b; (void)c; return 0; }

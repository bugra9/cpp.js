/* Symbols the wasm32-wasip1 libc does not provide but common native stacks
 * reference. Every stub fails cleanly (or no-ops where that is semantically
 * safe) instead of leaving undefined imports in the command module.
 *
 * - dlopen family: no dynamic loading on WASI; loaders treat NULL as
 *   "plugin unavailable" and carry on.
 * - pthread_atfork: fork does not exist, so registering handlers is a no-op
 *   (PROJ registers one to reset sqlite handles after fork). */

#include <stddef.h>

void *dlopen(const char *file, int mode)
{
    (void)file;
    (void)mode;
    return NULL;
}

char *dlerror(void)
{
    return (char *)"dynamic loading is not supported on WASI";
}

void *dlsym(void *handle, const char *symbol)
{
    (void)handle;
    (void)symbol;
    return NULL;
}

int dlclose(void *handle)
{
    (void)handle;
    return -1;
}

int pthread_atfork(void (*prepare)(void), void (*parent)(void), void (*child)(void))
{
    (void)prepare;
    (void)parent;
    (void)child;
    return 0;
}

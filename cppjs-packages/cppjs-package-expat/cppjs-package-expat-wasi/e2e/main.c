#include <stdio.h>
#include <string.h>
#include <expat.h>

static int starts = 0;
static void XMLCALL onStart(void *ud, const XML_Char *name, const XML_Char **atts)
{
    (void)ud; (void)name; (void)atts;
    starts++;
}

int main(void)
{
    const char *xml = "<a><b/><b/></a>";
    XML_Parser p = XML_ParserCreate(NULL);
    XML_SetStartElementHandler(p, onStart);
    if (XML_Parse(p, xml, (int)strlen(xml), 1) != XML_STATUS_OK) return 1;
    XML_ParserFree(p);
    if (starts != 3) return 2;
    printf("expat %s: PASS (3 start elements parsed)\n", XML_ExpatVersion());
    return 0;
}

/* wasi runtime stubs: no dynamic loading / fork on wasm32-wasip1 */
void *dlopen(const char *f, int m) { (void)f; (void)m; return 0; }
char *dlerror(void) { return (char *)"no dynamic loading on WASI"; }
void *dlsym(void *h, const char *s) { (void)h; (void)s; return 0; }
int dlclose(void *h) { (void)h; return -1; }
int pthread_atfork(void (*a)(void), void (*b)(void), void (*c)(void)) { (void)a; (void)b; (void)c; return 0; }

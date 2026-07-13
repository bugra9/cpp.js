#include <stdio.h>
#include <stdint.h>
#include <tiffio.h>

int main(void)
{
    TIFF *tif = TIFFOpen("/work/e2e.tif", "w");
    if (!tif) return 1;
    TIFFSetField(tif, TIFFTAG_IMAGEWIDTH, 8);
    TIFFSetField(tif, TIFFTAG_IMAGELENGTH, 8);
    TIFFSetField(tif, TIFFTAG_BITSPERSAMPLE, 8);
    TIFFSetField(tif, TIFFTAG_SAMPLESPERPIXEL, 1);
    TIFFSetField(tif, TIFFTAG_PHOTOMETRIC, PHOTOMETRIC_MINISBLACK);
    TIFFSetField(tif, TIFFTAG_COMPRESSION, COMPRESSION_ADOBE_DEFLATE);
    TIFFSetField(tif, TIFFTAG_ROWSPERSTRIP, 8);
    unsigned char row[8];
    for (int y = 0; y < 8; y++) {
        for (int x = 0; x < 8; x++) row[x] = (unsigned char)(y * 8 + x);
        if (TIFFWriteScanline(tif, row, y, 0) < 0) return 2;
    }
    TIFFClose(tif);

    tif = TIFFOpen("/work/e2e.tif", "r");
    if (!tif) return 3;
    uint32_t w = 0, h = 0;
    TIFFGetField(tif, TIFFTAG_IMAGEWIDTH, &w);
    TIFFGetField(tif, TIFFTAG_IMAGELENGTH, &h);
    unsigned char back[8];
    /* deflate strips forbid random access - read rows sequentially */
    for (int y = 0; y <= 3; y++) {
        if (TIFFReadScanline(tif, back, y, 0) < 0) return 4;
    }
    TIFFClose(tif);
    if (w != 8 || h != 8 || back[5] != 3 * 8 + 5) return 5;
    printf("libtiff: PASS (8x8 deflate tif roundtrip)\n");
    return 0;
}

/* wasi runtime stubs: no dynamic loading / fork on wasm32-wasip1 */
void *dlopen(const char *f, int m) { (void)f; (void)m; return 0; }
char *dlerror(void) { return (char *)"no dynamic loading on WASI"; }
void *dlsym(void *h, const char *s) { (void)h; (void)s; return 0; }
int dlclose(void *h) { (void)h; return -1; }
int pthread_atfork(void (*a)(void), void (*b)(void), void (*c)(void)) { (void)a; (void)b; (void)c; return 0; }

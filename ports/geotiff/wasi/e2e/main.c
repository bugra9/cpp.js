#include <stdio.h>
#include <xtiffio.h>
#include <geotiff.h>
#include <geokeys.h>
#include <geovalues.h>

int main(void)
{
    TIFF *tif = XTIFFOpen("/work/e2e_geo.tif", "w");
    if (!tif) return 1;
    TIFFSetField(tif, TIFFTAG_IMAGEWIDTH, 4);
    TIFFSetField(tif, TIFFTAG_IMAGELENGTH, 4);
    TIFFSetField(tif, TIFFTAG_BITSPERSAMPLE, 8);
    TIFFSetField(tif, TIFFTAG_SAMPLESPERPIXEL, 1);
    TIFFSetField(tif, TIFFTAG_PHOTOMETRIC, PHOTOMETRIC_MINISBLACK);
    TIFFSetField(tif, TIFFTAG_ROWSPERSTRIP, 4);
    GTIF *gtif = GTIFNew(tif);
    if (!gtif) return 2;
    GTIFKeySet(gtif, GTModelTypeGeoKey, TYPE_SHORT, 1, ModelTypeGeographic);
    GTIFKeySet(gtif, GeographicTypeGeoKey, TYPE_SHORT, 1, GCS_WGS_84);
    GTIFWriteKeys(gtif);
    GTIFFree(gtif);
    unsigned char row[4] = { 0, 1, 2, 3 };
    for (int y = 0; y < 4; y++) TIFFWriteScanline(tif, row, y, 0);
    XTIFFClose(tif);

    tif = XTIFFOpen("/work/e2e_geo.tif", "r");
    if (!tif) return 3;
    gtif = GTIFNew(tif);
    if (!gtif) return 4;
    unsigned short model = 0;
    GTIFKeyGet(gtif, GTModelTypeGeoKey, &model, 0, 1);
    GTIFFree(gtif);
    XTIFFClose(tif);
    if (model != ModelTypeGeographic) return 5;
    printf("libgeotiff: PASS (GTModelType=Geographic geokey roundtrip)\n");
    return 0;
}

/* wasi runtime stubs: no dynamic loading / fork on WASI */
void *dlopen(const char *f, int m) { (void)f; (void)m; return 0; }
char *dlerror(void) { return (char *)"no dynamic loading on WASI"; }
void *dlsym(void *h, const char *s) { (void)h; (void)s; return 0; }
int dlclose(void *h) { (void)h; return -1; }
int pthread_atfork(void (*a)(void), void (*b)(void), void (*c)(void)) { (void)a; (void)b; (void)c; return 0; }

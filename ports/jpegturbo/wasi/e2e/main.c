#include <stdio.h>
#include <stdlib.h>
#include <jpeglib.h>

int main(void)
{
    struct jpeg_compress_struct cinfo;
    struct jpeg_error_mgr jerr;
    unsigned char *buf = NULL;
    unsigned long size = 0;
    cinfo.err = jpeg_std_error(&jerr);
    jpeg_create_compress(&cinfo);
    jpeg_mem_dest(&cinfo, &buf, &size);
    cinfo.image_width = 32;
    cinfo.image_height = 32;
    cinfo.input_components = 3;
    cinfo.in_color_space = JCS_RGB;
    jpeg_set_defaults(&cinfo);
    jpeg_set_quality(&cinfo, 90, TRUE);
    jpeg_start_compress(&cinfo, TRUE);
    unsigned char row[32 * 3];
    for (int i = 0; i < 32 * 3; i += 3) { row[i] = 200; row[i + 1] = 30; row[i + 2] = 30; }
    while (cinfo.next_scanline < cinfo.image_height) {
        JSAMPROW r = row;
        jpeg_write_scanlines(&cinfo, &r, 1);
    }
    jpeg_finish_compress(&cinfo);
    jpeg_destroy_compress(&cinfo);
    if (size < 200) return 1;

    struct jpeg_decompress_struct d;
    struct jpeg_error_mgr jerr2;
    d.err = jpeg_std_error(&jerr2);
    jpeg_create_decompress(&d);
    jpeg_mem_src(&d, buf, size);
    jpeg_read_header(&d, TRUE);
    if (d.image_width != 32 || d.image_height != 32) return 2;
    jpeg_destroy_decompress(&d);
    printf("libjpeg-turbo: PASS (32x32 rgb -> %lu B jpeg, header roundtrip)\n", size);
    return 0;
}

/* wasi runtime stubs: no dynamic loading / fork on WASI */
void *dlopen(const char *f, int m) { (void)f; (void)m; return 0; }
char *dlerror(void) { return (char *)"no dynamic loading on WASI"; }
void *dlsym(void *h, const char *s) { (void)h; (void)s; return 0; }
int dlclose(void *h) { (void)h; return -1; }
int pthread_atfork(void (*a)(void), void (*b)(void), void (*c)(void)) { (void)a; (void)b; (void)c; return 0; }

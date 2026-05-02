#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/wasmfs.h>

void cppjs_init_opfs() {
  backend_t opfs_backend = wasmfs_create_opfs_backend();
  wasmfs_create_directory("/opfs", 0777, opfs_backend);
}

EMSCRIPTEN_BINDINGS(Browser) {
  emscripten::function("cppjs_init_opfs", &cppjs_init_opfs);
};

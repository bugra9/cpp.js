#include <emscripten.h>
#include <emscripten/wasmfs.h>
#include <limits.h>
#include <unistd.h>

backend_t wasmfs_create_root_dir(void) {
  return wasmfs_create_node_backend("/");
}

void wasmfs_before_preload(void) {
  backend_t mem = wasmfs_create_memory_backend();
  wasmfs_create_directory("/memfs", 0777, mem);
}

__attribute__((constructor)) static void setup_cwd(void) {
  char cwd[PATH_MAX];
  EM_ASM({ stringToUTF8(process.cwd(), $0, $1); }, cwd, (int)sizeof(cwd));
  chdir(cwd);
}

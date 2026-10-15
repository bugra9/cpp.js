#include <emscripten.h>
#include <emscripten/wasmfs.h>
#include <limits.h>
#include <unistd.h>
#include <wasi/api.h>

static backend_t hostBackend;

backend_t wasmfs_create_root_dir(void) {
  hostBackend = wasmfs_create_node_backend("/");
  return hostBackend;
}

// Emscripten's Node backend traps on flush, which fsync and fdatasync call. A host file's writes have already
// reached the operating system, so both succeed there, as with NODERAWFS. buildWasm links these with --wrap.
extern "C" __wasi_errno_t __real___wasi_fd_sync(__wasi_fd_t fd);
extern "C" int __real___syscall_fdatasync(int fd);

extern "C" __wasi_errno_t __wrap___wasi_fd_sync(__wasi_fd_t fd) {
  return wasmfs_get_backend_by_fd(fd) == hostBackend ? __WASI_ERRNO_SUCCESS : __real___wasi_fd_sync(fd);
}

extern "C" int __wrap___syscall_fdatasync(int fd) {
  return wasmfs_get_backend_by_fd(fd) == hostBackend ? 0 : __real___syscall_fdatasync(fd);
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

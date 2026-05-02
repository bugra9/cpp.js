#include "native.h"
// #include <Matrix.h>
#include <curl/curl.h>
#include <thread>

#include <atomic>
#include <emscripten.h>
#include <emscripten/wasmfs.h>

#ifdef __EMSCRIPTEN2__
#include <emscripten.h>
#include <emscripten/posix_socket.h>
#include <emscripten/threading.h>
#include <emscripten/websocket.h>

static EMSCRIPTEN_WEBSOCKET_T bridgeSocket = 0;
#endif

#include <arpa/inet.h>
#include <assert.h>
#include <netdb.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

std::vector<std::string> Native::listVirtualFiles() {
  std::vector<std::string> files;

  DIR *dir = opendir("/opfs");
  if (!dir) {
    return files; // boş döner
  }

  struct dirent *entry;
  while ((entry = readdir(dir)) != nullptr) {
    std::string name = entry->d_name;

    // . ve .. klasörlerini filtrele
    if (name != "." && name != "..") {
      files.push_back(name);
    }
  }

  closedir(dir);
  return files;
}

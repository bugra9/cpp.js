#include "native.h"

#include <thread>

#include <emscripten.h>
#include <emscripten/wasmfs.h>

#include <arpa/inet.h>
#include <assert.h>
#include <errno.h>
#include <fcntl.h>
#include <netdb.h>
#include <sqlite3.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

static std::string threadResult = "";

std::vector<std::string> Native::listVirtualFiles() {
  std::vector<std::string> files;

  DIR *dir = opendir("/opfs");
  if (!dir) {
    return files;
  }

  struct dirent *entry;
  while ((entry = readdir(dir)) != nullptr) {
    std::string name = entry->d_name;

    if (name != "." && name != "..") {
      files.push_back(name);
    }
  }

  closedir(dir);
  return files;
}

void Native::runOnThread() {
  std::thread t([]() { threadResult = "hello from thread"; });
  t.join();
}

std::string Native::getThreadResult() { return threadResult; }

std::string Native::syncFiles(std::string dir) {
  int fd = open((dir + "/fsync.txt").c_str(), O_WRONLY | O_CREAT | O_TRUNC, 0644);
  if (fd < 0 || write(fd, "synced", 6) != 6) return "write errno=" + std::to_string(errno);
  int fsyncError = fsync(fd) == 0 ? 0 : errno;
  int fdatasyncError = fdatasync(fd) == 0 ? 0 : errno;
  close(fd);

  std::string kept = "none";
  sqlite3 *db = nullptr;
  sqlite3_stmt *statement = nullptr;
  if (sqlite3_open((dir + "/fsync.sqlite").c_str(), &db) == SQLITE_OK &&
      sqlite3_exec(db, "CREATE TABLE t(v TEXT); INSERT INTO t VALUES('kept');", nullptr, nullptr, nullptr) == SQLITE_OK &&
      sqlite3_prepare_v2(db, "SELECT v FROM t", -1, &statement, nullptr) == SQLITE_OK &&
      sqlite3_step(statement) == SQLITE_ROW) {
    kept = reinterpret_cast<const char *>(sqlite3_column_text(statement, 0));
  }
  sqlite3_finalize(statement);
  sqlite3_close(db);
  return "fsync=" + std::to_string(fsyncError) + " fdatasync=" + std::to_string(fdatasyncError) + " sqlite=" + kept;
}

Counter::Counter(int start) : value(start) {}

std::shared_ptr<Counter> Counter::create(int start) {
  return std::make_shared<Counter>(start);
}

int Counter::increment(int by) {
  value += by;
  return value;
}

int Counter::current() { return value; }

std::string Counter::describe(std::string prefix) {
  return prefix + ":" + std::to_string(value);
}

std::string Counter::joinTags(std::vector<std::string> tags) {
  std::string out;
  for (size_t i = 0; i < tags.size(); i++) {
    if (i) out += "+";
    out += tags[i];
  }
  return out;
}

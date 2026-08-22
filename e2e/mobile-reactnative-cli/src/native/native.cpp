#include "native.h"
#include <sqlite3.h>

std::string Native::sample() { return "hello"; }

std::string Native::getSqliteVersion() {
  return std::string(sqlite3_libversion());
}

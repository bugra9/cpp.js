#ifndef _NATIVE_H
#define _NATIVE_H

#include <dirent.h>
#include <memory>
#include <string>
#include <vector>

class Native {
public:
  static std::string sample();
  static void ops_JSPI();
  static void runOnThread();
  static std::string getThreadResult();

  static std::vector<std::string> listVirtualFiles();
};

#endif

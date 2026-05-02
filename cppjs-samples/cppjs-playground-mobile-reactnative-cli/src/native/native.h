#ifndef _NATIVE_H
#define _NATIVE_H

#include <memory>
#include <string>

class Native {
public:
  static std::string sample();
  static std::string getSqliteVersion();
};

#endif

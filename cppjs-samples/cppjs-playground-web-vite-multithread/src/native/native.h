#ifndef _NATIVE_H
#define _NATIVE_H

#include <dirent.h>
#include <memory>
#include <string>
#include <vector>

// Forked from cppjs-playground-config/native (like web-vite) WITHOUT the
// ops_JSPI demo: this playground's mt (pthreads) browser build cannot carry
// -sJSPI (suspending from the pthread mailbox path throws SuspendError), and
// without -sJSPI an async binding aborts DEBUG builds at embind registration
// ("Async bindings are only supported with JSPI"), killing `vite dev`.
class Native {
public:
  static std::string sample();
  static void runOnThread();
  static std::string getThreadResult();

  static std::vector<std::string> listVirtualFiles();
};

// Instance-method coverage: statics never go through embind's `this`
// conversion, so only a class like this exercises the worker proxy's
// identity handling (and vector-parameter coercion) end to end.
class Counter {
public:
  Counter(int start);
  static std::shared_ptr<Counter> create(int start);

  int increment(int by);
  int current();
  std::string describe(std::string prefix);
  std::string joinTags(std::vector<std::string> tags);

private:
  int value;
};

#endif

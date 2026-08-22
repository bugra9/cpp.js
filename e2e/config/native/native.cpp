#include "native.h"

#include <curl/curl.h>
#include <thread>

#include <emscripten.h>
#include <emscripten/wasmfs.h>

#include <arpa/inet.h>
#include <assert.h>
#include <netdb.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

static std::string ooo = "...";
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

std::string Native::sample() { return ooo; }

void Native::runOnThread() {
  std::thread t([]() { threadResult = "hello from thread"; });
  t.join();
}

std::string Native::getThreadResult() { return threadResult; }

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

size_t WriteCallback(void *contents, size_t size, size_t nmemb,
                     std::string *output) {
  size_t totalSize = size * nmemb;
  output->append((char *)contents, totalSize);
  return totalSize;
}

void Native::ops_JSPI() {
  CURL *curl;
  CURLcode res;
  std::string response;
  char errbuf[CURL_ERROR_SIZE * 100];

  curl = curl_easy_init();
  if (curl) {
    curl_easy_setopt(curl, CURLOPT_URL, "https://test22.free.beeceptor.com");
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "{\"a\": 2}");
    struct curl_slist *headers = NULL;
    headers = curl_slist_append(headers, "Content-Type: application/json");
    headers = curl_slist_append(headers, "Accept: application/json");

    curl_easy_setopt(curl, CURLOPT_ERRORBUFFER, errbuf);
    errbuf[0] = 0;

    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

    res = curl_easy_perform(curl);
    if (res == CURLE_OK) {
      ooo = "response: " + response;
    } else {
      ooo = "error: ";
    }

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
  }
}

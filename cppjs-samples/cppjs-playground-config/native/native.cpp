#include "native.h"
// #include <Matrix.h>
#include <curl/curl.h>
#include <thread>

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

static std::string ooo = "...";
static std::string threadResult = "";

size_t WriteCallback(void *contents, size_t size, size_t nmemb,
                     std::string *output) {
  size_t totalSize = size * nmemb;
  output->append((char *)contents, totalSize);
  return totalSize;
}

int lookup_host(const char *host) {
  struct addrinfo hints, *res;
  int errcode;
  char addrstr[100];
  void *ptr;

  memset(&hints, 0, sizeof(hints));
  hints.ai_family = PF_UNSPEC;
  hints.ai_socktype = SOCK_STREAM;
  hints.ai_flags |= AI_CANONNAME;

  errcode = getaddrinfo(host, NULL, &hints, &res);
  if (errcode != 0) {
    return -1;
  }

  ooo = "Host: " + std::string(host);
  while (res) {
    inet_ntop(res->ai_family, res->ai_addr->sa_data, addrstr, 100);

    switch (res->ai_family) {
    case AF_INET:
      ptr = &((struct sockaddr_in *)res->ai_addr)->sin_addr;
      break;
    case AF_INET6:
      ptr = &((struct sockaddr_in6 *)res->ai_addr)->sin6_addr;
      break;
    }
    inet_ntop(res->ai_family, ptr, addrstr, 100);
    ooo += ", IPv" + std::to_string(res->ai_family == PF_INET6 ? 6 : 4) +
           " address: " + addrstr + " (" + res->ai_canonname + ")";
    res = res->ai_next;
  }

  return 0;
}

void Native::ops_JSPI() {
  auto f = []() {
#ifdef __EMSCRIPTEN2__
    bridgeSocket =
        emscripten_init_websocket_to_posix_socket_bridge("ws://127.0.0.1:300");
    // Synchronously wait until connection has been established.
    uint16_t readyState = 0;
    do {
      emscripten_websocket_get_ready_state(bridgeSocket, &readyState);
      emscripten_thread_sleep(100);
    } while (readyState == 0);
#endif

    CURL *curl;
    CURLcode res;
    std::string response;
    char errbuf[CURL_ERROR_SIZE * 100];

    curl = curl_easy_init(); // Initialize libcurl
    if (curl) {
      // curl_easy_setopt(curl, CURLOPT_URL,
      // "https://www.cloudflarestatus.com/api/v2/status.json"); // Set the URL
      curl_easy_setopt(curl, CURLOPT_URL,
                       "https://test22.free.beeceptor.com"); // Set the URL
      curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "{\"a\": 2}");
      struct curl_slist *headers = NULL;
      headers = curl_slist_append(headers, "Content-Type: application/json");
      headers = curl_slist_append(headers, "Accept: application/json");

      /* if (headers) {
          size_t total_size = 0;
          struct curl_slist* temp = headers;
          while (temp) {
              total_size += strlen(temp->data) + 2; // +2 for "\r\n"
              temp = temp->next;
          }

          char* result = (char*)malloc(total_size + 1); // +1 for null
      terminator result[0] = '\0'; temp = headers; while (temp) { strcat(result,
      temp->data); strcat(result, "\r\n"); temp = temp->next;
          }

          ooo = std::string(result);
          return;
      } */

      // curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
      // curl_easy_setopt(curl, CURLOPT_HTTPGET, 1L);
      // curl_easy_setopt(curl, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
      // curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
      // curl_easy_setopt(curl, CURLOPT_VERBOSE, 1L);
      curl_easy_setopt(curl, CURLOPT_ERRORBUFFER, errbuf);
      errbuf[0] = 0;
      // curl_easy_setopt(curl, CURLOPT_USERAGENT, "Mozilla/5.0 (Macintosh;
      // Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)
      // Chrome/133.0.0.0 Safari/537.36");
      curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION,
                       WriteCallback); // Set callback to handle data
      curl_easy_setopt(curl, CURLOPT_WRITEDATA,
                       &response); // Pass the response string

      // Enable SSL/TLS verification
      // curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 1L); // Verify SSL
      // certificate curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 2L); //
      // Verify hostname

      // Perform the request
      res = curl_easy_perform(curl);
      if (res == CURLE_OK) {
        ooo = "response: " + response;
      } else {
        ooo = "error: ";
      }

      // Clean up
      curl_slist_free_all(headers);
      curl_easy_cleanup(curl);
    }

    // lookup_host("google.com");

    // Create socket
    /* int sock = socket(AF_INET, SOCK_STREAM, 0);
    if (sock == -1) {
        ooo = "Could not create socket";
        return;
    }
    ooo += "Socket created: " + std::to_string(sock) + "\n";

    struct sockaddr_in server;
    server.sin_addr.s_addr = inet_addr("127.0.0.1");
    server.sin_family = AF_INET;
    server.sin_port = htons(7777);

    if (connect(sock, (struct sockaddr *)&server, sizeof(server)) < 0) {
        ooo += "connect failed. Error";
        return;
    }

    ooo += "Connected\n";
    for (int i = 0; i < 2; ++i) {
        const char message[] = "hello world";
        if (send(sock, message, strlen(message), 0) < 0) {
            ooo += "Send failed";
            return;
        }

        char server_reply[256];
        if (recv(sock, server_reply, 256, 0) < 0) {
            ooo += "recv failed";
            break;
        }

        ooo += "\nServer reply: " + std::string(server_reply);
        // For the purposes of the test assert that the server
        // echos back what we send it.
        assert(strcmp(server_reply, message) == 0);
    }

    close(sock); */
  };

  CURL *curl;
  CURLcode res;
  std::string response;
  char errbuf[CURL_ERROR_SIZE * 100];

  curl = curl_easy_init(); // Initialize libcurl
  if (curl) {
    // curl_easy_setopt(curl, CURLOPT_URL,
    // "https://www.cloudflarestatus.com/api/v2/status.json"); // Set the URL
    curl_easy_setopt(curl, CURLOPT_URL,
                     "https://test22.free.beeceptor.com"); // Set the URL
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "{\"a\": 2}");
    struct curl_slist *headers = NULL;
    headers = curl_slist_append(headers, "Content-Type: application/json");
    headers = curl_slist_append(headers, "Accept: application/json");

    /* if (headers) {
        size_t total_size = 0;
        struct curl_slist* temp = headers;
        while (temp) {
            total_size += strlen(temp->data) + 2; // +2 for "\r\n"
            temp = temp->next;
        }

        char* result = (char*)malloc(total_size + 1); // +1 for null terminator
        result[0] = '\0';
        temp = headers;
        while (temp) {
            strcat(result, temp->data);
            strcat(result, "\r\n");
            temp = temp->next;
        }

        ooo = std::string(result);
        return;
    } */

    // curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    // curl_easy_setopt(curl, CURLOPT_HTTPGET, 1L);
    // curl_easy_setopt(curl, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
    // curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
    // curl_easy_setopt(curl, CURLOPT_VERBOSE, 1L);
    curl_easy_setopt(curl, CURLOPT_ERRORBUFFER, errbuf);
    errbuf[0] = 0;
    // curl_easy_setopt(curl, CURLOPT_USERAGENT, "Mozilla/5.0 (Macintosh; Intel
    // Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0
    // Safari/537.36");
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION,
                     WriteCallback); // Set callback to handle data
    curl_easy_setopt(curl, CURLOPT_WRITEDATA,
                     &response); // Pass the response string

    // Enable SSL/TLS verification
    // curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 1L); // Verify SSL
    // certificate curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 2L); // Verify
    // hostname

    // Perform the request
    res = curl_easy_perform(curl);
    if (res == CURLE_OK) {
      ooo = "response: " + response;
    } else {
      ooo = "error: ";
    }

    // Clean up
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
  }

  // std::thread thread_object(f);
  // thread_object.detach();
  // thread_object.join();
}

std::string Native::sample() {
  return ooo;
  /* auto firstMatrix = std::make_shared<Matrix>(9, 1);
  auto secondMatrix = std::make_shared<Matrix>(9, 2);
  auto resultStr = std::to_string(firstMatrix->multiple(secondMatrix)->get(0));
  return "J₃ * (2*J₃) = " + resultStr + "*J₃"; */

  /* CURL* curl;
  CURLcode res;
  std::string response;

  curl = curl_easy_init(); // Initialize libcurl
  if (curl) {
      curl_easy_setopt(curl, CURLOPT_URL, "http://www.google.com"); // Set the
  URL curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback); // Set
  callback to handle data curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
  // Pass the response string

      // Enable SSL/TLS verification
      // curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 1L); // Verify SSL
  certificate
      // curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 2L); // Verify hostname

      // Perform the request
      res = curl_easy_perform(curl);
      if (res == CURLE_OK) {
          return std::string(response);
      } else {
          return std::string(curl_easy_strerror(res));
      }

      // Clean up
      curl_easy_cleanup(curl);
  }
  return std::string("Curl is not loaded!"); */
}

void Native::runOnThread() {
  std::thread t([]() { threadResult = "hello from thread"; });
  t.join();
}

std::string Native::getThreadResult() { return threadResult; }

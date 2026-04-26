# @cpp.js/package-curl
**Precompiled CURL library built with cpp.js for seamless integration in JavaScript, WebAssembly and React Native projects.**  

<a href="https://www.npmjs.com/package/@cpp.js/package-curl">
    <img alt="NPM version" src="https://img.shields.io/npm/v/@cpp.js/package-curl?style=for-the-badge" />
</a>
<a href="https://github.com/curl/curl">
    <img src="https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Funpkg.com%2F%40cpp.js%2Fpackage-curl%2Fpackage.json&query=%24.nativeVersion&style=for-the-badge&label=curl" />
</a>
<a href="https://github.com/curl/curl/blob/master/COPYING">
    <img alt="License" src="https://img.shields.io/npm/l/%40cpp.js%2Fpackage-curl?style=for-the-badge" />
</a>

## Integration
Start by installing these package with the following command:

```sh
npm install @cpp.js/package-curl
```

To enable the library, modify the cppjs.config.js file as shown below.
```diff
+import curl from '@cpp.js/package-curl/cppjs.config.js';

export default {
    dependencies: [
+        curl
    ]
    paths: {
        config: import.meta.url,
    }
};
```

## Usage
Below are the steps to use the curl in your C++ or JavaScript code.

### Usage in C++ Code
```diff
+#include <curl/curl.h>

+size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* output) {
+    size_t totalSize = size * nmemb;
+    output->append((char*)contents, totalSize);
+    return totalSize;
+}

std::string Native::sample() {
+    std::string result = "";
+    std::string response;
+    char errbuf[CURL_ERROR_SIZE*100];
+
+    CURL* curl = curl_easy_init(); // Initialize libcurl
+    curl_easy_setopt(curl, CURLOPT_CAINFO, getenv("CURL_CA_BUNDLE"));
+    curl_easy_setopt(curl, CURLOPT_URL, "https://test22.free.beeceptor.com"); // Set the URL
+    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "{\"a\": 2}");
+    struct curl_slist *headers = NULL;
+    headers = curl_slist_append(headers, "Content-Type: application/json");
+    headers = curl_slist_append(headers, "Accept: application/json");
+
+    curl_easy_setopt(curl, CURLOPT_ERRORBUFFER, errbuf);
+    errbuf[0] = 0;
+    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback); // Set callback to handle data
+    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response); // Pass the response string
+    CURLcode res = curl_easy_perform(curl);
+    if (res == CURLE_OK) {
+        result = "response: " + response;
+    } else {
+        std::string errorStr = errbuf[0] ? std::string(errbuf) : curl_easy_strerror(res);
+        result = "curl error: " + errorStr;
+    }
+
+    curl_slist_free_all(headers);
+    curl_easy_cleanup(curl);
+
+    return result;
}
```

## License
This project includes the precompiled CURL library, which is distributed under the [CURL License](https://github.com/curl/curl/blob/master/COPYING).

CURL Homepage: [https://curl.se/](https://curl.se/)

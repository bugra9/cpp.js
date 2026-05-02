#include "native.h"
#include <Matrix.h>
#include <curl/curl.h>


static std::string ooo = "";

size_t WriteCallback(void* contents, size_t size, size_t nmemb, std::string* output) {
    size_t totalSize = size * nmemb;
    output->append((char*)contents, totalSize);
    return totalSize;
}

std::string Native::sample() {
    auto firstMatrix = std::make_shared<Matrix>(9, 1);
    auto secondMatrix = std::make_shared<Matrix>(9, 2);
    auto resultStr = std::to_string(firstMatrix->multiple(secondMatrix)->get(0));
    // return "J₃ * (2*J₃) = " + resultStr + "*J₃";

    CURL* curl;
    CURLcode res;
    std::string response;
    char errbuf[CURL_ERROR_SIZE*100];

    curl = curl_easy_init(); // Initialize libcurl
    if (curl) {
        // curl_easy_setopt(curl, CURLOPT_URL, "https://www.cloudflarestatus.com/api/v2/status.json"); // Set the URL
        curl_easy_setopt(curl, CURLOPT_URL, "https://test22.free.beeceptor.com"); // Set the URL
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "{\"a\": 2}");
        // curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 0L);
        // curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 0L);
        // curl_easy_setopt(curl, CURLOPT_CAPATH, "/system/etc/security/cacerts");
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        headers = curl_slist_append(headers, "Accept: application/json");
        curl_easy_setopt(curl, CURLOPT_CAINFO, getenv("CURL_CA_BUNDLE"));

        curl_easy_setopt(curl, CURLOPT_ERRORBUFFER, errbuf);
        errbuf[0] = 0;
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback); // Set callback to handle data
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response); // Pass the response string
        res = curl_easy_perform(curl);
        if (res == CURLE_OK) {
            ooo = "response: " + response;
        } else {
            std::string errorStr = errbuf[0] ? std::string(errbuf) : curl_easy_strerror(res);
            ooo = "curl error: " + errorStr;
        }

        // Clean up
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);

        return ooo;
    }
}

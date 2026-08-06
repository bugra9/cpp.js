/* Fetch CURL_E2E_URL (a local server the runner starts) and assert the body marker. */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include <curl/curl.h>

static char body[4096];
static size_t bodyLen = 0;

static size_t sink(char *data, size_t size, size_t nmemb, void *userdata) {
    (void)userdata;
    size_t n = size * nmemb;
    size_t room = sizeof body - bodyLen - 1;
    if (n > room) {
        n = room;
    }
    memcpy(body + bodyLen, data, n);
    bodyLen += n;
    body[bodyLen] = '\0';
    return size * nmemb;
}

int main(void) {
    const char *url = getenv("CURL_E2E_URL");
    if (!url) {
        fprintf(stderr, "FAIL: CURL_E2E_URL not set\n");
        return 1;
    }
    if (curl_global_init(CURL_GLOBAL_DEFAULT) != CURLE_OK) {
        fprintf(stderr, "FAIL: curl_global_init errored\n");
        return 1;
    }
    CURL *h = curl_easy_init();
    if (!h) {
        fprintf(stderr, "FAIL: curl_easy_init errored\n");
        return 1;
    }
    curl_easy_setopt(h, CURLOPT_URL, url);
    curl_easy_setopt(h, CURLOPT_WRITEFUNCTION, sink);
    CURLcode rc = curl_easy_perform(h);
    if (rc != CURLE_OK) {
        fprintf(stderr, "FAIL: perform: %s\n", curl_easy_strerror(rc));
        return 1;
    }
    curl_easy_cleanup(h);
    curl_global_cleanup();

    if (!strstr(body, "cppjs-curl-wasi-e2e-ok")) {
        fprintf(stderr, "FAIL: body marker missing (%s)\n", body);
        return 1;
    }
    printf("libcurl %s: PASS (fetched %zu B over http)\n",
           curl_version_info(CURLVERSION_NOW)->version, bodyLen);
    return 0;
}

/* wasmtime (46/47) traps in mid-connect getsockname/getpeername; zeroed shadows keep transfers alive - drop when the runtime catches up. */
#include <netinet/in.h>
#include <sys/socket.h>

static int zeroed_inet(struct sockaddr *addr, socklen_t *len) {
    struct sockaddr_in a;
    memset(&a, 0, sizeof a);
    a.sin_family = AF_INET;
    socklen_t n = *len < (socklen_t)sizeof a ? *len : (socklen_t)sizeof a;
    memcpy(addr, &a, n);
    *len = (socklen_t)sizeof a;
    return 0;
}

int getsockname(int fd, struct sockaddr *addr, socklen_t *len) {
    (void)fd;
    return zeroed_inet(addr, len);
}

int getpeername(int fd, struct sockaddr *addr, socklen_t *len) {
    (void)fd;
    return zeroed_inet(addr, len);
}

#pragma once

#include <string>
#include <utility>
#include <vector>

namespace crossbind::http {

using Headers = std::vector<std::pair<std::string, std::string>>;

struct Request {
    std::string method;
    std::string authority;
    // As the client sent them, percent-encoding included; the query without its '?'.
    std::string path;
    std::string query;
    // Names in lowercase.
    Headers headers;
    std::string body;
};

struct Response {
    int status = 200;
    Headers headers;
    std::string body;
};

// Defined by the application; called once per request, after its whole body has arrived.
Response handle(Request request);

}

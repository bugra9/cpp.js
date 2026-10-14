// The wasi:http/handler export of an http build: each request goes to crossbind::http::handle, and its
// Response goes back to the host.

#include <crossbind/http.h>

#include <algorithm>
#include <cctype>
#include <cstdio>
#include <exception>
#include <string>
#include <utility>

#include "crossbind_http.h"

namespace {

using crossbind::http::Headers;
using crossbind::http::Request;
using crossbind::http::Response;

constexpr size_t READ_CHUNK = 64 * 1024;
// The canonical ABI traps on a copy of 2^28 bytes or more.
constexpr size_t WRITE_CHUNK = 1024 * 1024;
constexpr int LOWEST_STATUS = 100;
constexpr int HIGHEST_STATUS = 999;
constexpr int INTERNAL_SERVER_ERROR = 500;

// The host reads a blocked write after the frame that made it is gone, so the value cannot live on a stack.
const wasi_http_types_result_option_own_trailers_error_code_t NO_TRAILERS = {};

// A response whose body is still being written after task.return.
struct Task {
    Task *next;
    crossbind_http_waitable_set_t set;
    uint32_t waiting;
    wasi_http_types_stream_u8_writer_t body;
    wasi_http_types_future_result_option_own_trailers_error_code_writer_t trailers;
    std::string text;
    size_t written;
};

// wasi-sdk keeps the stack pointer in context slot 0 and hosts reject slot 1, so a callback finds its task by
// the waitable it reports.
Task *tasks = nullptr;

std::string textOf(const uint8_t *data, size_t length) {
    return std::string(reinterpret_cast<const char *>(data), length);
}

std::string lowercase(std::string text) {
    std::transform(text.begin(), text.end(), text.begin(), [](unsigned char c) { return static_cast<char>(std::tolower(c)); });
    return text;
}

std::string methodOf(wasi_http_types_borrow_request_t request) {
    static const char *const NAMES[] = { "GET", "HEAD", "POST", "PUT", "DELETE", "CONNECT", "OPTIONS", "TRACE", "PATCH" };
    wasi_http_types_method_t method;
    wasi_http_types_method_request_get_method(request, &method);
    std::string name = method.tag == WASI_HTTP_TYPES_METHOD_OTHER ? textOf(method.val.other.ptr, method.val.other.len) : NAMES[method.tag];
    wasi_http_types_method_free(&method);
    return name;
}

// Spin passes the authority of an HTTP/1.1 request, wasmtime only its host header.
std::string authorityOf(wasi_http_types_borrow_request_t request, const Headers &headers) {
    std::string value;
    crossbind_http_string_t authority;
    if (wasi_http_types_method_request_get_authority(request, &authority)) {
        value = textOf(authority.ptr, authority.len);
        crossbind_http_string_free(&authority);
    }
    if (!value.empty()) return value;
    const auto host = std::find_if(headers.begin(), headers.end(), [](const auto &header) { return header.first == "host"; });
    return host == headers.end() ? std::string() : host->second;
}

void readTarget(wasi_http_types_borrow_request_t request, Request &incoming) {
    crossbind_http_string_t target;
    if (!wasi_http_types_method_request_get_path_with_query(request, &target)) {
        incoming.path = "/";
        return;
    }
    const std::string value = textOf(target.ptr, target.len);
    crossbind_http_string_free(&target);
    const size_t mark = value.find('?');
    incoming.path = value.substr(0, mark);
    if (mark != std::string::npos) incoming.query = value.substr(mark + 1);
}

Headers headersOf(wasi_http_types_borrow_request_t request) {
    wasi_http_types_own_headers_t fields = wasi_http_types_method_request_get_headers(request);
    wasi_http_types_list_tuple2_field_name_field_value_t entries;
    wasi_http_types_method_fields_copy_all(wasi_http_types_borrow_fields(fields), &entries);
    Headers headers;
    headers.reserve(entries.len);
    for (size_t i = 0; i < entries.len; i++) {
        headers.emplace_back(lowercase(textOf(entries.ptr[i].f0.ptr, entries.ptr[i].f0.len)), textOf(entries.ptr[i].f1.ptr, entries.ptr[i].f1.len));
    }
    wasi_http_types_list_tuple2_field_name_field_value_free(&entries);
    wasi_http_types_fields_drop_own(fields);
    return headers;
}

// Blocks until the waitable makes progress. Only the steps before task.return block: a cancellation can only
// reach a task that has not returned, and its event names no waitable this file could find the task by.
crossbind_http_waitable_status_t await(uint32_t waitable) {
    crossbind_http_waitable_set_t set = crossbind_http_waitable_set_new();
    crossbind_http_waitable_join(waitable, set);
    crossbind_http_event_t event;
    crossbind_http_waitable_set_wait(set, &event);
    crossbind_http_waitable_join(waitable, 0);
    crossbind_http_waitable_set_drop(set);
    return event.code;
}

// False when the body does not fit in memory; the rest of it is left unread.
bool readBody(wasi_http_types_stream_u8_t stream, std::string &body) {
    bool fits = true;
    for (;;) {
        const size_t start = body.size();
        try {
            body.resize(start + READ_CHUNK);
        } catch (const std::exception &) {
            fits = false;
            break;
        }
        crossbind_http_waitable_status_t status = wasi_http_types_stream_u8_read(stream, reinterpret_cast<uint8_t *>(body.data()) + start, READ_CHUNK);
        if (status == CROSSBIND_HTTP_WAITABLE_STATUS_BLOCKED) status = await(stream);
        body.resize(start + CROSSBIND_HTTP_WAITABLE_COUNT(status));
        if (CROSSBIND_HTTP_WAITABLE_STATE(status) != CROSSBIND_HTTP_WAITABLE_COMPLETED) break;
    }
    wasi_http_types_stream_u8_drop_readable(stream);
    return fits;
}

// The future settles once the body has ended; anything but ok means the body did not arrive whole.
bool bodyArrived(wasi_http_types_future_result_option_own_trailers_error_code_t future, wasi_http_types_error_code_t &error) {
    wasi_http_types_result_option_own_trailers_error_code_t result;
    crossbind_http_waitable_status_t status = wasi_http_types_future_result_option_own_trailers_error_code_read(future, &result);
    if (status == CROSSBIND_HTTP_WAITABLE_STATUS_BLOCKED) status = await(future);
    wasi_http_types_future_result_option_own_trailers_error_code_drop_readable(future);
    if (CROSSBIND_HTTP_WAITABLE_STATE(status) != CROSSBIND_HTTP_WAITABLE_COMPLETED) {
        error = {};
        error.tag = WASI_HTTP_TYPES_ERROR_CODE_INTERNAL_ERROR;
        return false;
    }
    if (result.is_err) {
        error = result.val.err;
        return false;
    }
    if (result.val.ok.is_some) wasi_http_types_fields_drop_own(result.val.ok.val);
    return true;
}

void settle(wasi_http_types_future_result_void_error_code_writer_t writer) {
    const wasi_http_types_result_void_error_code_t ok = {};
    if (wasi_http_types_future_result_void_error_code_write(writer, &ok) == CROSSBIND_HTTP_WAITABLE_STATUS_BLOCKED) await(writer);
    wasi_http_types_future_result_void_error_code_drop_writable(writer);
}

crossbind_http_callback_code_t fail(wasi_http_types_error_code_t error) {
    exports_wasi_http_handler_result_own_response_error_code_t result = {};
    result.is_err = true;
    result.val.err = error;
    exports_wasi_http_handler_handle_return(result);
    wasi_http_types_error_code_free(&error);
    return CROSSBIND_HTTP_CALLBACK_CODE_EXIT;
}

Response respond(Request request) {
    const std::string line = request.method + " " + request.path;
    try {
        return crossbind::http::handle(std::move(request));
    } catch (const std::exception &error) {
        std::fprintf(stderr, "crossbind: %s threw: %s\n", line.c_str(), error.what());
    } catch (...) {
        std::fprintf(stderr, "crossbind: %s threw\n", line.c_str());
    }
    return { INTERNAL_SERVER_ERROR, {}, {} };
}

wasi_http_types_own_fields_t fieldsOf(const Headers &headers) {
    wasi_http_types_own_fields_t fields = wasi_http_types_constructor_fields();
    for (const auto &[name, value] : headers) {
        wasi_http_types_field_name_t key = { reinterpret_cast<uint8_t *>(const_cast<char *>(name.data())), name.size() };
        wasi_http_types_field_value_t bytes = { reinterpret_cast<uint8_t *>(const_cast<char *>(value.data())), value.size() };
        wasi_http_types_header_error_t error;
        if (!wasi_http_types_method_fields_append(wasi_http_types_borrow_fields(fields), &key, &bytes, &error)) {
            std::fprintf(stderr, "crossbind: the host rejected the response header \"%s\"\n", name.c_str());
            wasi_http_types_header_error_free(&error);
        }
    }
    return fields;
}

crossbind_http_callback_code_t wait(Task *task, uint32_t waitable) {
    task->waiting = waitable;
    crossbind_http_waitable_join(waitable, task->set);
    return CROSSBIND_HTTP_CALLBACK_CODE_WAIT(task->set);
}

crossbind_http_callback_code_t finish(Task *task) {
    crossbind_http_waitable_set_drop(task->set);
    Task **link = &tasks;
    while (*link != task) link = &(*link)->next;
    *link = task->next;
    delete task;
    return CROSSBIND_HTTP_CALLBACK_CODE_EXIT;
}

crossbind_http_callback_code_t sendTrailers(Task *task) {
    if (wasi_http_types_future_result_option_own_trailers_error_code_write(task->trailers, &NO_TRAILERS) == CROSSBIND_HTTP_WAITABLE_STATUS_BLOCKED) {
        return wait(task, task->trailers);
    }
    wasi_http_types_future_result_option_own_trailers_error_code_drop_writable(task->trailers);
    return finish(task);
}

crossbind_http_callback_code_t sendBody(Task *task) {
    while (task->written < task->text.size()) {
        const size_t length = std::min(task->text.size() - task->written, WRITE_CHUNK);
        const crossbind_http_waitable_status_t status = wasi_http_types_stream_u8_write(
            task->body, reinterpret_cast<const uint8_t *>(task->text.data()) + task->written, length);
        if (status == CROSSBIND_HTTP_WAITABLE_STATUS_BLOCKED) return wait(task, task->body);
        task->written += CROSSBIND_HTTP_WAITABLE_COUNT(status);
        if (CROSSBIND_HTTP_WAITABLE_STATE(status) != CROSSBIND_HTTP_WAITABLE_COMPLETED) break;
    }
    wasi_http_types_stream_u8_drop_writable(task->body);
    return sendTrailers(task);
}

crossbind_http_callback_code_t reply(Response response) {
    Task *task = new Task{ tasks, crossbind_http_waitable_set_new(), 0, 0, 0, std::move(response.body), 0 };
    tasks = task;
    wasi_http_types_stream_u8_t contents = wasi_http_types_stream_u8_new(&task->body);
    wasi_http_types_future_result_option_own_trailers_error_code_t trailers = wasi_http_types_future_result_option_own_trailers_error_code_new(&task->trailers);
    wasi_http_types_tuple2_own_response_future_result_void_error_code_t created;
    wasi_http_types_static_response_new(fieldsOf(response.headers), &contents, trailers, &created);
    wasi_http_types_future_result_void_error_code_drop_readable(created.f1);

    wasi_http_types_borrow_response_t borrowed = wasi_http_types_borrow_response(created.f0);
    const bool isStatus = response.status >= LOWEST_STATUS && response.status <= HIGHEST_STATUS
        && wasi_http_types_method_response_set_status_code(borrowed, static_cast<wasi_http_types_status_code_t>(response.status));
    if (!isStatus) {
        std::fprintf(stderr, "crossbind: %d is not an HTTP status, answered %d\n", response.status, INTERNAL_SERVER_ERROR);
        wasi_http_types_method_response_set_status_code(borrowed, INTERNAL_SERVER_ERROR);
    }

    exports_wasi_http_handler_result_own_response_error_code_t result = {};
    result.val.ok = created.f0;
    exports_wasi_http_handler_handle_return(result);
    return sendBody(task);
}

}

extern "C" crossbind_http_callback_code_t exports_wasi_http_handler_handle(exports_wasi_http_handler_own_request_t request) {
    Request incoming;
    wasi_http_types_borrow_request_t borrowed = wasi_http_types_borrow_request(request);
    incoming.method = methodOf(borrowed);
    readTarget(borrowed, incoming);
    incoming.headers = headersOf(borrowed);
    incoming.authority = authorityOf(borrowed, incoming.headers);

    wasi_http_types_future_result_void_error_code_writer_t settled;
    wasi_http_types_future_result_void_error_code_t res = wasi_http_types_future_result_void_error_code_new(&settled);
    wasi_http_types_tuple2_stream_u8_future_result_option_own_trailers_error_code_t body;
    wasi_http_types_static_request_consume_body(request, res, &body);
    if (!readBody(body.f0, incoming.body)) {
        std::string().swap(incoming.body);
        wasi_http_types_future_result_option_own_trailers_error_code_drop_readable(body.f1);
        settle(settled);
        wasi_http_types_error_code_t error = {};
        error.tag = WASI_HTTP_TYPES_ERROR_CODE_HTTP_REQUEST_BODY_SIZE;
        return fail(error);
    }
    wasi_http_types_error_code_t error;
    const bool arrived = bodyArrived(body.f1, error);
    settle(settled);
    if (!arrived) return fail(error);
    return reply(respond(std::move(incoming)));
}

extern "C" crossbind_http_callback_code_t exports_wasi_http_handler_handle_callback(crossbind_http_event_t *event) {
    Task *task = tasks;
    while (task && task->waiting != event->waitable) task = task->next;
    if (!task) return CROSSBIND_HTTP_CALLBACK_CODE_EXIT;
    task->waiting = 0;
    crossbind_http_waitable_join(event->waitable, 0);
    if (event->event == CROSSBIND_HTTP_EVENT_STREAM_WRITE) {
        task->written += CROSSBIND_HTTP_WAITABLE_COUNT(event->code);
        if (CROSSBIND_HTTP_WAITABLE_STATE(event->code) == CROSSBIND_HTTP_WAITABLE_COMPLETED) return sendBody(task);
        wasi_http_types_stream_u8_drop_writable(task->body);
        return sendTrailers(task);
    }
    wasi_http_types_future_result_option_own_trailers_error_code_drop_writable(task->trailers);
    return finish(task);
}

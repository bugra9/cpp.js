#pragma once

// What every app host shares: the module in Hermes on a thread of its own, the page's messages and its crossbind://
// requests. A platform adds the window, the webview and their channels (platform.h).
#include <hermes/hermes.h>
#include <jsi/jsi.h>

#include "platform.h"

#include <chrono>
#include <condition_variable>
#include <deque>
#include <functional>
#include <map>
#include <memory>
#include <mutex>
#include <string>
#include <thread>
#include <unordered_map>

namespace crossbind::app {

namespace jsi = facebook::jsi;
using Clock = std::chrono::steady_clock;

std::string readFile(const std::string &path);

// Runs every JS task on one thread, as JSI requires, and drains Hermes' microtasks after each, so a reply that waits
// on a promise goes out before the next message.
class JsThread {
public:
    using Task = std::function<void(jsi::Runtime &)>;

    void start(Task boot);
    void post(Task task);
    void postAfter(double ms, Task task);
    // The runtime stays alive: bindings keep JSI values in globals that would outlive its teardown.
    void stop();

private:
    Task next();
    void loop(const Task &boot);
    void run(const Task &task);

    std::unique_ptr<facebook::hermes::HermesRuntime> runtime_;
    std::mutex mutex_;
    std::condition_variable wake_;
    std::deque<Task> tasks_;
    std::multimap<Clock::time_point, Task> timers_;
    bool stopping_ = false;
    std::thread thread_;
};

class Core {
public:
    explicit Core(std::string pageDir) : pageDir_(std::move(pageDir)) {}

    // Loads the host bundle, Hermes bytecode or source, and starts the module. Returns an error, or nothing.
    std::string boot(std::string bundle, const std::string &sourceUrl, const std::string &dataPath);
    // A page message, which the host bundle answers through __host_reply.
    void receive(std::string message, ReplyFn reply);
    // The page's files, and the calls whose bytes are the request or response body.
    void serve(SchemeRequest request, SchemeRespond respond);
    // A new page replaced the one that held the module's objects.
    void reset();
    void stop() { js_.stop(); }

    // Every response lets any origin read it, as a page from a dev server needs.
    bool cors = false;

private:
    void installHostFunctions(jsi::Runtime &rt);

    JsThread js_;
    std::string pageDir_;
    // Only a page the module's channel answers learns it, and the calls made as crossbind:// requests need it: markup
    // and frames the channel refuses cannot make one.
    std::string token_;
    std::unordered_map<std::string, ReplyFn> replies_;
    long long nextReply_ = 0;
};

}  // namespace crossbind::app

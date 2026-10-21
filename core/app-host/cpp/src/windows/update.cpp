#include "platform.h"
#include "windows/com.h"

#include <winhttp.h>

#include <fstream>
#include <memory>
#include <stdexcept>
#include <vector>

using namespace crossbind::windows;

namespace {

constexpr DWORD READ_CHUNK = 64 * 1024;
// Antivirus software reads a program it has just seen written, which holds it from running for a moment.
constexpr int SETUP_TRIES = 4;
constexpr DWORD SETUP_RETRY_MS = 500;

// WinHTTP's handles, closed as they go out of scope.
using Internet = std::unique_ptr<void, decltype(&WinHttpCloseHandle)>;

Internet internet(HINTERNET opened) { return Internet(opened, &WinHttpCloseHandle); }

std::runtime_error failed(const std::string &url) {
    return std::runtime_error("crossbind: cannot download " + url + ": WinHTTP error " + std::to_string(GetLastError()));
}

}  // namespace

// WinHTTP keeps no cache, so every check asks the server anew, and it goes through the system's proxy.
void download(const std::string &url, const std::filesystem::path &file, std::uintmax_t maxBytes) {
    const std::wstring address = wide(url);
    URL_COMPONENTS parts{};
    parts.dwStructSize = sizeof parts;
    parts.dwHostNameLength = parts.dwUrlPathLength = parts.dwExtraInfoLength = static_cast<DWORD>(-1);
    if (!WinHttpCrackUrl(address.c_str(), 0, 0, &parts)) throw std::runtime_error("crossbind: " + url + " is no address");
    const std::wstring host(parts.lpszHostName, parts.dwHostNameLength);
    const std::wstring path = std::wstring(parts.lpszUrlPath, parts.dwUrlPathLength) + std::wstring(parts.lpszExtraInfo, parts.dwExtraInfoLength);
    const Internet session = internet(WinHttpOpen(L"crossbind", WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY, WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0));
    if (!session) throw failed(url);
    const Internet connection = internet(WinHttpConnect(session.get(), host.c_str(), parts.nPort, 0));
    if (!connection) throw failed(url);
    const Internet request = internet(WinHttpOpenRequest(connection.get(), L"GET", path.c_str(), nullptr, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES,
                                                         parts.nScheme == INTERNET_SCHEME_HTTPS ? WINHTTP_FLAG_SECURE : 0));
    DWORD status = 0;
    DWORD size = sizeof status;
    if (!request || !WinHttpSendRequest(request.get(), WINHTTP_NO_ADDITIONAL_HEADERS, 0, WINHTTP_NO_REQUEST_DATA, 0, 0, 0) ||
        !WinHttpReceiveResponse(request.get(), nullptr) ||
        !WinHttpQueryHeaders(request.get(), WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER, WINHTTP_HEADER_NAME_BY_INDEX, &status, &size,
                             WINHTTP_NO_HEADER_INDEX)) {
        throw failed(url);
    }
    if (status != HTTP_STATUS_OK) throw std::runtime_error("crossbind: " + url + " answered " + std::to_string(status));
    std::ofstream out(file, std::ios::binary | std::ios::trunc);
    std::vector<char> chunk(READ_CHUNK);
    std::uintmax_t total = 0;
    for (DWORD read = 0;;) {
        if (!WinHttpReadData(request.get(), chunk.data(), READ_CHUNK, &read)) throw failed(url);
        if (read == 0) break;
        total += read;
        if (total > maxBytes) throw std::runtime_error("crossbind: " + url + " answered more than " + std::to_string(maxBytes) + " bytes");
        out.write(chunk.data(), read);
    }
    if (!out.flush()) throw std::runtime_error("crossbind: cannot keep the download of " + url);
}

// installer.nsi's /UPDATE waits for the app to quit, installs the update in the app's folder, which /D= names unquoted
// and last, and opens it anew. A folder this user cannot write to fails here, as the setup program shows nothing.
void runSetup(const std::filesystem::path &setup) {
    const std::filesystem::path folder = std::filesystem::path(wide(resourceDir())).parent_path();
    wchar_t probe[MAX_PATH];
    if (!GetTempFileNameW(folder.c_str(), L"cbu", 0, probe)) {
        throw std::runtime_error("crossbind: cannot install the update: this user cannot change " + utf8(folder.c_str()));
    }
    DeleteFileW(probe);
    std::wstring command = L"\"" + setup.wstring() + L"\" /S /UPDATE /D=" + folder.wstring();
    STARTUPINFOW startup{};
    startup.cb = sizeof startup;
    PROCESS_INFORMATION process{};
    for (int tries = 1; !CreateProcessW(setup.c_str(), command.data(), nullptr, nullptr, FALSE, 0, nullptr, nullptr, &startup, &process); tries += 1) {
        const DWORD error = GetLastError();
        if (error != ERROR_SHARING_VIOLATION || tries == SETUP_TRIES) {
            throw std::runtime_error("crossbind: cannot install the update: Windows cannot run its setup program, error " + std::to_string(error));
        }
        Sleep(SETUP_RETRY_MS);
    }
    CloseHandle(process.hThread);
    CloseHandle(process.hProcess);
}

// The code a WASI HTTP component is made of, as docs/api/wasi.md#http-components--e-http shows it; the guide
// and the libraries' Edge tab both print it.

export const httpComponentName = (name) => `${name}-wasi-wasm32-st-release.http.wasm`;

export const httpHandlerCode = (comment) => `#include <crossbind/http.h>

namespace crossbind::http {

// ${comment}
Response handle(Request request) {
    return {
        200,
        { { "content-type", "text/plain" } },
        "hello " + request.path + "\\n",
    };
}

}`;

export const spinManifestCode = (name) => `spin_manifest_version = 2

[application]
name = "${name}"

[[trigger.http]]
route = "/..."
component = "${name}"

[component.${name}]
source = "dist/${httpComponentName(name)}"`;

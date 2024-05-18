#import "CppjsModule.h"
#import <React/RCTLog.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTUtils.h>
#include <jsi/jsi.h>

namespace emscripten {
namespace internal {
__attribute__((used)) void _embind_initialize_bindings(facebook::jsi::Runtime& rt, std::string path);
}
}

using namespace facebook;

@implementation CppjsModule
@synthesize bridge = _bridge;

RCT_EXPORT_MODULE(RNJsiLib)
RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(start)
{
    RCTCxxBridge *cxxBridge = (RCTCxxBridge *)self.bridge;
    jsi::Runtime* runtime = (jsi::Runtime*)cxxBridge.runtime;
    NSString *mainBundlePath = [[NSBundle mainBundle] bundlePath];
    emscripten::internal::_embind_initialize_bindings(*runtime, std::string([mainBundlePath UTF8String]));
    return @true;
}

- (void)setBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
}

@end

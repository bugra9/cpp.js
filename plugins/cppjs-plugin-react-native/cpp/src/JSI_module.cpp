#if ANDROID

#include <jni.h>
#include <jsi/jsi.h>
#include <emscripten/bind.h>

extern "C"
{
  JNIEXPORT void JNICALL
  Java_com_jsi_lib_RNJsiLibModule_install(JNIEnv* env, jobject thiz, jlong runtimePtr)
  {
      facebook::jsi::Runtime* runtime = (facebook::jsi::Runtime*)runtimePtr;
      emscripten::internal::_embind_initialize_bindings(*runtime);
  }
}
#endif

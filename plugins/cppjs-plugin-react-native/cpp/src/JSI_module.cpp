#if ANDROID

#include <jni.h>
#include <jsi/jsi.h>
#include <emscripten/bind.h>

std::string jstring2string(JNIEnv *env, jstring jStr) {
    if (!jStr)
        return "";

    const jclass stringClass = env->GetObjectClass(jStr);
    const jmethodID getBytes = env->GetMethodID(stringClass, "getBytes", "(Ljava/lang/String;)[B");
    const jbyteArray stringJbytes = (jbyteArray) env->CallObjectMethod(jStr, getBytes, env->NewStringUTF("UTF-8"));

    size_t length = (size_t) env->GetArrayLength(stringJbytes);
    jbyte* pBytes = env->GetByteArrayElements(stringJbytes, NULL);

    std::string ret = std::string((char *)pBytes, length);
    env->ReleaseByteArrayElements(stringJbytes, pBytes, JNI_ABORT);

    env->DeleteLocalRef(stringJbytes);
    env->DeleteLocalRef(stringClass);
    return ret;
}

extern "C"
{
  JNIEXPORT void JNICALL
  Java_com_jsi_lib_RNJsiLibModule_install(JNIEnv* env, jobject thiz, jlong runtimePtr, jstring path)
  {
      facebook::jsi::Runtime* runtime = (facebook::jsi::Runtime*)runtimePtr;
      emscripten::internal::_embind_initialize_bindings(*runtime, jstring2string(env, path)+"/cppjs");
  }
}
#endif

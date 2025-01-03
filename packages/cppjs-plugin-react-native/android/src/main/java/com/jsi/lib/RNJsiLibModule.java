
package com.jsi.lib;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;

public class RNJsiLibModule extends ReactContextBaseJavaModule {

  private final ReactApplicationContext reactContext;

  public RNJsiLibModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    Utils.copyAssetFolder(reactContext, "cppjs", reactContext.getCacheDir().getAbsolutePath() + "/cppjs");
  }

  @ReactMethod(isBlockingSynchronousMethod = true)
  public void start() {
    install(this.reactContext.getJavaScriptContextHolder().get(), this.reactContext.getCacheDir().getAbsolutePath());
  }

  @Override
  public String getName() {
    return "RNJsiLib";
  }

  public native void install(long jsContextNativePointer, String path);

  static {
    System.loadLibrary("react-native-cppjs");
  }
}

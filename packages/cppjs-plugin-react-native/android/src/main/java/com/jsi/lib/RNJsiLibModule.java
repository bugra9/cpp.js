
package com.jsi.lib;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;

public class RNJsiLibModule extends ReactContextBaseJavaModule {

  private final ReactApplicationContext reactContext;

  public RNJsiLibModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
    Utils.copyAssetFolder(reactContext, "cppjs", reactContext.getCacheDir().getAbsolutePath() + "/cppjs");
  }

  @ReactMethod
  public void start(Promise promise) {
    install(this.reactContext.getJavaScriptContextHolder().get(), this.reactContext.getCacheDir().getAbsolutePath());
    promise.resolve(true);
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

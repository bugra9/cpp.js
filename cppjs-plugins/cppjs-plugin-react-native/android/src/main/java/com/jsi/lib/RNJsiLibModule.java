
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
    // @ReactMethod calls run on RN's native-modules thread, but Hermes is
    // thread-affine: any JSI access from a non-JS thread is UB. install()
    // does heavy JSI work (embind class registration) so it must execute on
    // the JS queue thread. Dispatch via runOnJSQueueThread to make that
    // explicit instead of relying on a sleep() race.
    final long jsContextHolder = this.reactContext.getJavaScriptContextHolder().get();
    final String cachePath = this.reactContext.getCacheDir().getAbsolutePath();
    this.reactContext.runOnJSQueueThread(new Runnable() {
      @Override
      public void run() {
        try {
          install(jsContextHolder, cachePath);
          promise.resolve(true);
        } catch (Exception e) {
          promise.reject("RNJSI_INSTALL_FAILED", e);
        }
      }
    });
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

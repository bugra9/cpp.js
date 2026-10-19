package dev.crossbind.warm;

import androidx.webkit.WebViewFeature;

// Compiled against androidx.webkit, as the app's activity is.
final class Warm {
    static boolean listens() {
        return WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER);
    }
}

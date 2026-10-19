package dev.crossbind.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.HandlerThread;
import android.util.Log;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;

import androidx.webkit.WebMessageCompat;
import androidx.webkit.WebMessagePortCompat;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

// An app's one activity: its page in a WebView, its module in Hermes behind JNI (libcrossbind_app.so). The page comes
// from an https origin the activity serves from the app's files, or in a debug app from a dev server; calls and their
// bytes travel over a message port that the page's top frame alone gets.
public class CrossbindActivity extends Activity {
    static {
        System.loadLibrary("crossbind_app");
    }

    private static final String TAG = "Crossbind";
    private static final String HOST = "appassets.androidplatform.net";
    private static final String APP_ORIGIN = "https://" + HOST;
    // The object a page of the app's origins asks for its port with.
    private static final String READY = "__crossbind_ready";

    // A call of a page, answered on the port of the page that made it: a page that went away gets no answer.
    private static final class Call {
        final WebMessagePortCompat port;
        final int id;

        Call(WebMessagePortCompat port, int id) {
            this.port = port;
            this.id = id;
        }
    }

    private static final Map<Integer, Call> calls = new ConcurrentHashMap<>();
    private static final AtomicInteger nextCall = new AtomicInteger();

    private WebView webView;
    private Handler ipc;
    private WebMessagePortCompat port;
    private String token;
    private final Set<String> origins = new HashSet<>();

    // Starts the module, once per process, and returns the page's token and the dev server's page, or "".
    private static native String[] nativeStart(String files, String devUrl);

    private static native void nativeMessage(int call, byte[] text);

    private static native void nativeFrame(int call, String query, byte[] frame, int bodyOffset);

    private static native void nativeResult(int call, String query);

    // A file of the page, its path in UTF-8: "<status> <mime>\n" and its bytes.
    private static native byte[] nativeRequest(byte[] path, String query);

    private static native void nativeNewPage();

    // The module's answer to a call, from whichever thread gives it.
    static void onReply(int call, boolean ok, byte[] text) {
        Call to = calls.remove(call);
        if (to != null) post(to.port, new WebMessageCompat(to.id + "|" + (ok ? "" : "!") + new String(text, StandardCharsets.UTF_8)));
    }

    // A large result: its bytes after four that take the call's id, little-endian.
    static void onReplyBytes(int call, byte[] framed) {
        Call to = calls.remove(call);
        if (to == null) return;
        for (int i = 0; i < 4; i += 1) framed[i] = (byte) (to.id >> (8 * i));
        post(to.port, new WebMessageCompat(framed));
    }

    // Answers come from the module's thread and the port closes on the UI thread, never at once.
    private static void post(WebMessagePortCompat port, WebMessageCompat message) {
        synchronized (port) {
            try {
                port.postMessage(message);
            } catch (IllegalStateException closed) {
                // The page went away, and its port with it.
            }
        }
    }

    private static void close(WebMessagePortCompat port) {
        synchronized (port) {
            port.close();
        }
    }

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        // The page sends byte arrays as ArrayBuffer messages, which Android System WebView passes from 116 on.
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_ARRAY_BUFFER)
                || !WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)
                || !WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            PackageInfo installed = WebViewCompat.getCurrentWebViewPackage(this);
            String text = "This app needs Android System WebView 116 or newer. This device has "
                    + (installed == null ? "none" : installed.versionName) + ".";
            Log.e(TAG, text);
            TextView message = new TextView(this);
            message.setText(text);
            setContentView(message);
            return;
        }
        // Any app can start this activity with extras, so a debug app opens a dev server on this device alone, which adb
        // reverse forwards, and a release app shows its console only where it is debuggable.
        String url = getIntent().getStringExtra("CROSSBIND_APP_URL");
        if (url != null && !Set.of("localhost", "127.0.0.1").contains(Uri.parse(url).getHost())) {
            Log.w(TAG, "a dev server off this device is not opened: " + url);
            url = null;
        }
        boolean isDebuggable = (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        String[] started = nativeStart(installFiles().getPath(), url);
        token = started[0];
        String devUrl = started[1];
        origins.add(APP_ORIGIN);
        if (!devUrl.isEmpty()) origins.add(originOf(Uri.parse(devUrl)));

        HandlerThread thread = new HandlerThread("crossbind-ipc");
        thread.start();
        ipc = new Handler(thread.getLooper());
        webView = new WebView(this);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        WebViewCompat.addDocumentStartJavaScript(webView, topFrameScript(token), origins);
        WebViewCompat.addWebMessageListener(webView, READY, origins, (view, message, origin, isMainFrame, reply) -> {
            if (isMainFrame) handOverPort(origin, message.getData());
        });
        webView.setWebViewClient(new PageClient());
        if (!devUrl.isEmpty() || (isDebuggable && getIntent().hasExtra("CROSSBIND_APP_CONSOLE"))) webView.setWebChromeClient(new ConsoleClient());
        // The page stays clear of the system bars, the display cutout and the keyboard.
        FrameLayout frame = new FrameLayout(this);
        frame.addView(webView);
        frame.setOnApplyWindowInsetsListener((view, insets) -> {
            Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            return WindowInsets.CONSUMED;
        });
        setContentView(frame);
        matchSystemBars();
        webView.loadUrl(devUrl.isEmpty() ? APP_ORIGIN + "/" : devUrl);
    }

    @Override
    public void onConfigurationChanged(Configuration config) {
        super.onConfigurationChanged(config);
        matchSystemBars();
    }

    // The system bars lie over the window, so their icons are dark in the light theme and light in the dark one.
    private void matchSystemBars() {
        boolean isDark = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        int light = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
        getWindow().getInsetsController().setSystemBarsAppearance(isDark ? 0 : light, light);
    }

    @Override
    protected void onDestroy() {
        if (port != null) close(port);
        if (webView != null) webView.destroy();
        if (ipc != null) ipc.getLooper().quitSafely();
        super.onDestroy();
    }

    // Runs before the page's own scripts in every frame of the app's origins, and in the top frame alone gives the page
    // its token and the port its crossbind.js waits for: the one that comes with the token, which no other frame knows,
    // and with the ask of this page, which a port handed over for the page before cannot carry. The page asks for the
    // port once it waits for it, as a port handed over before would find no one.
    private static String topFrameScript(String token) {
        return "if (window.top === window) {"
                + " const token = '" + token + "';"
                + " const ask = crypto.randomUUID();"
                + " Object.defineProperty(globalThis, '__crossbind_token', { value: token });"
                + " Object.defineProperty(globalThis, '__crossbind_port', { value: new Promise((resolve) => {"
                + "  addEventListener('message', function handshake(event) {"
                + "   if (event.data !== 'crossbind:' + token + ':' + ask || !event.ports[0]) return;"
                + "   removeEventListener('message', handshake);"
                + "   resolve(event.ports[0]);"
                + "  });"
                + "  " + READY + ".postMessage(ask);"
                + " }) });"
                + "}";
    }

    private static String originOf(Uri url) {
        return url.getScheme() + "://" + url.getHost() + (url.getPort() == -1 ? "" : ":" + url.getPort());
    }

    private boolean allows(Uri url) {
        if ("about".equals(url.getScheme())) return true;
        // A blob URL carries the origin of the page that made it.
        if ("blob".equals(url.getScheme())) return allows(Uri.parse(url.getSchemeSpecificPart()));
        return origins.contains(originOf(url));
    }

    // "<id>|m|<message>" or "<id>|r|<query>", or as an ArrayBuffer "<header length><id>|<query>" and the bytes.
    private static void receive(WebMessagePortCompat from, WebMessageCompat message) {
        try {
            if (message.getType() == WebMessageCompat.TYPE_ARRAY_BUFFER) {
                byte[] frame = message.getArrayBuffer();
                int headerLength = (frame[0] & 255) | (frame[1] & 255) << 8 | (frame[2] & 255) << 16 | (frame[3] & 255) << 24;
                String header = new String(frame, 4, headerLength, StandardCharsets.UTF_8);
                int bar = header.indexOf('|');
                nativeFrame(callOf(from, header.substring(0, bar)), header.substring(bar + 1), frame, 4 + headerLength);
                return;
            }
            String data = message.getData();
            int bar = data.indexOf('|');
            int call = callOf(from, data.substring(0, bar));
            String rest = data.substring(bar + 3);
            if (data.charAt(bar + 1) == 'r') nativeResult(call, rest);
            else nativeMessage(call, rest.getBytes(StandardCharsets.UTF_8));
        } catch (RuntimeException malformed) {
            // Only the page's own code could send one in another form, which is no reason to end the app.
            Log.e(TAG, "a message on crossbind's port is in no form it takes", malformed);
        }
    }

    private static int callOf(WebMessagePortCompat port, String id) {
        int call = nextCall.getAndIncrement();
        calls.put(call, new Call(port, Integer.parseInt(id)));
        return call;
    }

    private final class PageClient extends WebViewClient {
        // Only the app's origins load; a link the user follows to another opens in the browser.
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri url = request.getUrl();
            if (allows(url)) return false;
            if (request.hasGesture() && Set.of("http", "https", "mailto").contains(url.getScheme())) {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, url));
                } catch (ActivityNotFoundException none) {
                    Log.w(TAG, "nothing opens " + url);
                }
            }
            return true;
        }

        // The page's files. Calls and their bytes travel over the port alone, which no other frame holds.
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri url = request.getUrl();
            if (!"https".equals(url.getScheme()) || !HOST.equals(url.getHost())) return null;
            String path = url.getPath() == null ? "/" : url.getPath();
            if (path.startsWith("/b/")) return response("404 text/plain\n".getBytes(StandardCharsets.US_ASCII));
            String query = url.getEncodedQuery();
            return response(nativeRequest(path.getBytes(StandardCharsets.UTF_8), query == null ? "" : query));
        }

    }

    // A new page replaced the one whose objects the module holds, and gets a port of its own: the old page's port is
    // closed, so an answer to a call it made goes nowhere.
    private void handOverPort(Uri origin, String ask) {
        if (port != null) close(port);
        nativeNewPage();
        WebMessagePortCompat[] channel = WebViewCompat.createWebMessageChannel(webView);
        port = channel[0];
        port.setWebMessageCallback(ipc, new WebMessagePortCompat.WebMessageCallbackCompat() {
            @Override
            public void onMessage(WebMessagePortCompat from, WebMessageCompat message) {
                receive(from, message);
            }
        });
        WebViewCompat.postWebMessage(webView, new WebMessageCompat("crossbind:" + token + ":" + ask, new WebMessagePortCompat[] {channel[1]}),
                origin);
    }

    private static final class ConsoleClient extends WebChromeClient {
        @Override
        public boolean onConsoleMessage(ConsoleMessage message) {
            int priority = switch (message.messageLevel()) {
                case ERROR -> Log.ERROR;
                case WARNING -> Log.WARN;
                default -> Log.INFO;
            };
            Log.println(priority, TAG, message.message());
            return true;
        }
    }

    private static WebResourceResponse response(byte[] answer) {
        int newline = 0;
        while (answer[newline] != '\n') newline += 1;
        String[] head = new String(answer, 0, newline, StandardCharsets.US_ASCII).split(" ", 2);
        int status = Integer.parseInt(head[0]);
        String mime = head[1].split(";", 2)[0];
        InputStream body = new ByteArrayInputStream(answer, newline + 1, answer.length - newline - 1);
        return new WebResourceResponse(mime, "utf-8", status, status == 200 ? "OK" : "Not Found", new HashMap<>(), body);
    }

    // The module reads the app's files from disk, so they are copied out of the APK once per install, where no backup
    // takes them.
    private File installFiles() {
        File dir = new File(getNoBackupFilesDir(), "app");
        File stamp = new File(dir, ".installed");
        try {
            String install = String.valueOf(getPackageManager()
                    .getPackageInfo(getPackageName(), PackageManager.PackageInfoFlags.of(0)).lastUpdateTime);
            if (stamp.exists() && install.equals(new String(Files.readAllBytes(stamp.toPath()), StandardCharsets.UTF_8))) return dir;
            delete(dir);
            copyAssets("app", dir);
            Files.write(stamp.toPath(), install.getBytes(StandardCharsets.UTF_8));
            return dir;
        } catch (IOException | PackageManager.NameNotFoundException error) {
            throw new IllegalStateException("crossbind: cannot install the app's files: " + error.getMessage(), error);
        }
    }

    private void copyAssets(String path, File to) throws IOException {
        String[] names = getAssets().list(path);
        if (names == null || names.length == 0) {
            to.getParentFile().mkdirs();
            try (InputStream in = getAssets().open(path)) {
                Files.copy(in, to.toPath());
            }
            return;
        }
        for (String name : names) copyAssets(path + "/" + name, new File(to, name));
    }

    private static void delete(File file) {
        File[] children = file.listFiles();
        if (children != null) for (File child : children) delete(child);
        file.delete();
    }
}

from kivy.app import App
from kivy.uix.label import Label
from kivy.core.window import Window
from kivy.clock import Clock
from kivy.utils import platform

WEBAPP_URL = "https://content-creation-black.vercel.app/"


if platform == "android":
    from jnius import autoclass
    from android.runnable import run_on_ui_thread

    PythonActivity = autoclass("org.kivy.android.PythonActivity")
    WebView = autoclass("android.webkit.WebView")
    WebViewClient = autoclass("android.webkit.WebViewClient")
    WebChromeClient = autoclass("android.webkit.WebChromeClient")
    ViewGroupLayoutParams = autoclass("android.view.ViewGroup$LayoutParams")
    Color = autoclass("android.graphics.Color")
else:
    def run_on_ui_thread(func):
        return func


class ContentCreationApp(App):
    webview = None

    def build(self):
        Window.bind(on_keyboard=self.on_keyboard)

        if platform == "android":
            Clock.schedule_once(lambda dt: self.create_webview(), 0)
            return Label(text="Loading Content Creation App...")

        return Label(
            text="Content Creation App\n\nThis app runs as Android WebView.",
            halign="center",
            valign="middle",
        )

    @run_on_ui_thread
    def create_webview(self):
        activity = PythonActivity.mActivity

        self.webview = WebView(activity)

        settings = self.webview.getSettings()
        settings.setJavaScriptEnabled(True)
        settings.setDomStorageEnabled(True)
        settings.setDatabaseEnabled(True)
        settings.setLoadWithOverviewMode(True)
        settings.setUseWideViewPort(True)
        settings.setBuiltInZoomControls(False)
        settings.setDisplayZoomControls(False)
        settings.setMediaPlaybackRequiresUserGesture(False)

        self.webview.setWebViewClient(WebViewClient())
        self.webview.setWebChromeClient(WebChromeClient())
        self.webview.setBackgroundColor(Color.WHITE)

        params = ViewGroupLayoutParams(
            ViewGroupLayoutParams.MATCH_PARENT,
            ViewGroupLayoutParams.MATCH_PARENT
        )

        activity.addContentView(self.webview, params)
        self.webview.loadUrl(WEBAPP_URL)

    def on_keyboard(self, window, key, scancode, codepoint, modifier):
        # Android back button
        if key == 27 and platform == "android" and self.webview:
            self.handle_android_back()
            return True
        return False

    @run_on_ui_thread
    def handle_android_back(self):
        if self.webview and self.webview.canGoBack():
            self.webview.goBack()
        else:
            PythonActivity.mActivity.moveTaskToBack(True)


if __name__ == "__main__":
    ContentCreationApp().run()

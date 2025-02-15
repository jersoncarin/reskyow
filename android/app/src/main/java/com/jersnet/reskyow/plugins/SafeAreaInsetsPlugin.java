package com.jersnet.reskyow.plugins;
import android.view.OrientationEventListener;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "SafeAreaInsets")
public class SafeAreaInsetsPlugin extends Plugin {
    private final SafeAreaInsets safeAreaInsets = new SafeAreaInsets();
    private int lastOrientation = -1;
    private OrientationEventListener orientationEventListener;
    private boolean isListening = false;
    private static final String KEY_INSET = "insets";

    @Override
    public void load() {
        safeAreaInsets.setBridge(this.getBridge());
        this.startListeningForSafeAreaChanges();
    }

    private void startListeningForSafeAreaChanges() {
        if (!isListening) {
            orientationEventListener = new OrientationEventListener(bridge.getActivity()) {
                @Override
                public void onOrientationChanged(int orientation) {
                    int currentOrientation = bridge.getActivity().getWindowManager().getDefaultDisplay().getRotation();
                    if (currentOrientation != lastOrientation) {
                        lastOrientation = currentOrientation;
                        detectSafeAreaChanges();
                    }
                }
            };
            orientationEventListener.enable();

            isListening = true;
        }
    }

    @PluginMethod
    public void startListeningForSafeAreaChanges(PluginCall call) {
        this.startListeningForSafeAreaChanges();
        call.resolve();
    }

    @PluginMethod
    public void stopListeningForSafeAreaChanges(PluginCall call) {
        if (isListening) {
            orientationEventListener.disable();
            isListening = false;
        }
        call.resolve();
    }

    private void detectSafeAreaChanges() {
        JSObject ret = new JSObject();
        ret.put(KEY_INSET, safeAreaInsets.getSafeAreaInsets());
        notifyListeners("safeAreaChanged", ret);
    }

    @PluginMethod
    public void getSafeAreaInsets(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put(KEY_INSET, safeAreaInsets.getSafeAreaInsets());
        call.resolve(ret);
    }
}

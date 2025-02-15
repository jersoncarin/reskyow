package com.jersnet.reskyow.plugins;

import android.os.Build;
import android.util.Log;
import android.view.DisplayCutout;
import android.view.WindowInsets;

import com.getcapacitor.Bridge;
import com.getcapacitor.JSObject;

public class SafeAreaInsets {
    private Bridge bridge;

    public void setBridge(Bridge bridge) {
        this.bridge = bridge;
    }

    public JSObject getSafeAreaInsets() {
        DisplayCutout displayCutout;
        WindowInsets windowInsets = this.bridge.getActivity().getWindow().getDecorView().getRootWindowInsets();
        if (windowInsets == null) {
            Log.i(SafeAreaInsetsPlugin.class.toString(), "WindowInsets is not available.");
            return this.result(0, 0, 0, 0);
        }

        int top = windowInsets.getStableInsetTop();
        int left = windowInsets.getStableInsetLeft();
        int right = windowInsets.getStableInsetRight();
        int bottom = windowInsets.getStableInsetBottom();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            displayCutout = windowInsets.getDisplayCutout();
            if (displayCutout != null) {
                top = Math.max(displayCutout.getSafeInsetTop(), top);
                left = Math.max(displayCutout.getSafeInsetLeft(), left);
                right = Math.max(displayCutout.getSafeInsetRight(), right);
                bottom = Math.max(displayCutout.getSafeInsetBottom(), bottom);
            }
        }

        return this.result(top, left, right, bottom);
    }

    public JSObject result(int top, int left, int right, int bottom) {
        JSObject json = new JSObject();
        json.put("top", dpToPixels(top));
        json.put("left", dpToPixels(left));
        json.put("right", dpToPixels(right));
        json.put("bottom", dpToPixels(bottom));
        return json;
    }

    private int dpToPixels(int dp) {
        float density = this.getDensity();
        return Math.round(dp / density);
    }

    private float getDensity() {
        return this.bridge.getActivity().getResources().getDisplayMetrics().density;
    }
}

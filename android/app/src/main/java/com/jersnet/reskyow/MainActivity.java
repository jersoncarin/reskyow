package com.jersnet.reskyow;

import android.os.Bundle;

import androidx.activity.EdgeToEdge;

import com.getcapacitor.BridgeActivity;
import com.jersnet.reskyow.plugins.SMSSenderPlugin;
import com.jersnet.reskyow.plugins.SafeAreaInsetsPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        registerPlugin(SafeAreaInsetsPlugin.class);
        registerPlugin(SMSSenderPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

package com.jersnet.reskyow.plugins;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.telephony.SmsManager;
import android.telephony.SubscriptionInfo;
import android.telephony.SubscriptionManager;
import android.util.Log;

import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.List;

@CapacitorPlugin(
        name = "SMSSender",
        permissions = {
                @Permission(alias = "sms", strings = { Manifest.permission.SEND_SMS, Manifest.permission.READ_PHONE_STATE }),
        }
)
public class SMSSenderPlugin extends Plugin {
    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            call.resolve(); // Already granted
        } else {
            requestPermissionForAlias("sms", call, "smsPermissionCallback");
        }
    }

    @PermissionCallback
    private void smsPermissionCallback(PluginCall call) {
        if (getPermissionState("sms") == PermissionState.GRANTED) {
            call.resolve(); // Permission granted
        } else {
            call.reject("SMS permission denied");
        }
    }

    @PluginMethod
    public void getAllSimSlots(PluginCall call) {
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            requestPermissionForAlias("sms", call, "smsPermissionCallback");
            return;
        }

        SubscriptionManager subscriptionManager = (SubscriptionManager) this.getActivity().getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);
        JSONArray simArray = new JSONArray();

        if (subscriptionManager != null) {
            @SuppressLint("MissingPermission") List<SubscriptionInfo> subscriptionInfoList = subscriptionManager.getActiveSubscriptionInfoList();

            if (subscriptionInfoList != null) {
                for (SubscriptionInfo info : subscriptionInfoList) {
                    JSONObject simInfo = new JSONObject();
                    try {
                        simInfo.put("simSlot", info.getSimSlotIndex());
                        simInfo.put("subscriptionId", info.getSubscriptionId());
                        simInfo.put("carrier", info.getCarrierName().toString());
                        simArray.put(simInfo);
                    } catch (JSONException e) {
                        call.reject("Error parsing SIM data: " + e.getMessage());
                        return;
                    }
                }
            }
        }

        call.resolve(new com.getcapacitor.JSObject().put("sims", simArray));
    }

    @PluginMethod
    public void sendSMS(PluginCall call) {
        Log.d("SMS", "Start Sending SMS");
        if (getPermissionState("sms") != PermissionState.GRANTED) {
            Log.d("SMS", "NO permission to use sms");
            requestPermissionForAlias("sms", call, "smsPermissionCallback");
            return;
        }

        Log.d("SMS", "Done requesting permission");
        String phoneNumber = call.getString("phoneNumber");
        String message = call.getString("message");
        int simSlot = call.getInt("simSlot", 0); // Default to SIM slot 0

        Log.d("SMS", "Phone: " + phoneNumber + "; Slot: " + Integer.toString(simSlot));

        if (phoneNumber == null || message == null) {
            call.reject("Missing parameters: phoneNumber and message are required");
            return;
        }

        Log.d("SMS", "Pass in checking");

        SubscriptionManager subscriptionManager = (SubscriptionManager) this.getActivity().getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE);

        if (subscriptionManager != null) {
            Log.d("SMS", "Subscription manager initialized");
            @SuppressLint("MissingPermission") List<SubscriptionInfo> subscriptionInfoList = subscriptionManager.getActiveSubscriptionInfoList();

            if (subscriptionInfoList != null && simSlot >= 0 && simSlot < subscriptionInfoList.size()) {
                Log.d("SMS", "Inside the subscription list");
                int subscriptionId = subscriptionInfoList.get(simSlot).getSubscriptionId();
                SmsManager smsManager = SmsManager.getSmsManagerForSubscriptionId(subscriptionId);

                try {
                    Log.d("SMS", "Sending SMS now");
                    String SENT = "SMS_SENT";

                    PendingIntent intent = PendingIntent.getBroadcast(this.getActivity(), 0,new Intent(SENT), PendingIntent.FLAG_IMMUTABLE);

                    smsManager.sendTextMessage(phoneNumber, null, message, intent, null);
                    call.resolve();

                    Log.d("SMS", "Done sending SMS and resolved");
                } catch (Exception e) {
                    Log.d("SMS", "Failed to send SMS: " + e.getMessage());
                    call.reject("Failed to send SMS: " + e.getMessage());
                }
            } else {
                Log.d("SMS", "Invalid SIM slot selected");
                call.reject("Invalid SIM slot selected");
            }
        } else {
            Log.d("SMS", "SubscriptionManager not available");
            call.reject("SubscriptionManager not available");
        }
    }
}

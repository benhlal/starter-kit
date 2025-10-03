package com.reactnativeargps;

import android.content.Context;
import android.location.Location;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;



import java.util.HashMap;
import java.util.Map;

public class ARGPSModule extends ReactContextBaseJavaModule {
    public static final String REACT_CLASS = "ARGPSNative";
    
    private ReactApplicationContext reactContext;
    private boolean hasWorldOrigin = false;
    private double worldOriginLat = 0.0;
    private double worldOriginLon = 0.0;
    private Map<String, Boolean> trackedObjects = new HashMap<>();
    private boolean sessionRunning = false;

    public ARGPSModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    @NonNull
    public String getName() {
        return REACT_CLASS;
    }

    @ReactMethod
    public void startSession(ReadableMap configMap, Promise promise) {
        try {
            // For demo purposes, just simulate session start without ARCore
            sessionRunning = true;
            
            // Send success event
            sendEvent("sessionDidStart", Arguments.createMap());
            promise.resolve(true);
            
        } catch (Exception e) {
            promise.reject("AR_SESSION_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void stopSession(Promise promise) {
        try {
            sessionRunning = false;
            trackedObjects.clear();
            hasWorldOrigin = false;
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("STOP_SESSION_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void setWorldOrigin(ReadableMap position, Promise promise) {
        try {
            if (!position.hasKey("latitude") || !position.hasKey("longitude")) {
                promise.reject("INVALID_GPS", "Invalid GPS coordinates");
                return;
            }
            
            worldOriginLat = position.getDouble("latitude");
            worldOriginLon = position.getDouble("longitude");
            hasWorldOrigin = true;
            
            android.util.Log.d("ARGPS", "World origin set to: " + worldOriginLat + ", " + worldOriginLon);
            promise.resolve(true);
            
        } catch (Exception e) {
            promise.reject("SET_ORIGIN_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void gpsToWorldPosition(ReadableMap gpsPosition, Promise promise) {
        try {
            if (!hasWorldOrigin) {
                promise.reject("NO_WORLD_ORIGIN", "World origin not set");
                return;
            }
            
            if (!gpsPosition.hasKey("latitude") || !gpsPosition.hasKey("longitude")) {
                promise.reject("INVALID_GPS", "Invalid GPS coordinates");
                return;
            }
            
            double lat = gpsPosition.getDouble("latitude");
            double lon = gpsPosition.getDouble("longitude");
            
            // GPS to meters conversion
            double metersPerDegreeLat = 111320.0;
            double metersPerDegreeLon = metersPerDegreeLat * Math.cos(Math.toRadians(worldOriginLat));
            
            double deltaLat = lat - worldOriginLat;
            double deltaLon = lon - worldOriginLon;
            
            // Convert to AR world coordinates
            // X = East-West (positive = East)
            // Z = North-South (positive = North) - Inverted for AR coordinate system
            // Y = Up-Down (positive = Up)
            double x = deltaLon * metersPerDegreeLon;
            double z = -deltaLat * metersPerDegreeLat; // Inverted for AR coordinates
            double y = 0.0; // Ground level
            
            android.util.Log.d("ARGPS", String.format("GPS(%.6f, %.6f) -> AR(%.2f, %.2f, %.2f)", lat, lon, x, y, z));
            
            WritableMap result = Arguments.createMap();
            result.putDouble("x", x);
            result.putDouble("y", y);
            result.putDouble("z", z);
            
            promise.resolve(result);
            
        } catch (Exception e) {
            promise.reject("GPS_CONVERSION_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void placeObject(ReadableMap object, Promise promise) {
        try {
            if (!sessionRunning) {
                promise.reject("NO_SESSION", "AR session not started");
                return;
            }
            
            if (!object.hasKey("id") || !object.hasKey("worldPosition")) {
                promise.reject("INVALID_OBJECT", "Invalid object data");
                return;
            }
            
            String objectId = object.getString("id");
            ReadableMap worldPosition = object.getMap("worldPosition");
            
            if (worldPosition == null) {
                promise.reject("INVALID_POSITION", "Invalid world position");
                return;
            }
            
            float x = (float) worldPosition.getDouble("x");
            float y = (float) worldPosition.getDouble("y");
            float z = (float) worldPosition.getDouble("z");
            
            // Store the object for tracking (simulation without actual AR)
            trackedObjects.put(objectId, true);
            
            android.util.Log.d("ARGPS", String.format("Placed object %s at AR coordinates (%.2f, %.2f, %.2f)", objectId, x, y, z));
            
            // Send anchored event
            WritableMap eventData = Arguments.createMap();
            eventData.putString("objectId", objectId);
            eventData.putMap("worldPosition", worldPosition);
            sendEvent("objectAnchored", eventData);
            
            promise.resolve(true);
            
        } catch (Exception e) {
            promise.reject("PLACE_OBJECT_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void removeObject(String objectId, Promise promise) {
        try {
            if (trackedObjects.containsKey(objectId)) {
                trackedObjects.remove(objectId);
                android.util.Log.d("ARGPS", "Removed object " + objectId);
            }
            promise.resolve(true);
        } catch (Exception e) {
            promise.reject("REMOVE_OBJECT_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void getSessionState(Promise promise) {
        try {
            WritableMap state = Arguments.createMap();
            
            state.putBoolean("isRunning", sessionRunning);
            state.putString("trackingState", sessionRunning ? "tracking" : "notAvailable");
            
            if (hasWorldOrigin) {
                WritableMap origin = Arguments.createMap();
                origin.putDouble("latitude", worldOriginLat);
                origin.putDouble("longitude", worldOriginLon);
                state.putMap("worldOrigin", origin);
            } else {
                state.putNull("worldOrigin");
            }
            
            promise.resolve(state);
        } catch (Exception e) {
            promise.reject("GET_STATE_ERROR", e.getMessage());
        }
    }

    @ReactMethod
    public void updateObjectPositions(ReadableMap currentGPS) {
        // Recalculate positions for all tracked objects based on new GPS position
        // This could be used for drift correction
        android.util.Log.d("ARGPS", "Updating object positions based on GPS: " + currentGPS.toString());
    }

    private void sendEvent(String eventName, @Nullable WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
}
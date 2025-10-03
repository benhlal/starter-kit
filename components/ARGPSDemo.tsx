import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Switch,
  ActivityIndicator,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  TextInput,
  ToastAndroid,
  Vibration,
} from "react-native";
import Geolocation from "@react-native-community/geolocation";
import ARGPS from "react-native-ar-gps";
import type { ARSession, ARGPSPosition } from "react-native-ar-gps";

// Fixed coordinates for testing - Central location for demo
const FIXED_COORDINATES = {
  latitude: 40.7128,
  longitude: -74.006,
};

// Function to calculate GPS coordinates at specific distances from current position
const calculateNearbyCoordinates = (
  currentPosition: ARGPSPosition,
  distanceMeters: number,
  bearingDegrees: number
): ARGPSPosition => {
  const earthRadius = 6371000; // Earth's radius in meters
  const lat1 = (currentPosition.latitude * Math.PI) / 180;
  const lon1 = (currentPosition.longitude * Math.PI) / 180;
  const bearing = (bearingDegrees * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceMeters / earthRadius) +
      Math.cos(lat1) *
        Math.sin(distanceMeters / earthRadius) *
        Math.cos(bearing)
  );

  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) *
        Math.sin(distanceMeters / earthRadius) *
        Math.cos(lat1),
      Math.cos(distanceMeters / earthRadius) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    latitude: (lat2 * 180) / Math.PI,
    longitude: (lon2 * 180) / Math.PI,
  };
};

// Removed generateTestObjects - only showing user-created objects now

const ARGPSDemo: React.FC = () => {
  const [useGPS, setUseGPS] = useState(false);
  const [currentGPS, setCurrentGPS] = useState<ARGPSPosition | null>(null);
  const [sessionState, setSessionState] = useState<ARSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [placedObjects, setPlacedObjects] = useState<string[]>([]);
  const [collectedObjects, setCollectedObjects] = useState<string[]>([]);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Custom placement settings
  const [customDistance, setCustomDistance] = useState(2);
  const [customDirection, setCustomDirection] = useState(0);
  const [showCustomPlacement, setShowCustomPlacement] = useState(false);
  const [distanceInput, setDistanceInput] = useState("2");
  const [objectCounter, setObjectCounter] = useState(1);

  useEffect(() => {
    requestLocationPermission();
    setupAREventListeners();

    return () => {
      ARGPS.stopSession();
    };
  }, []);

  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);

        const fineLocationGranted =
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] ===
          "granted";
        const coarseLocationGranted =
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] ===
          "granted";
        const cameraGranted =
          granted[PermissionsAndroid.PERMISSIONS.CAMERA] === "granted";

        const locationGranted = fineLocationGranted || coarseLocationGranted;
        setHasLocationPermission(locationGranted);

        console.log("Permission results:", {
          fineLocation: fineLocationGranted,
          coarseLocation: coarseLocationGranted,
          camera: cameraGranted,
          locationGranted,
        });

        if (!locationGranted || !cameraGranted) {
          Alert.alert(
            "Permissions Required",
            "This app needs camera and location permissions to work properly."
          );
        }
      } catch (err) {
        console.warn("Permission request error:", err);
        setHasLocationPermission(false);
      }
    } else {
      setHasLocationPermission(true); // iOS handles permissions differently
    }
  };

  const testGPSLocation = async () => {
    if (!hasLocationPermission) {
      Alert.alert("No Permission", "Location permission is required first.");
      return;
    }

    setIsLoading(true);
    try {
      const location = await getCurrentLocation();
      Alert.alert(
        "GPS Test Success",
        `Location: ${location.latitude.toFixed(
          6
        )}, ${location.longitude.toFixed(6)}`
      );
    } catch (error) {
      Alert.alert(
        "GPS Test Failed",
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const setupAREventListeners = () => {
    // Listen for AR session events
    ARGPS.addEventListener("sessionDidStart", () => {
      console.log("AR session started successfully");
    });

    ARGPS.addEventListener("objectAnchored", (data: any) => {
      console.log("Object anchored:", data);
    });

    ARGPS.addEventListener("trackingStateChanged", (data: any) => {
      console.log("Tracking state changed:", data);
    });

    ARGPS.addEventListener("sessionDidFail", (data: any) => {
      console.log("AR session failed:", data);
    });
  };

  const updateSessionState = async () => {
    try {
      const state = await ARGPS.getSessionState();
      setSessionState(state);
    } catch (error) {
      console.error("Failed to get session state:", error);
    }
  };

  const getCurrentLocation = (): Promise<ARGPSPosition> => {
    return new Promise((resolve, reject) => {
      if (!useGPS) {
        setCurrentGPS(FIXED_COORDINATES);
        resolve(FIXED_COORDINATES);
        return;
      }

      if (!hasLocationPermission) {
        Alert.alert(
          "Permission Required",
          "Location permission is required for GPS functionality."
        );
        setCurrentGPS(FIXED_COORDINATES);
        resolve(FIXED_COORDINATES);
        return;
      }

      console.log("Getting GPS location...");
      Geolocation.getCurrentPosition(
        (position) => {
          console.log("GPS position received:", position.coords);
          const gpsPos = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCurrentGPS(gpsPos);
          resolve(gpsPos);
        },
        (error) => {
          console.warn("GPS Error:", error);
          let errorMessage = "Using fixed coordinates instead.";

          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage =
                "Location permission denied. Enable location in Settings.";
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage =
                "Location unavailable. Try moving to an open area.";
              break;
            case 3: // TIMEOUT
              errorMessage =
                "GPS timeout. Make sure location services are enabled.";
              break;
            default:
              errorMessage = `GPS Error (${error.code}): ${error.message}`;
          }

          Alert.alert(
            "GPS Issue",
            `${errorMessage}\n\nUsing fixed coordinates for demo.`
          );
          setCurrentGPS(FIXED_COORDINATES);
          resolve(FIXED_COORDINATES);
        },
        {
          enableHighAccuracy: false, // Use network/WiFi location for faster fix
          timeout: 30000, // Increase timeout to 30 seconds
          maximumAge: 120000, // Accept cached locations up to 2 minutes old
          distanceFilter: 100, // Reduce sensitivity to avoid frequent updates
        }
      );
    });
  };

  const startARSession = async () => {
    try {
      setIsLoading(true);

      // Get current location (GPS or fixed)
      const location = await getCurrentLocation();
      console.log("Using location:", location);

      // Start AR session
      const sessionStarted = await ARGPS.startSession({
        worldTracking: true,
        planeDetection: true,
      });

      if (!sessionStarted) {
        throw new Error("Failed to start AR session");
      }

      // Set world origin to current location
      await ARGPS.setWorldOrigin(location);
      console.log("World origin set successfully");

      await updateSessionState();
      Alert.alert("Success", "AR session started! You can now place objects.");
    } catch (error) {
      console.error("AR Session Error:", error);
      Alert.alert(
        "AR Error",
        `Failed to start AR session: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Removed automatic test object placement - only show user-created objects

  const placeCustomCoin = async () => {
    try {
      setIsLoading(true);

      // Check if AR session is running
      if (!sessionState?.isRunning) {
        Alert.alert(
          "AR Session Required",
          "Please start the AR session first."
        );
        setIsLoading(false);
        return;
      }

      // Get current location
      const currentLocation = await getCurrentLocation();
      console.log("Current location for custom coin:", currentLocation);

      // Calculate position at custom distance and direction
      const coinPosition = calculateNearbyCoordinates(
        currentLocation,
        customDistance,
        customDirection
      );

      // Convert GPS to world coordinates
      const worldPos = await ARGPS.gpsToWorldPosition(coinPosition);

      // Create unique coin with counter
      const coinId = `coin_${objectCounter}`;
      const customCoin = {
        id: coinId,
        type: "coin",
        position: coinPosition,
        worldPosition: worldPos,
      };

      await ARGPS.placeObject(customCoin);

      // Update tracking
      setPlacedObjects((prev) => [...prev, coinId]);
      setObjectCounter((prev) => prev + 1);

      const directionName = getDirectionName(customDirection);

      console.log(
        `Placed coin ${objectCounter} at ${customDistance}m ${directionName} - GPS: ${coinPosition.latitude.toFixed(
          6
        )}, ${coinPosition.longitude.toFixed(6)}`
      );

      Alert.alert(
        "Coin Placed Successfully",
        `Coin #${objectCounter} placed at ${customDistance}m ${directionName}\n\nTotal coins: ${
          placedObjects.length + 1
        }`
      );
    } catch (error) {
      console.error("Place Custom Coin Error:", error);
      Alert.alert(
        "Error",
        `Failed to place custom coin: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getDirectionName = (degrees: number): string => {
    const directions = [
      "North",
      "NE",
      "East",
      "SE",
      "South",
      "SW",
      "West",
      "NW",
    ];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  };

  const clearObjects = async () => {
    try {
      for (const objectId of placedObjects) {
        await ARGPS.removeObject(objectId);
      }
      setPlacedObjects([]);
      setCollectedObjects([]);
      Alert.alert(
        "Objects Cleared",
        "All objects have been removed from the AR scene."
      );
    } catch (error) {
      console.error("Error clearing objects:", error);
      Alert.alert("Error", "Failed to clear objects.");
    }
  };
  const stopSession = () => {
    try {
      ARGPS.stopSession();
      setSessionState(null);
      setPlacedObjects([]);
      setCollectedObjects([]);
      Alert.alert("AR Session", "Session stopped successfully.");
    } catch (error) {
      console.error("Error stopping session:", error);
      Alert.alert("Error", "Failed to stop AR session.");
    }
  };

  const collectObject = (objectId: string) => {
    if (collectedObjects.includes(objectId)) {
      return; // Already collected
    }

    // Add to collected objects
    setCollectedObjects((prev) => [...prev, objectId]);

    // Remove from placed objects
    setPlacedObjects((prev) => prev.filter((id) => id !== objectId));

    // Show toast message
    if (Platform.OS === "android") {
      ToastAndroid.show(`💰 Collected ${objectId}!`, ToastAndroid.SHORT);
    } else {
      Alert.alert("Collected!", `💰 ${objectId} collected!`);
    }

    // Trigger vibration
    Vibration.vibrate([100, 50, 100]); // Pattern: vibrate-pause-vibrate

    console.log(`Collected object: ${objectId}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AR GPS Demo</Text>

      {/* GPS Toggle */}
      <View style={styles.row}>
        <Text style={styles.label}>Use Live GPS:</Text>
        <Switch
          value={useGPS}
          onValueChange={async (value) => {
            setUseGPS(value);
            if (value && hasLocationPermission) {
              // Immediately get GPS location when toggled on
              try {
                await getCurrentLocation();
              } catch (error) {
                console.warn("Failed to get GPS on toggle:", error);
              }
            } else if (!value) {
              // Reset to fixed coordinates when toggled off
              setCurrentGPS(FIXED_COORDINATES);
            }
          }}
          disabled={!hasLocationPermission}
        />
      </View>

      {/* Custom Placement Toggle */}
      <View style={styles.row}>
        <Text style={styles.label}>Custom Placement:</Text>
        <Switch
          value={showCustomPlacement}
          onValueChange={setShowCustomPlacement}
        />
      </View>

      {/* Custom Placement Controls */}
      {showCustomPlacement && (
        <View style={styles.customControls}>
          <Text style={styles.customTitle}>Custom Coin Placement</Text>

          {/* Distance Control */}
          <View style={styles.customRow}>
            <Text style={styles.customLabel}>Distance:</Text>
            <View style={styles.distanceInputContainer}>
              <TextInput
                style={styles.distanceInput}
                value={distanceInput}
                onChangeText={(text) => {
                  setDistanceInput(text);
                  const distance = parseFloat(text);
                  if (!isNaN(distance) && distance > 0 && distance <= 100) {
                    setCustomDistance(distance);
                  }
                }}
                placeholder="2.5"
                keyboardType="numeric"
                maxLength={5}
              />
              <Text style={styles.unitText}>meters</Text>
            </View>
          </View>

          {/* Quick Distance Buttons */}
          <View style={styles.quickButtonsContainer}>
            <Text style={styles.quickButtonsLabel}>Quick distances:</Text>
            <View style={styles.quickButtons}>
              {[1, 2, 5, 10, 20, 50].map((distance) => (
                <TouchableOpacity
                  key={distance}
                  style={[
                    styles.quickButton,
                    customDistance === distance && styles.quickButtonActive,
                  ]}
                  onPress={() => {
                    setCustomDistance(distance);
                    setDistanceInput(distance.toString());
                  }}
                >
                  <Text
                    style={[
                      styles.quickButtonText,
                      customDistance === distance &&
                        styles.quickButtonTextActive,
                    ]}
                  >
                    {distance}m
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Direction Control */}
          <View style={styles.customRow}>
            <Text style={styles.customLabel}>
              Direction: {getDirectionName(customDirection)} ({customDirection}
              °)
            </Text>
            <View style={styles.distanceButtons}>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() =>
                  setCustomDirection((customDirection - 45 + 360) % 360)
                }
              >
                <Text style={styles.smallButtonText}>←</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={() => setCustomDirection((customDirection + 45) % 360)}
              >
                <Text style={styles.smallButtonText}>→</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Place Custom Coin Button */}
          <TouchableOpacity
            style={[styles.button, styles.customButton]}
            onPress={placeCustomCoin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>
                Place Coin ({customDistance}m{" "}
                {getDirectionName(customDirection)})
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Current Location Display */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Current Location:</Text>
        <Text style={styles.infoText}>
          {useGPS
            ? currentGPS
              ? `GPS: ${currentGPS.latitude.toFixed(
                  6
                )}, ${currentGPS.longitude.toFixed(6)}`
              : "Getting GPS..."
            : `Fixed: ${FIXED_COORDINATES.latitude.toFixed(
                6
              )}, ${FIXED_COORDINATES.longitude.toFixed(6)}`}
        </Text>
      </View>

      {/* Session State */}
      {sessionState && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>AR Session:</Text>
          <Text style={styles.infoText}>
            Running: {sessionState.isRunning ? "Yes" : "No"}
          </Text>
          <Text style={styles.infoText}>
            Tracking: {sessionState.trackingState}
          </Text>
          <Text style={styles.infoText}>Objects: {placedObjects.length}</Text>
          <Text style={styles.infoText}>
            Collected: {collectedObjects.length}
          </Text>
        </View>
      )}

      {/* Placed Objects - Collection Interface */}
      {placedObjects.length > 0 && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>🪙 Coins Available to Collect:</Text>
          {placedObjects.map((objectId) => (
            <View key={objectId} style={styles.collectRow}>
              <Text style={styles.collectObjectText}>💰 {objectId}</Text>
              <TouchableOpacity
                style={styles.collectButton}
                onPress={() => collectObject(objectId)}
              >
                <Text style={styles.collectButtonText}>Collect!</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Collected Objects Display */}
      {collectedObjects.length > 0 && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>✅ Collected Coins:</Text>
          <Text style={styles.collectedText}>
            {collectedObjects.join(", ")} ({collectedObjects.length} total)
          </Text>
        </View>
      )}

      {/* GPS Test Button */}
      <TouchableOpacity
        style={[styles.button, styles.testButton]}
        onPress={testGPSLocation}
        disabled={isLoading || !hasLocationPermission}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Test GPS Location</Text>
        )}
      </TouchableOpacity>

      {/* Controls */}
      <View style={styles.buttonContainer}>
        {!sessionState?.isRunning ? (
          <TouchableOpacity
            style={[styles.button, styles.startButton]}
            onPress={startARSession}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Start AR Session</Text>
            )}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={clearObjects}
              disabled={placedObjects.length === 0}
            >
              <Text style={styles.buttonText}>Clear Objects</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.stopButton]}
              onPress={stopSession}
            >
              <Text style={styles.buttonText}>Stop Session</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        <Text style={styles.instructionsText}>
          1. Toggle GPS to use live location or fixed coordinates{"\n"}
          2. Start AR session to initialize world tracking{"\n"}
          3. Place coins - they will appear 1m, 2m, 3m from you{"\n"}
          4. Walk in different directions to find the coins{"\n"}
          5. Coin1: 1m North, Coin2: 2m East, Coin3: 3m South
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 16,
    color: "#333",
  },
  infoContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  testButton: {
    backgroundColor: "#9C27B0",
    marginBottom: 10,
  },
  startButton: {
    backgroundColor: "#4CAF50",
  },
  placeButton: {
    backgroundColor: "#2196F3",
  },
  clearButton: {
    backgroundColor: "#FF9800",
  },
  stopButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  instructionsContainer: {
    backgroundColor: "#e3f2fd",
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: "#1565C0",
    lineHeight: 20,
  },
  customControls: {
    backgroundColor: "#fff3e0",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ff9800",
  },
  customTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff9800",
    marginBottom: 10,
    textAlign: "center",
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  customLabel: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  distanceButtons: {
    flexDirection: "row",
    gap: 10,
  },
  smallButton: {
    backgroundColor: "#ff9800",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    minWidth: 30,
    alignItems: "center",
  },
  smallButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  customButton: {
    backgroundColor: "#ff9800",
    marginTop: 5,
  },
  distanceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  distanceInput: {
    borderWidth: 1,
    borderColor: "#ff9800",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 16,
    minWidth: 60,
    textAlign: "center",
    backgroundColor: "white",
  },
  unitText: {
    fontSize: 14,
    color: "#666",
  },
  quickButtonsContainer: {
    marginTop: 10,
  },
  quickButtonsLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  quickButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  quickButton: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  quickButtonActive: {
    backgroundColor: "#ff9800",
    borderColor: "#ff9800",
  },
  quickButtonText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  quickButtonTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  // Collection interface styles
  collectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  collectObjectText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  collectButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  collectButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  collectedText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
    fontStyle: "italic",
  },
});

export default ARGPSDemo;

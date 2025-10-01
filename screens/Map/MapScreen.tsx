import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Alert,
  Linking,
  Animated,
} from "react-native";
import Geolocation from "@react-native-community/geolocation";
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  Region,
  MapPressEvent,
  Polyline,
} from "react-native-maps";
import {
  useEventLocations,
  useMapState,
  useUserProfile,
} from "../../state/recoil/hooks";
import { useRecoilState } from "recoil";
import {
  mapCenterOnUserState,
  mapSelectLocationModeState,
  mapCustomLocationState,
} from "../../state/recoil/atoms";
import { EventLocation } from "../../types";
// Generate random coins around current location
const generateRandomCoins = (
  centerLat: number,
  centerLng: number,
  count: number = 25,
  prefix: string
) => {
  const coins = [];
  for (let i = 0; i < count; i++) {
    // Generate random offset within ~5km radius
    const latOffset = (Math.random() - 0.5) * 0.09; // ~5km (0.045 degrees ≈ 5km)
    const lngOffset = (Math.random() - 0.5) * 0.09; // ~5km
    coins.push({
      id: `${prefix}-coin-${i}`, // Use prefix to make IDs unique
      coordinate: {
        latitude: centerLat + latOffset,
        longitude: centerLng + lngOffset,
      },
      value: Math.floor(Math.random() * 50) + 10, // 10-60 coins
    });
  }
  return coins;
};

// Random coins around Paris (25 coins in 5km radius)
const parisCoins = generateRandomCoins(48.8566, 2.3522, 25, "paris");

// Random coins around London (25 coins in 5km radius)
const londonCoins = generateRandomCoins(51.5074, -0.1278, 25, "london");

// Combine all coins
const randomCoins = [...parisCoins, ...londonCoins];
// Event locations come from state (Mock or Firebase)

const getaroundMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#181a20" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#b0b0b0" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#181a20" }] },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#7B3FE4" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7B3FE4" }],
  },
  // Buildings styling
  {
    featureType: "landscape.man_made",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }], // Dark gray for buildings
  },
  {
    featureType: "poi.business",
    elementType: "geometry",
    stylers: [{ color: "#333333" }], // Slightly lighter for POI buildings
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "simplified" }], // Show some POI labels
  },
];

const MapScreen: React.FC<{
  setActiveTab?: () => void;
  focusLocation?: { latitude: number; longitude: number; title: string };
}> = ({ setActiveTab, focusLocation }) => {
  const mapRef = useRef<MapView>(null);
  const alertLocationError = React.useCallback(() => {
    Alert.alert("Location error", "Couldn't get current position.");
  }, []);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  // Single source of truth for rings & focus: current GPS, chosen pin, or event center
  const [ringCenter, setRingCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [_ringSource, setRingSource] = useState<
    "gps" | "custom" | "event" | "filter" | null
  >(null);
  // Current GPS location for rendering a blue dot marker
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  // Event summary visibility (coins / prize / participants)
  const [showEventSummary, setShowEventSummary] = useState<boolean>(true);

  // Generate multiple dash segments for a complete dotted circle
  const generateDottedCircleSegments = (
    center: { latitude: number; longitude: number },
    radiusInMeters: number
  ) => {
    const segments = [];
    const totalDashes = 20; // Number of dash segments around the circle
    const dashLength = 4; // Points per dash
    const gapLength = 4; // Points per gap
    const totalPoints = totalDashes * (dashLength + gapLength);

    for (let dash = 0; dash < totalDashes; dash++) {
      const startPoint = dash * (dashLength + gapLength);
      const coordinates = [];

      for (let i = 0; i < dashLength; i++) {
        const pointIndex = startPoint + i;
        const angle = (pointIndex / totalPoints) * 2 * Math.PI;
        const earthRadius = 6371000;

        const lat =
          center.latitude +
          (radiusInMeters / earthRadius) * (180 / Math.PI) * Math.cos(angle);
        const lng =
          center.longitude +
          ((radiusInMeters / earthRadius) * (180 / Math.PI) * Math.sin(angle)) /
            Math.cos((center.latitude * Math.PI) / 180);

        coordinates.push({ latitude: lat, longitude: lng });
      }

      if (coordinates.length > 1) {
        segments.push(coordinates);
      }
    }

    return segments;
  };

  // Animation for GPS location beat
  const gpsLocationPulse = useRef(new Animated.Value(1)).current;

  // Start beat animation when GPS location is available
  useEffect(() => {
    if (currentLocation) {
      const beatAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(gpsLocationPulse, {
            toValue: 1.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(gpsLocationPulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      beatAnimation.start();
      return () => beatAnimation.stop();
    }
  }, [currentLocation, gpsLocationPulse]);
  const [region, setRegion] = useState<Region>({
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const { eventLocations, fetchEventLocations } = useEventLocations();
  const { selectedEvent } = useMapState();
  const { userProfile } = useUserProfile();
  const [centerOnUser, setCenterOnUser] = useRecoilState(mapCenterOnUserState);
  const [selectMode, setSelectMode] = useRecoilState(
    mapSelectLocationModeState
  );
  const [customLocation, setCustomLocation] = useRecoilState(
    mapCustomLocationState
  );
  const isParticipant = Array.isArray((userProfile as any)?.joinedEvents)
    ? (userProfile as any).joinedEvents.includes(selectedEvent?.id || "")
    : false; // Placeholder: real participant check when profile includes joined events

  useEffect(() => {
    fetchEventLocations();
  }, [fetchEventLocations]);

  // GPS button press handler with permission check
  const centerOnUserNow = useCallback(async () => {
    const permission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message:
          "We need access to your location to show your position on the map.",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      }
    );

    let canUseLocation = permission === PermissionsAndroid.RESULTS.GRANTED;

    // If fine location denied, try coarse location
    if (!canUseLocation) {
      const coarsePermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
      );
      canUseLocation = coarsePermission === PermissionsAndroid.RESULTS.GRANTED;
    }

    // If still denied, offer to open Settings
    if (!canUseLocation) {
      Alert.alert(
        "Location Permission Required",
        "Please enable location permission in Settings to use this feature.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return;
    }

    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        // Store GPS location separately
        setCurrentLocation({ latitude, longitude });
        // Set ring center to GPS location
        setRingCenter({ latitude, longitude });
        setRingSource("gps");
        // Focus map on GPS location (40% less zoom total)
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.014, // 40% larger than 0.01
            longitudeDelta: 0.014, // 40% larger than 0.01
          });
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alertLocationError();
      },
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
    );
  }, [alertLocationError]);

  // Get user location on component mount (background tracking)
  useEffect(() => {
    const getCurrentPosition = () => {
      Geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          // Don't auto-center or show rings - only for background tracking
        },
        (error) => {
          console.warn("Error getting location:", error);
        },
        {
          enableHighAccuracy: false,
          timeout: 30000,
          maximumAge: 60000,
        }
      );
    };

    // Get initial position
    getCurrentPosition();

    // Watch position changes
    const watchId = Geolocation.watchPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        // Don't auto-center - only update location for background tracking
      },
      (error) => {
        console.warn("Error watching location:", error);
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000,
        distanceFilter: 50, // Update every 50 meters
      }
    );

    return () => {
      Geolocation.clearWatch(watchId);
    };
  }, []);

  // Handle center on user location (only when explicitly requested via filter)
  useEffect(() => {
    if (!centerOnUser || !userLocation) {
      return;
    }
    // Set ring center to GPS location when coming from filter
    setRingCenter({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
    });
    setRingSource("filter");

    const focus = {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.07, // 40% larger than 0.05
      longitudeDelta: 0.07, // 40% larger than 0.05
    };
    setRegion(focus);
    mapRef.current?.animateToRegion(focus, 1200);
    setCenterOnUser(false);
  }, [centerOnUser, userLocation, setCenterOnUser]);

  const handleMarkerPress = (
    markerId: string,
    coordinate: { latitude: number; longitude: number }
  ) => {
    setSelectedMarker(markerId);
    // Set ring center to the selected event
    setRingCenter(coordinate);
    setRingSource("event");
    // Zoom into the marker with smooth animation (40% less zoom total)
    mapRef.current?.animateToRegion(
      {
        ...coordinate,
        latitudeDelta: 0.07, // 40% larger than 0.05
        longitudeDelta: 0.07, // 40% larger than 0.05
      },
      1000
    );
  };

  // Dismiss info panel when tapping outside markers
  const handleMapPress = (_evt: MapPressEvent) => {
    if (selectMode) {
      return; // selection handled in onPress prop below where we store custom location
    }
    // Dismiss selected marker when tapping empty map area
    setSelectedMarker(null);
  };

  const handleZoomIn = () => {
    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta * 0.5,
      longitudeDelta: region.longitudeDelta * 0.5,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 500);
  };

  const handleZoomOut = () => {
    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta * 2,
      longitudeDelta: region.longitudeDelta * 2,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 500);
  };

  // const handleResetView = () => {
  //   const resetRegion = {
  //     latitude: 48.8566,
  //     longitude: 2.3522,
  //     latitudeDelta: 0.1,
  //     longitudeDelta: 0.1,
  //   };
  //   setRegion(resetRegion);
  //   setSelectedMarker(null);
  //   mapRef.current?.animateToRegion(resetRegion, 1000);
  // };

  // Focus on specific location when prop changes
  useEffect(() => {
    if (focusLocation && mapRef.current) {
      const focusRegion = {
        latitude: focusLocation.latitude,
        longitude: focusLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setRegion(focusRegion);
      mapRef.current.animateToRegion(focusRegion, 1500);

      // Find and select the marker
      const eventMarker = eventLocations.find((loc: EventLocation) => {
        const coord = loc.coordinate ?? loc.location;
        return (
          coord &&
          coord.latitude !== undefined &&
          coord.longitude !== undefined &&
          Math.abs(coord.latitude - focusLocation.latitude) < 0.01 &&
          Math.abs(coord.longitude - focusLocation.longitude) < 0.01
        );
      });
      if (eventMarker) {
        setSelectedMarker(eventMarker.id);
      }
    }
  }, [focusLocation, eventLocations]);

  return (
    <View style={styles.container}>
      {/* Map with markers */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        customMapStyle={getaroundMapStyle}
        showsUserLocation={false}
        followsUserLocation={false}
        onPress={(evt) => {
          handleMapPress(evt as any);
          const { coordinate } = evt.nativeEvent;

          if (selectMode) {
            // Original select mode behavior
            setCustomLocation({
              latitude: coordinate.latitude,
              longitude: coordinate.longitude,
            });
            setSelectMode(false);
            return;
          }

          // Interactive pin placement: camera follows tap, rings render there
          // Clear any old pins/markers and set new custom location
          setSelectedMarker(null); // Clear any selected event markers
          setCustomLocation({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
          });
          setRingCenter({
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
          });
          setRingSource("custom");

          // Move camera to follow the chosen location (40% less zoom total)
          if (mapRef.current) {
            mapRef.current.animateToRegion(
              {
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
                latitudeDelta: 0.014, // 40% larger than 0.01
                longitudeDelta: 0.014, // 40% larger than 0.01
              },
              1000
            );
          }
        }}
        showsMyLocationButton={false}
        showsBuildings={true}
        showsIndoors={true}
        showsPointsOfInterest={true}
        showsCompass={false}
        showsScale={false}
      >
        {/* Progressive dotted yellow rings - 1km, 2km, 3km */}
        {ringCenter ? (
          <>
            {/* 1km ring */}
            {generateDottedCircleSegments(ringCenter, 1000).map(
              (coordinates, index) => (
                <Polyline
                  key={`ring-1km-${index}`}
                  coordinates={coordinates}
                  strokeColor="rgba(255, 193, 7, 0.9)"
                  strokeWidth={3}
                />
              )
            )}
            {/* 2km ring */}
            {generateDottedCircleSegments(ringCenter, 2000).map(
              (coordinates, index) => (
                <Polyline
                  key={`ring-2km-${index}`}
                  coordinates={coordinates}
                  strokeColor="rgba(255, 193, 7, 0.7)"
                  strokeWidth={3}
                />
              )
            )}
            {/* 3km ring */}
            {generateDottedCircleSegments(ringCenter, 3000).map(
              (coordinates, index) => (
                <Polyline
                  key={`ring-3km-${index}`}
                  coordinates={coordinates}
                  strokeColor="rgba(255, 193, 7, 0.5)"
                  strokeWidth={3}
                />
              )
            )}
          </>
        ) : null}

        {/* Event location markers */}
        {eventLocations.map((location: EventLocation) => (
          <Marker
            key={location.id}
            coordinate={location.coordinate ?? location.location}
            onPress={() =>
              handleMarkerPress(
                location.id,
                location.coordinate ?? location.location
              )
            }
          >
            <View
              style={[
                location.title === "Total Prize"
                  ? styles.prizeBubble
                  : styles.markerContainer,
                selectedMarker === location.id &&
                  (location.title === "Total Prize"
                    ? styles.selectedPrizeBubble
                    : styles.selectedMarker),
              ]}
            >
              <Text
                style={
                  location.title === "Total Prize"
                    ? styles.prizeText
                    : styles.coinText
                }
              >
                💰{location.coins}
              </Text>
              <Text
                style={
                  location.title === "Total Prize"
                    ? styles.prizeTitleText
                    : styles.markerTitle
                }
              >
                {location.title}
              </Text>
              {location.title === "Total Prize" && (
                <View style={styles.bubbleTail} />
              )}
            </View>
          </Marker>
        ))}

        {/* Random coin markers */}
        {/* Only show random coins when user is a participant of the selected event */}
        {isParticipant && selectedEvent
          ? randomCoins.map((coin) => (
              <Marker
                key={coin.id}
                coordinate={coin.coordinate}
                onPress={() => handleMarkerPress(coin.id, coin.coordinate)}
              >
                <View style={styles.coinMarker}>
                  <Text style={styles.randomCoinText}>🪙</Text>
                </View>
              </Marker>
            ))
          : null}

        {/* Custom chosen location marker */}
        {customLocation ? (
          <Marker coordinate={customLocation} tracksViewChanges={false}>
            <View style={styles.customPin}>
              <Text style={styles.customPinText}>📍</Text>
            </View>
          </Marker>
        ) : null}

        {/* Current GPS location marker (blue dot with beat animation) */}
        {currentLocation ? (
          <Marker coordinate={currentLocation} tracksViewChanges={false}>
            <View style={styles.gpsLocationContainer}>
              {/* Pulsing outer ring */}
              <Animated.View
                style={[
                  styles.gpsLocationPulseRing,
                  {
                    transform: [{ scale: gpsLocationPulse }],
                    opacity: gpsLocationPulse.interpolate({
                      inputRange: [1, 1.3],
                      outputRange: [0.7, 0.2],
                    }),
                  },
                ]}
              />
              {/* Main GPS marker */}
              <View style={styles.gpsLocationMarker}>
                <View style={styles.gpsLocationDot} />
              </View>
            </View>
          </Marker>
        ) : null}

        {/* Custom user location marker (backup/fallback) */}
        {userLocation && !currentLocation ? (
          <Marker coordinate={userLocation} tracksViewChanges={false}>
            <View style={styles.userLocationMarker}>
              <View style={styles.userLocationDot} />
            </View>
          </Marker>
        ) : null}
      </MapView>

      {/* Zoom Controls - keep above info panel */}
      <View style={styles.zoomControls} pointerEvents="box-none">
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
          <Text style={styles.zoomText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
          <Text style={styles.zoomText}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.resetButton}
          onPress={async () => {
            // Request permission on Android
            if (Platform.OS === "android") {
              try {
                const granted = await PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                  Alert.alert(
                    "Location permission needed",
                    "Please enable location permission to center on your location.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Open Settings",
                        onPress: () => Linking.openSettings(),
                      },
                    ]
                  );
                  return;
                }
              } catch (e) {
                console.warn("Location permission error", e);
                return;
              }
            }

            if (userLocation) {
              centerOnUserNow();
            } else {
              Alert.alert(
                "Location not available",
                "We couldn't find your current location. Please ensure GPS is enabled."
              );
            }
          }}
        >
          <View style={styles.geoLocationIcon}>
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Selected marker info */}
      {selectedMarker && showEventSummary && (
        <View style={styles.markerInfo} pointerEvents="auto">
          {(() => {
            const selected = eventLocations.find(
              (loc: EventLocation) => loc.id === selectedMarker
            );
            const selectedCoin = randomCoins.find(
              (coin) => coin.id === selectedMarker
            );

            if (selected) {
              const radius = selected.radius;
              const interaction = selected.interactionType;
              const rewards = selected.rewards;
              return (
                <>
                  <Text style={styles.infoTitle}>{selected.title}</Text>
                  {selected.description ? (
                    <Text style={styles.infoDescription}>
                      {selected.description}
                    </Text>
                  ) : null}
                  {typeof (selected as any).coins !== "undefined" && (
                    <Text style={styles.infoCoins}>
                      Event Coins: 💰{(selected as any).coins}
                    </Text>
                  )}
                  <Text style={styles.infoMeta}>• Type: {selected.type}</Text>
                  <Text style={styles.infoMeta}>• Radius: {radius}m</Text>
                  <Text style={styles.infoMeta}>
                    • Interaction: {interaction}
                  </Text>
                  {rewards && (
                    <Text style={styles.infoMeta}>
                      • Rewards: {rewards.coins} coins, {rewards.experience} XP
                    </Text>
                  )}
                </>
              );
            } else if (selectedCoin) {
              return (
                <>
                  <Text style={styles.infoTitle}>Random Coin</Text>
                  <Text style={styles.infoDescription}>Collect this coin!</Text>
                  <Text style={styles.infoCoins}>
                    Value: 🪙{selectedCoin.value}
                  </Text>
                </>
              );
            }
            return null;
          })()}
        </View>
      )}

      {/* Event Summary Toggle Button */}
      <TouchableWithoutFeedback
        onPress={() => setShowEventSummary(!showEventSummary)}
      >
        <View style={styles.floatingButtonSecondary}>
          <Text style={styles.floatingButtonText}>
            {showEventSummary ? "Hide Info" : "Show Info"}
          </Text>
        </View>
      </TouchableWithoutFeedback>

      {/* Floating List Button */}
      <TouchableWithoutFeedback onPress={() => setActiveTab && setActiveTab()}>
        <View style={styles.floatingButton}>
          <Text style={styles.floatingButtonText}>≡ List</Text>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#181a20",
  },
  map: {
    flex: 1,
    width: "100%",
  },
  // Marker styles
  markerContainer: {
    backgroundColor: "#7B3FE4",
    padding: 8,
    borderRadius: 20,
    alignItems: "center",
    minWidth: 80,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  selectedMarker: {
    backgroundColor: "#FF6B6B",
    // Removed transform to prevent glitching
  },
  // Prize bubble (message bubble style)
  prizeBubble: {
    backgroundColor: "rgba(76, 175, 80, 0.8)", // Green color with transparency
    padding: 12,
    borderRadius: 20,
    alignItems: "center",
    minWidth: 100,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    borderWidth: 2,
    borderColor: "rgba(56, 142, 60, 0.9)", // Darker green border with transparency
    position: "relative",
  },
  selectedPrizeBubble: {
    backgroundColor: "rgba(255, 152, 0, 0.8)", // Orange when selected with transparency
    borderColor: "rgba(245, 124, 0, 0.9)",
  },
  prizeText: {
    color: "#FFD700", // Gold color for coins
    fontSize: 14,
    fontWeight: "bold",
  },
  prizeTitleText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 3,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  // Message bubble tail (on top)
  bubbleTail: {
    position: "absolute",
    top: -8, // Move to top
    left: "50%",
    marginLeft: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 8, // Point downward from top
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "rgba(76, 175, 80, 0.8)", // Match bubble color with transparency
  },
  coinText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "bold",
  },
  markerTitle: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 2,
  },
  // Random coin markers
  coinMarker: {
    backgroundColor: "#FFD700",
    padding: 4, // Smaller padding
    borderRadius: 12, // Smaller radius
    alignItems: "center",
    justifyContent: "center",
    width: 24, // Fixed width
    height: 24, // Fixed height
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#FFA500",
  },
  customPin: {
    backgroundColor: "#1C1C1C",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  customPinText: { color: "#EDEDED", fontWeight: "700" },
  // Custom user location marker
  userLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(33, 150, 243, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#2196F3",
  },
  userLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2196F3",
  },
  gpsLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(33, 150, 243, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#007AFF",
  },
  gpsLocationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
  gpsLocationContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  gpsLocationPulseRing: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 122, 255, 0.3)",
    borderWidth: 2,
    borderColor: "rgba(0, 122, 255, 0.5)",
  },
  randomCoinText: {
    fontSize: 12, // Smaller text
    textAlign: "center",
  },
  // Zoom controls
  zoomControls: {
    position: "absolute",
    bottom: 200, // Move to bottom
    right: 15, // Keep on right side
    alignItems: "center",
    zIndex: 20,
  },
  zoomButton: {
    backgroundColor: "rgba(33, 150, 243, 0.7)", // Blue instead of purple
    width: 40, // Smaller
    height: 40, // Smaller
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  zoomText: {
    color: "#fff",
    fontSize: 18, // Slightly smaller
    fontWeight: "bold",
  },
  resetButton: {
    backgroundColor: "rgba(76, 175, 80, 0.8)", // More transparent
    width: 45, // Slightly larger than zoom buttons
    height: 45,
    borderRadius: 22.5,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  resetText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "bold",
  },
  // Geolocation circular icon
  geoLocationIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  outerCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  // Marker info panel
  markerInfo: {
    position: "absolute",
    bottom: 180,
    left: 20,
    right: 20,
    backgroundColor: "#1e1e1e",
    padding: 16,
    borderRadius: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    zIndex: 10,
  },
  infoTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  infoDescription: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 8,
  },
  infoCoins: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
  },
  infoMeta: {
    color: "#bbb",
    fontSize: 12,
    marginTop: 4,
  },
  // Floating button
  floatingButton: {
    position: "absolute",
    bottom: 30, // Lower position
    alignSelf: "center",
    backgroundColor: "rgba(123, 63, 228, 0.8)", // More transparent
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 6,
    zIndex: 10,
  },
  floatingButtonSecondary: {
    position: "absolute",
    bottom: 100, // Higher position than main button
    alignSelf: "center",
    backgroundColor: "rgba(0, 122, 255, 0.8)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 6,
    zIndex: 10,
  },
  floatingButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default MapScreen;

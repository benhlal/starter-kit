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
import { FirebaseService } from "../../services/firebase/FirebaseService";
import { Coin } from "../../types";
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
import { useSelectedCoin } from "../../state/recoil/hooks";
import { CreateEventModal } from "../../components/Events/CreateEventModal/CreateEventModal";
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
  createOpen?: boolean;
  setCreateOpen?: (open: boolean) => void;
}> = ({ setActiveTab, focusLocation, createOpen = false, setCreateOpen }) => {
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
  const [showEventSummary] = useState<boolean>(true);
  const [eventCoins, setEventCoins] = useState<Coin[]>([]);
  const [creating, setCreating] = useState(false);

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
  const { setSelectedCoinId } = useSelectedCoin();
  const [centerOnUser, setCenterOnUser] = useRecoilState(mapCenterOnUserState);
  const [selectMode, setSelectMode] = useRecoilState(
    mapSelectLocationModeState
  );
  const [customLocation, setCustomLocation] = useRecoilState(
    mapCustomLocationState
  );
  const currentUserId = FirebaseService.getCurrentUser?.()?.uid;
  const isParticipant = (() => {
    const joined = Array.isArray((userProfile as any)?.joinedEvents)
      ? (userProfile as any).joinedEvents
      : [];
    const inProfile = joined.includes(selectedEvent?.id || "");
    const inEvent = Array.isArray((selectedEvent as any)?.participants)
      ? (selectedEvent as any).participants.includes(currentUserId)
      : false;
    return inProfile || inEvent;
  })();

  // Fetch coins for the selected event when active and user is participant
  useEffect(() => {
    let unsubscribed = false;
    (async () => {
      try {
        if (
          selectedEvent?.status === "active" &&
          isParticipant &&
          selectedEvent.id
        ) {
          const coins = await FirebaseService.getCoinsForEvent(
            selectedEvent.id
          );
          if (!unsubscribed) {
            setEventCoins(coins);
          }
        } else {
          setEventCoins([]);
        }
      } catch (e) {
        console.warn("Failed to load event coins", e);
      }
    })();
    return () => {
      unsubscribed = true;
    };
  }, [selectedEvent?.id, selectedEvent?.status, isParticipant]);

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
    // Always dismiss selected marker when tapping empty map area
    if (selectedMarker) {
      setSelectedMarker(null);
      return;
    }
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

        {/* Event coin markers (from Firestore) - show all event coins */}
        {eventCoins.map((coin) => (
          <Marker
            key={coin.id}
            coordinate={{
              latitude: coin.location.latitude,
              longitude: coin.location.longitude,
            }}
            onPress={() => {
              setSelectedCoinId(coin.id);
              handleMarkerPress(coin.id, {
                latitude: coin.location.latitude,
                longitude: coin.location.longitude,
              });
            }}
          >
            <View
              style={[
                styles.coinMarker,
                coin.collected && styles.coinMarkerCollected,
                !coin.collectible && styles.coinMarkerUnavailable,
              ]}
            >
              <Text style={styles.randomCoinText}>
                {coin.collected ? "✅" : coin.collectible ? "🪙" : "🔒"}
              </Text>
            </View>
          </Marker>
        ))}

        {/* Show coins from all events for reference (lighter style) */}
        {!selectedEvent &&
          eventLocations
            .filter((loc: EventLocation) => (loc as any).coins > 0)
            .map((eventLoc: EventLocation) => (
              <Marker
                key={`event-center-${eventLoc.id}`}
                coordinate={eventLoc.coordinate ?? eventLoc.location}
                onPress={() =>
                  handleMarkerPress(
                    eventLoc.id,
                    eventLoc.coordinate ?? eventLoc.location
                  )
                }
              >
                <View style={styles.eventCenterMarker}>
                  <Text style={styles.eventCenterText}>🎯</Text>
                  <Text style={styles.eventCenterCoins}>
                    {(eventLoc as any).coins}
                  </Text>
                </View>
              </Marker>
            ))}

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

      {/* Selected marker info - Enhanced event details */}
      {selectedMarker && showEventSummary && (
        <TouchableWithoutFeedback onPress={() => setSelectedMarker(null)}>
          <View style={styles.markerInfoOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.markerInfo} pointerEvents="auto">
                {(() => {
                  const selected = eventLocations.find(
                    (loc: EventLocation) => loc.id === selectedMarker
                  );
                  const selectedCoin = eventCoins.find(
                    (coin) => coin.id === selectedMarker
                  );
                  const selectedRandomCoin = randomCoins.find(
                    (coin) => coin.id === selectedMarker
                  );

                  if (selected) {
                    const radius = selected.radius;
                    const interaction = selected.interactionType;
                    const rewards = selected.rewards;
                    const eventCoinsCount = eventCoins.filter(
                      (coin) => !coin.collected && coin.collectible
                    ).length;
                    const totalEventCoins = eventCoins.length;
                    const participantCount = Array.isArray(
                      (selected as any).participants
                    )
                      ? (selected as any).participants.length
                      : 0;

                    return (
                      <>
                        <View style={styles.infoHeader}>
                          <Text style={styles.infoTitle}>{selected.title}</Text>
                          <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setSelectedMarker(null)}
                          >
                            <Text style={styles.closeButtonText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        {selected.description ? (
                          <Text style={styles.infoDescription}>
                            {selected.description}
                          </Text>
                        ) : null}

                        {/* Event Status */}
                        <View style={styles.infoSection}>
                          <Text style={styles.infoSectionTitle}>
                            📊 Event Status
                          </Text>
                          <Text style={styles.infoMeta}>
                            • Status: {(selected as any).status || "Unknown"}
                          </Text>
                          <Text style={styles.infoMeta}>
                            • Type: {selected.type}
                          </Text>
                          <Text style={styles.infoMeta}>
                            • Participants: {participantCount}
                          </Text>
                        </View>

                        {/* Coins Information */}
                        <View style={styles.infoSection}>
                          <Text style={styles.infoSectionTitle}>🪙 Coins</Text>
                          {typeof (selected as any).coins !== "undefined" && (
                            <Text style={styles.infoCoins}>
                              Total Coins: 💰{(selected as any).coins}
                            </Text>
                          )}
                          {totalEventCoins > 0 && (
                            <>
                              <Text style={styles.infoMeta}>
                                • Available: {eventCoinsCount}/{totalEventCoins}
                              </Text>
                              <Text style={styles.infoMeta}>
                                • Collected: {totalEventCoins - eventCoinsCount}
                                /{totalEventCoins}
                              </Text>
                            </>
                          )}
                        </View>

                        {/* Game Rules */}
                        <View style={styles.infoSection}>
                          <Text style={styles.infoSectionTitle}>
                            🎮 Game Rules
                          </Text>
                          <Text style={styles.infoMeta}>
                            • Radius: {radius}m
                          </Text>
                          <Text style={styles.infoMeta}>
                            • Interaction: {interaction}
                          </Text>
                          {rewards && (
                            <Text style={styles.infoMeta}>
                              • Rewards: {rewards.coins} coins,{" "}
                              {rewards.experience} XP
                            </Text>
                          )}
                        </View>

                        {/* Quick Actions */}
                        <View style={styles.infoActions}>
                          {isParticipant &&
                            (selected as any).status === "active" && (
                              <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => {
                                  // Navigate to AR hunt screen
                                  setSelectedMarker(null);
                                  // Add navigation logic here if needed
                                }}
                              >
                                <Text style={styles.actionButtonText}>
                                  🎯 Start Hunt
                                </Text>
                              </TouchableOpacity>
                            )}
                        </View>
                      </>
                    );
                  } else if (selectedCoin) {
                    return (
                      <>
                        <View style={styles.infoHeader}>
                          <Text style={styles.infoTitle}>Event Coin</Text>
                          <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setSelectedMarker(null)}
                          >
                            <Text style={styles.closeButtonText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.infoDescription}>
                          {selectedCoin.collected
                            ? "This coin has been collected!"
                            : selectedCoin.collectible
                            ? "Collect this coin in AR mode!"
                            : "This coin is not yet available"}
                        </Text>
                        <Text style={styles.infoCoins}>
                          Value: 🪙{selectedCoin.value || 10}
                        </Text>
                        {selectedCoin.name && (
                          <Text style={styles.infoMeta}>
                            Name: {selectedCoin.name}
                          </Text>
                        )}
                        <Text style={styles.infoMeta}>
                          Status:{" "}
                          {selectedCoin.collected
                            ? "Collected"
                            : selectedCoin.collectible
                            ? "Available"
                            : "Locked"}
                        </Text>
                      </>
                    );
                  } else if (selectedRandomCoin) {
                    return (
                      <>
                        <View style={styles.infoHeader}>
                          <Text style={styles.infoTitle}>Random Coin</Text>
                          <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setSelectedMarker(null)}
                          >
                            <Text style={styles.closeButtonText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={styles.infoDescription}>
                          Collect this coin!
                        </Text>
                        <Text style={styles.infoCoins}>
                          Value: 🪙{selectedRandomCoin.value}
                        </Text>
                      </>
                    );
                  }
                  return null;
                })()}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Floating List Button */}
      <TouchableWithoutFeedback onPress={() => setActiveTab && setActiveTab()}>
        <View style={styles.floatingButton}>
          <Text style={styles.floatingButtonText}>≡ List</Text>
        </View>
      </TouchableWithoutFeedback>

      {/* Create Event Here (at current location) */}
      {userLocation && setCreateOpen && (
        <TouchableOpacity
          style={[styles.floatingButton, styles.createEventButton]}
          onPress={() => {
            const user = FirebaseService.getCurrentUser?.();
            const userId = user?.uid;
            if (!userId) {
              Alert.alert("Not signed in", "Please sign in to create events.");
              return;
            }

            // Check if user has permission to create events
            const { getUserPermissions } = require("../../utils/userRoles");
            const canCreate = getUserPermissions(
              user?.email || null
            ).canCreateEvents;
            if (!canCreate) {
              Alert.alert(
                "Permission Required",
                "You don't have permission to create events."
              );
              return;
            }

            setCreateOpen(true);
          }}
        >
          <Text style={styles.floatingButtonText}>Create Event Here</Text>
        </TouchableOpacity>
      )}

      {/* Quick Create Ongoing Event */}
      {userLocation && (
        <TouchableOpacity
          style={[
            styles.floatingButton,
            styles.createOngoingEventButton,
            creating && styles.createEventButtonDisabled,
          ]}
          disabled={creating}
          onPress={async () => {
            try {
              if (!userLocation) {
                Alert.alert(
                  "GPS not ready",
                  "We couldn't get your current position yet."
                );
                return;
              }
              const user = FirebaseService.getCurrentUser?.();
              const userId = user?.uid;
              if (!userId) {
                Alert.alert(
                  "Not signed in",
                  "Please sign in to create events."
                );
                return;
              }

              // Check if user has permission to create events
              const { getUserPermissions } = require("../../utils/userRoles");
              const canCreate = getUserPermissions(
                user?.email || null
              ).canCreateEvents;
              if (!canCreate) {
                Alert.alert(
                  "Permission Required",
                  "You don't have permission to create events."
                );
                return;
              }

              setCreating(true);

              // Create ongoing event at current location
              // Create ongoing event at current location
              const eventData = {
                title: `Ongoing Hunt - ${new Date().toLocaleDateString()}`,
                description: "Ongoing treasure hunt created from map location",
                location: {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  address: "Current GPS location",
                  venue: "Current location",
                },
                createdBy: userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: "active" as const, // Create as active/ongoing
                participants: [userId],
                currentParticipants: 1,
                maxParticipants: 100,
                organizer: {
                  id: userId,
                  name: user?.displayName || user?.email || "Unknown",
                },
                tags: ["ongoing", "treasure-hunt", "map-created"],
                visibility: "public" as const,
                coins: 150,
                radius: 1000,
                interactionType: "tap",
                rewards: { coins: 75, experience: 40 },
                type: "treasure-hunt" as const,
                startDate: new Date().toISOString(),
                endDate: new Date(
                  Date.now() + 24 * 60 * 60 * 1000
                ).toISOString(), // 24 hours later
              };

              console.log("[MAP] Creating event with data:", eventData);
              const eventId = await FirebaseService.createEvent(eventData);
              console.log("[MAP] Event created with ID:", eventId);

              // Create 2 coins for this ongoing event
              const coinPromises = [];
              console.log("[MAP] Creating 2 coins for event:", eventId);
              for (let i = 0; i < 2; i++) {
                // Place coins randomly within 50 meters of the event location
                const distance = Math.random() * 50 + 10; // 10-60 meters
                const angle = Math.random() * 2 * Math.PI; // Random direction

                const metersPerDegLat = 111320;
                const metersPerDegLon =
                  metersPerDegLat *
                  Math.cos((userLocation.latitude * Math.PI) / 180);
                const offsetLat =
                  (distance * Math.cos(angle)) / metersPerDegLat;
                const offsetLon =
                  (distance * Math.sin(angle)) / metersPerDegLon;

                const coinLat = userLocation.latitude + offsetLat;
                const coinLon = userLocation.longitude + offsetLon;

                const coinData = {
                  eventId: eventId, // Link coin to this specific event
                  location: {
                    latitude: coinLat,
                    longitude: coinLon,
                  },
                  value: Math.floor(Math.random() * 100) + 50, // 50-149 points
                  material: ["coinCommon", "coinRare", "coinEpic"][
                    Math.floor(Math.random() * 3)
                  ],
                  name: `Event Coin ${i + 1}`,
                  collectible: true,
                  collected: false,
                  createdAt: new Date().toISOString(),
                  createdBy: userId,
                  type: "treasure",
                };

                console.log(`[MAP] Creating coin ${i + 1}:`, coinData);
                coinPromises.push(FirebaseService.createCoin(coinData));
              }

              // Wait for all coins to be created
              const createdCoins = await Promise.all(coinPromises);
              console.log("[MAP] All coins created:", createdCoins);
              console.log(
                `[EVENT_CREATION] Created ongoing event with 2 coins, eventId: ${eventId}`
              );

              // Refresh event locations
              await fetchEventLocations();

              // Focus on new event location
              setRingCenter({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              });
              setRingSource("event");

              Alert.alert(
                "Success",
                "Ongoing event created with 2 treasure coins at your current location! Use AR camera to find them."
              );
            } catch (e) {
              console.warn("Failed to create ongoing event", e);
              Alert.alert(
                "Create failed",
                "Could not create ongoing event here."
              );
            } finally {
              setCreating(false);
            }
          }}
        >
          <Text style={styles.floatingButtonText}>
            {creating ? "Creating…" : "Create Ongoing Event"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Create Coin Here (only if active event and participant) */}
      {isParticipant && selectedEvent?.status === "active" && (
        <TouchableOpacity
          style={[
            styles.floatingButton,
            styles.createCoinButton,
            creating && styles.createCoinButtonDisabled,
          ]}
          disabled={creating}
          onPress={async () => {
            try {
              if (!userLocation) {
                Alert.alert(
                  "GPS not ready",
                  "We couldn't get your current position yet."
                );
                return;
              }
              const user = FirebaseService.getCurrentUser?.();
              const userId = user?.uid;
              if (!userId) {
                Alert.alert("Not signed in", "Please sign in to create coins.");
                return;
              }
              setCreating(true);
              const id = await FirebaseService.createEventCoin({
                eventId: selectedEvent.id!,
                createdBy: userId,
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                value: 10,
              });
              // Refresh coins after creation
              const coins = await FirebaseService.getCoinsForEvent(
                selectedEvent.id!
              );
              setEventCoins(coins);
              setSelectedMarker(id);
              setRingCenter({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              });
              setRingSource("custom");
            } catch (e) {
              console.warn("Failed to create event coin", e);
              Alert.alert("Create failed", "Could not create coin here.");
            } finally {
              setCreating(false);
            }
          }}
        >
          <Text style={styles.floatingButtonText}>
            {creating ? "Creating…" : "Create Coin Here"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Create Event Modal */}
      {setCreateOpen && (
        <CreateEventModal
          isVisible={createOpen}
          onClose={() => setCreateOpen(false)}
          onEventCreated={async (eventId) => {
            // Refresh event locations after creation
            await fetchEventLocations();
            // Focus on the new event if we can find it
            const newEvent = eventLocations.find((e) => e.id === eventId);
            if (newEvent) {
              const coord = newEvent.coordinate ?? newEvent.location;
              setRingCenter(coord);
              setRingSource("event");
              // Zoom to the new event
              mapRef.current?.animateToRegion(
                {
                  ...coord,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                },
                1500
              );
            }
          }}
          initialLocation={
            userLocation
              ? {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  address: "Current location",
                }
              : undefined
          }
        />
      )}
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
  coinMarkerCollected: {
    backgroundColor: "#4CAF50", // Green for collected
    borderColor: "#388E3C",
  },
  coinMarkerUnavailable: {
    backgroundColor: "#9E9E9E", // Gray for unavailable
    borderColor: "#616161",
  },
  eventCenterMarker: {
    backgroundColor: "#FF5722", // Orange-red for event centers
    padding: 6,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 30,
    minHeight: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    borderWidth: 2,
    borderColor: "#D84315",
  },
  eventCenterText: {
    fontSize: 14,
    textAlign: "center",
  },
  eventCenterCoins: {
    color: "#FFF",
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 1,
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
  markerInfoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  markerInfo: {
    backgroundColor: "#1e1e1e",
    padding: 20,
    borderRadius: 16,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    maxWidth: "90%",
    maxHeight: "80%",
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  closeButton: {
    backgroundColor: "#333",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoSection: {
    marginBottom: 16,
  },
  infoSectionTitle: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  infoActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: "#7B3FE4",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 3,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
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
  floatingButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  createEventButton: {
    bottom: 150,
    backgroundColor: "rgba(76, 175, 80, 0.9)", // Green for event creation
  },
  createEventButtonDisabled: {
    backgroundColor: "rgba(76, 175, 80, 0.4)",
  },
  createCoinButton: {
    bottom: 90,
    backgroundColor: "rgba(123, 63, 228, 0.9)",
  },
  createCoinButtonDisabled: {
    backgroundColor: "rgba(123, 63, 228, 0.4)",
  },
  createOngoingEventButton: {
    bottom: 190,
    backgroundColor: "rgba(255, 152, 0, 0.9)", // Orange for ongoing events
  },
});

export default MapScreen;

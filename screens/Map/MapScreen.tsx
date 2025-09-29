import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Marker, Region } from "react-native-maps";
import {
  useEventLocations,
  useMapState,
  useUserProfile,
} from "../../state/recoil/hooks";
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
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  const { eventLocations, fetchEventLocations } = useEventLocations();
  const { selectedEvent } = useMapState();
  const { userProfile } = useUserProfile();
  const isParticipant = Array.isArray((userProfile as any)?.joinedEvents)
    ? (userProfile as any).joinedEvents.includes(selectedEvent?.id || "")
    : false; // Placeholder: real participant check when profile includes joined events

  useEffect(() => {
    fetchEventLocations();
  }, [fetchEventLocations]);

  const handleMarkerPress = (
    markerId: string,
    coordinate: { latitude: number; longitude: number }
  ) => {
    setSelectedMarker(markerId);
    // Zoom into the marker with smooth animation
    mapRef.current?.animateToRegion(
      {
        ...coordinate,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      1000
    );
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

  const handleResetView = () => {
    const resetRegion = {
      latitude: 48.8566,
      longitude: 2.3522,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
    setRegion(resetRegion);
    setSelectedMarker(null);
    mapRef.current?.animateToRegion(resetRegion, 1000);
  };

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
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsBuildings={true}
        showsIndoors={true}
        showsPointsOfInterest={true}
        showsCompass={false}
        showsScale={false}
      >
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
      </MapView>

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
          <Text style={styles.zoomText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
          <Text style={styles.zoomText}>−</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetButton} onPress={handleResetView}>
          <View style={styles.geoLocationIcon}>
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Selected marker info */}
      {selectedMarker && (
        <View style={styles.markerInfo}>
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
});

export default MapScreen;

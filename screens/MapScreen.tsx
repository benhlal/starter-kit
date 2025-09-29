import React from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
// ...existing code...

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
];

const MapScreen: React.FC<{ setActiveTab?: () => void }> = ({ setActiveTab }) => {

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 48.8566,
          longitude: 2.3522,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        customMapStyle={getaroundMapStyle}
      />

      {/* Floating List Button (switch to Events view) */}
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
  floatingButton: {
    position: "absolute",
    bottom: 120, // Same position as EventScreen
    alignSelf: "center",
    backgroundColor: "#7B3FE4",
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

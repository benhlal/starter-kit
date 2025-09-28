import React from "react";
import { View, Text, StyleSheet, TouchableWithoutFeedback } from "react-native";
import BottomNav from "../components/BottomNav/BottomNav";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";

type MapNav = StackNavigationProp<RootStackParamList, "Map">;

interface Props {
  navigation: MapNav;
}

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

const MapScreen: React.FC<Props> = ({ navigation }) => {
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

      {/* Floating List Button (match Map button style/position) */}
      <TouchableWithoutFeedback onPress={() => navigation.navigate("EVENTS")}>
        <View
          style={[
            styles.floatingButton,
            { opacity: 0.8, zIndex: 10, bottom: 145 },
          ]}
        >
          <Text style={styles.floatingButtonText}>≡ List</Text>
        </View>
      </TouchableWithoutFeedback>

      {/* Shared Bottom Navigation */}
      <BottomNav navigation={navigation} active="Map" />
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
    bottom: 70, // match EventScreen map button position
    alignSelf: "center",
    backgroundColor: "#7B3FE4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 6,
  },
  floatingButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default MapScreen;

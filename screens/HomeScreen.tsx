import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import ProfileScreen from "./ProfileScreen";
import EventScreen from "./EventScreen";
import MapScreen from "./MapScreen";
import BottomNav from "../components/BottomNav/BottomNav";

const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"Home" | "Account">("Home");
  const [showMap, setShowMap] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "Home" | "Account");
    setShowMap(false); // Hide map when switching main tabs
  };

  const handleMapToggle = () => {
    setShowMap(!showMap);
  };

  const renderCurrentScreen = () => {
    switch (activeTab) {
      case "Account":
        return <ProfileScreen />;
      case "Home":
      default:
        return (
          <View style={styles.content}>
            <EventScreen setActiveTab={handleMapToggle} />
            {/* Map is always rendered but hidden/shown with opacity */}
            <View style={[
              styles.mapOverlay, 
              { 
                opacity: showMap ? 1 : 0,
                pointerEvents: showMap ? 'auto' : 'none'
              }
            ]}>
              <MapScreen setActiveTab={handleMapToggle} />
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderCurrentScreen()}
      </View>
      <BottomNav active={activeTab} setActiveTab={handleTabChange} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  content: {
    flex: 1,
  },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
});

export default HomeScreen;

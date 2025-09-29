import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import ProfileScreen from "./ProfileScreen";
import EventScreen from "./EventScreen";
import MapScreen from "./MapScreen";
import BottomNav from "../components/BottomNav/BottomNav";

const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"Home" | "Account">("Home");
  const [showMap, setShowMap] = useState(false);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const [focusLocation, setFocusLocation] = useState<
    { latitude: number; longitude: number; title: string } | undefined
  >();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "Home" | "Account");
    // Hide map when switching tabs
    if (showMap) {
      setShowMap(false);
      setShouldRenderMap(false);
    }
  };

  const handleMapToggle = (location?: {
    latitude: number;
    longitude: number;
    title: string;
  }) => {
    if (!showMap) {
      // Set focus location if provided
      if (location) {
        setFocusLocation(location);
      }
      // Pre-render map off-screen first, then show instantly
      setShouldRenderMap(true);
      setTimeout(() => {
        setShowMap(true);
      }, 100); // Small delay to let map render off-screen
    } else {
      // Hide map instantly, then unmount
      setShowMap(false);
      setTimeout(() => {
        setShouldRenderMap(false);
        setFocusLocation(undefined); // Clear focus location
      }, 50);
    }
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
            {/* Pre-render off-screen, then show instantly without animation */}
            {shouldRenderMap && (
              <View
                style={[
                  styles.mapOverlay,
                  {
                    // Hide off-screen initially, then show in place
                    opacity: showMap ? 1 : 0,
                    pointerEvents: showMap ? "auto" : "none",
                  },
                ]}
              >
                <MapScreen
                  setActiveTab={handleMapToggle}
                  focusLocation={focusLocation}
                />
              </View>
            )}
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderCurrentScreen()}</View>
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

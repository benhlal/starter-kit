import React, { useState } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import ProfileScreen from "./ProfileScreen";
import EventScreen from "./EventScreen";
import MapScreen from "./MapScreen";
import BottomNav from "../components/BottomNav/BottomNav";

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"Home" | "Account">("Home");
  const [showMap, setShowMap] = useState(false);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const slideAnim = useState(new Animated.Value(width))[0]; // Start off-screen to the right

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "Home" | "Account");
    // Hide map when switching tabs
    if (showMap) {
      setShowMap(false);
      setShouldRenderMap(false);
      slideAnim.setValue(width); // Reset slide position
    }
  };

  const handleMapToggle = () => {
    if (!showMap) {
      // Pre-render map off-screen first, then slide in
      setShouldRenderMap(true);
      setTimeout(() => {
        setShowMap(true);
        Animated.timing(slideAnim, {
          toValue: 0, // Slide to normal position
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, 100); // Small delay to let map render off-screen
    } else {
      // Hide map: slide out to right
      setShowMap(false);
      Animated.timing(slideAnim, {
        toValue: width, // Slide off-screen to the right
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setShouldRenderMap(false); // Unmount after animation
        slideAnim.setValue(width); // Reset position for next time
      });
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
            {/* Pre-render map off-screen, then slide in */}
            {shouldRenderMap && (
              <Animated.View style={[
                styles.mapOverlay,
                {
                  transform: [{ translateX: slideAnim }],
                  // Hide interaction until slide-in starts
                  pointerEvents: showMap ? 'auto' : 'none'
                }
              ]}>
                <MapScreen setActiveTab={handleMapToggle} />
              </Animated.View>
            )}
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

import React, { useState } from "react";
import { View } from "react-native";
import ProfileScreen from "../Profile/ProfileScreen";
import EventScreen from "../Events/EventScreen";
import MapScreen from "../Map/MapScreen";
import BottomNav from "../../components/Home/BottomNav/BottomNav";
import { styles } from "./HomeScreen.styles";
import BottomSheet from "../../components/Filters/Sheet/BottomSheet";
import { StyleSheet } from "react-native";

const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"Home" | "Account">("Home");
  const [showMap, setShowMap] = useState(false);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
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
                  showMap ? styles.mapOverlayVisible : styles.mapOverlayHidden,
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
      <BottomNav
        active={activeTab}
        setActiveTab={handleTabChange}
        onCreateEvent={() => setCreateOpen(true)}
      />
      <BottomSheet
        visible={createOpen}
        title="Create Event"
        onClose={() => setCreateOpen(false)}
        maxHeightPercent={0.5}
      >
        {/* Fancy create dialog content placeholder */}
        <View style={createStyles.wrap}>
          <View style={createStyles.card}>
            <View style={createStyles.rowBetween}>
              <View>
                <View style={createStyles.shimmerShort} />
                <View style={createStyles.shimmerLong} />
              </View>
              <View style={createStyles.thumb} />
            </View>
          </View>
          <View style={createStyles.card}>
            <View style={createStyles.shimmerMid} />
            <View style={createStyles.shimmerWide} />
          </View>
        </View>
      </BottomSheet>
    </View>
  );
};

export default HomeScreen;

const createStyles = StyleSheet.create({
  wrap: { gap: 12 },
  card: { backgroundColor: "#1C1C1C", padding: 12, borderRadius: 10 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shimmerShort: {
    height: 8,
    width: 120,
    backgroundColor: "#2A2A2A",
    borderRadius: 4,
    marginBottom: 8,
  },
  shimmerLong: {
    height: 8,
    width: 200,
    backgroundColor: "#2A2A2A",
    borderRadius: 4,
  },
  thumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: "#2A2A2A" },
  shimmerMid: {
    height: 8,
    width: 160,
    backgroundColor: "#2A2A2A",
    borderRadius: 4,
    marginBottom: 8,
  },
  shimmerWide: {
    height: 8,
    width: 260,
    backgroundColor: "#2A2A2A",
    borderRadius: 4,
  },
});

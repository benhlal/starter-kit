import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
// ...existing code...
import ProfileScreen from "./ProfileScreen";
import ARScreen from "./ARScreen";
import EventScreen from "./EventScreen";
import MapScreen from "./MapScreen";
import BottomNav from "../components/BottomNav/BottomNav";

const HomeContent: React.FC = () => (
  <View style={styles.content}>{/* Home tab content goes here */}</View>
);

const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "Home" | "Search" | "Profile" | "Map" | "EVENTS" | "AR"
  >("EVENTS");

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "Home" | "Search" | "Profile" | "Map" | "EVENTS" | "AR");
  };

  const renderCurrentScreen = () => {
    switch (activeTab) {
      case "Profile":
        return <ProfileScreen />;
      case "Map":
        return <MapScreen setActiveTab={handleTabChange} />;
      case "EVENTS":
        return <EventScreen setActiveTab={handleTabChange} />;
      case "AR":
        return <ARScreen />;
      case "Home":
      default:
        return <HomeContent />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {renderCurrentScreen()}
      </View>
      <BottomNav active={activeTab} setActiveTab={setActiveTab} />
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
});

export default HomeScreen;

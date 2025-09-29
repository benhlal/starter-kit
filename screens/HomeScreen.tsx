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
  >("Home");

  let ScreenComponent: React.FC;
  switch (activeTab) {
    // ...existing code...
    case "Profile":
      ScreenComponent = ProfileScreen;
      break;
    case "Map":
      ScreenComponent = MapScreen;
      break;
    case "EVENTS":
      ScreenComponent = EventScreen;
      break;
    case "AR":
      ScreenComponent = ARScreen;
      break;
    case "Home":
    default:
      ScreenComponent = HomeContent;
      break;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ScreenComponent />
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

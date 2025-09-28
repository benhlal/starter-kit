import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  active?: "Home" | "Profile" | "Account" | "Map" | "EVENTS" | "Search";
  setActiveTab: (
    tab: "Home" | "Profile" | "Account" | "Map" | "EVENTS" | "Search"
  ) => void;
}

const BottomNav: React.FC<Props> = ({ active, setActiveTab }) => (
  <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
    <View style={styles.bottomNav}>
      {/* Home/Search tab */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => setActiveTab("Home")}
      >
        <Text style={[styles.navText, active === "Home" && styles.activeText]}>
          Search
        </Text>
      </TouchableOpacity>

      {/* Rentals */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => setActiveTab("Profile")}
      >
        <Text
          style={[styles.navText, active === "Profile" && styles.activeText]}
        >
          Rentals
        </Text>
      </TouchableOpacity>

      {/* Account */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => setActiveTab("Account")}
      >
        <Text
          style={[styles.navText, active === "Account" && styles.activeText]}
        >
          Account
        </Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#1e1e1e",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#1e1e1e",
    paddingVertical: 16,
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
  },
  navText: {
    color: "#aaa",
    fontWeight: "600",
    fontSize: 14,
  },
  activeText: {
    color: "#7B3FE4",
    fontWeight: "bold",
  },
});

export default BottomNav;

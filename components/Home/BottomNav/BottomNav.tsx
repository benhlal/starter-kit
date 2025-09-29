import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  active?: "Home" | "Account";
  setActiveTab: (tab: "Home" | "Account") => void;
  onCreateEvent?: () => void;
}

const BottomNav: React.FC<Props> = ({
  active,
  setActiveTab,
  onCreateEvent,
}) => (
  <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
    <View style={styles.bottomNav}>
      {/* Home tab (Events) */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => setActiveTab("Home")}
      >
        <Text style={[styles.icon, active === "Home" && styles.activeText]}>
          🏠
        </Text>
        <Text style={[styles.navText, active === "Home" && styles.activeText]}>
          Home
        </Text>
      </TouchableOpacity>

      {/* Create Event (center) */}
      <TouchableOpacity
        style={styles.createButton}
        onPress={onCreateEvent}
        accessibilityLabel="Create event"
      >
        <Text style={styles.createPlus}>＋</Text>
      </TouchableOpacity>

      {/* Account tab */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => setActiveTab("Account")}
      >
        <Text style={[styles.icon, active === "Account" && styles.activeText]}>
          👤
        </Text>
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
    paddingVertical: 10,
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 0,
  },
  icon: { fontSize: 16, color: "#aaa", marginBottom: 2 },
  navText: {
    color: "#aaa",
    fontWeight: "600",
    fontSize: 11,
  },
  activeText: {
    color: "#7B3FE4",
    fontWeight: "bold",
  },
  createButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7B3FE4",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    marginTop: -6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  createPlus: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 26,
  },
});

export default BottomNav;

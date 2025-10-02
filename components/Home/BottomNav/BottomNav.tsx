import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  active?: "Home" | "Account";
  setActiveTab: (tab: "Home" | "Account") => void;
  onCreateEvent?: () => void;
  // When true, show the center "+" create button (admins only)
  canCreateEvents?: boolean;
  // Open AR collect flow
  onCollect?: () => void;
}

const BottomNav: React.FC<Props> = ({
  active,
  setActiveTab,
  onCreateEvent,
  canCreateEvents = false,
  onCollect,
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

      {/* Center: Collect AR coins (tap). If admin, long-press opens Create Event. */}
      <TouchableOpacity
        style={styles.navButton}
        onPress={onCollect}
        onLongPress={canCreateEvents ? onCreateEvent : undefined}
        accessibilityLabel={
          canCreateEvents ? "Collect (long-press to create)" : "Collect"
        }
      >
        <Text style={styles.icon}>📷</Text>
        <Text style={styles.navText}>Collect</Text>
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
});

export default BottomNav;

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../App";
import { SafeAreaView } from "react-native-safe-area-context";

type NavProp = StackNavigationProp<RootStackParamList>;

interface Props {
  navigation: NavProp;
  active?: "EVENTS" | "Map" | "Profile" | "Search";
}

const BottomNav: React.FC<Props> = ({ navigation, active }) => (
  <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate("EVENTS")}
      >
        <Text
          style={[styles.navText, active === "EVENTS" && styles.activeText]}
        >
          Search
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate("Profile")}
      >
        <Text
          style={[styles.navText, active === "Profile" && styles.activeText]}
        >
          Rentals
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => navigation.navigate("Profile")}
      >
        <Text
          style={[styles.navText, active === "Profile" && styles.activeText]}
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
    paddingVertical: 18,
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  navButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  navText: {
    color: "#aaa",
    fontWeight: "bold",
    fontSize: 14,
  },
  activeText: {
    color: "#7B3FE4",
  },
});

export default BottomNav;

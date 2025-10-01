import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";

interface TopSearchProps {
  locationLabel?: string;
  whenLabel?: string;
  onPressLocation?: () => void;
  onPressWhen?: () => void;
  visible?: boolean;
  animatedValue?: Animated.Value;
  topOffset?: number; // allow screens to shift down if needed
}

const TopSearch: React.FC<TopSearchProps> = ({
  locationLabel = "Paris, France",
  whenLabel = "When?",
  onPressLocation,
  onPressWhen,
  visible = true,
  animatedValue,
  topOffset,
}) => {
  const containerStyle = [
    styles.container,
    topOffset != null ? { top: topOffset } : null,
    visible ? styles.visible : styles.hidden,
  ] as any;

  const animatedStyle = animatedValue
    ? {
        opacity: animatedValue,
        transform: [
          {
            translateY: animatedValue.interpolate({
              inputRange: [0, 1],
              outputRange: [-12, 0],
            }),
          },
        ],
      }
    : {};

  return (
    <Animated.View
      style={[containerStyle, animatedStyle]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.pill, styles.pillLarge]}
          onPress={onPressLocation}
        >
          <Text style={styles.icon}>📍</Text>
          <Text style={styles.pillText} numberOfLines={1} ellipsizeMode="tail">
            {locationLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pill} onPress={onPressWhen}>
          <Text style={[styles.icon, styles.iconAccent]}>🗓️</Text>
          <Text
            style={[styles.pillText, styles.accentText]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {whenLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 40,
    left: 12,
    right: 12,
    zIndex: 30,
  },
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
  row: { flexDirection: "row", gap: 8 },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1C",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  pillLarge: { flex: 1.4 },
  icon: { fontSize: 14, marginRight: 8, color: "#A0A0A0" },
  iconAccent: { color: "#D946EF" },
  pillText: { color: "#EDEDED", fontWeight: "700" },
  accentText: { color: "#D946EF" },
});

export default TopSearch;

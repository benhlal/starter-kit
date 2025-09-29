/* eslint-disable linebreak-style */
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";

export type FilterChip = {
  id: string;
  label: string;
  onPress?: () => void;
};

interface FloatingFiltersProps {
  chips: FilterChip[];
  visible: boolean;
  animatedValue?: Animated.Value;
}

export const FloatingFilters: React.FC<FloatingFiltersProps> = ({
  chips,
  visible,
  animatedValue,
}) => {
  const containerStyle = [
    styles.container,
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
        {chips.map((chip) => (
          <TouchableOpacity
            key={chip.id}
            style={styles.chip}
            activeOpacity={0.8}
            onPress={chip.onPress}
          >
            <Text style={styles.chipText}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 8,
    left: 12,
    right: 12,
    zIndex: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  visible: { opacity: 1 },
  hidden: { opacity: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  chip: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3A3A3A",
    marginHorizontal: 4,
  },
  chipText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

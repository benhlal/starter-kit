import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet from "../Sheet/BottomSheet";
import type { TimeStatus } from "../../../types";

interface VehicleTypeModalProps {
  visible: boolean;
  timeValue?: TimeStatus;
  onClose: () => void;
  onSelectTime?: (t: TimeStatus) => void;
}

// Removed vehicle type options; keep only time categories

const TIME_OPTIONS: { key: TimeStatus; label: string }[] = [
  { key: "any", label: "Any time" },
  { key: "ongoing", label: "Ongoing" },
  { key: "upcoming", label: "Upcoming" },
  { key: "expired", label: "Expired" },
];

export const VehicleTypeModal: React.FC<VehicleTypeModalProps> = ({
  visible,
  timeValue = "any",
  onClose,
  onSelectTime,
}) => {
  return (
    <BottomSheet visible={visible} title="Type" onClose={onClose}>
      <View style={styles.list}>
        <Text style={styles.sectionTitle}>Time</Text>
        {TIME_OPTIONS.map((opt) => {
          const selected = opt.key === timeValue;
          const handlePress = () => {
            if (onSelectTime) {
              onSelectTime(opt.key);
            }
          };
          return (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.row,
                styles.timeRow,
                selected && styles.rowSelected,
              ]}
              onPress={handlePress}
              disabled={!onSelectTime}
            >
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  list: { paddingVertical: 8 },
  row: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#1C1C1C",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  rowSelected: {
    borderColor: "#A64DFF",
  },
  label: { color: "#EDEDED", fontSize: 16, fontWeight: "600" },
  labelSelected: { color: "#FFFFFF" },
  sectionTitle: {
    color: "#A0A0A0",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
  },
  timeRow: {
    opacity: 0.9,
  },
});

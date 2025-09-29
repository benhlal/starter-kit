import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet from "../Sheet/BottomSheet";
import type { VehicleType } from "../../../types";

interface VehicleTypeModalProps {
  visible: boolean;
  value: VehicleType;
  onClose: () => void;
  onSelect: (v: VehicleType) => void;
}

const OPTIONS: { key: VehicleType; label: string }[] = [
  { key: "any", label: "Any" },
  { key: "city", label: "City" },
  { key: "suv", label: "SUV" },
  { key: "van", label: "Van" },
  { key: "electric", label: "Electric" },
  { key: "luxury", label: "Luxury" },
];

export const VehicleTypeModal: React.FC<VehicleTypeModalProps> = ({
  visible,
  value,
  onClose,
  onSelect,
}) => {
  return (
    <BottomSheet visible={visible} title="Vehicle type" onClose={onClose}>
      <View style={styles.list}>
        {OPTIONS.map((opt) => {
          const selected = opt.key === value;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[styles.row, selected && styles.rowSelected]}
              onPress={() => onSelect(opt.key)}
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
});

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet from "../Sheet/BottomSheet";
import type { PickupMethod } from "../../../types";

interface PickupMethodModalProps {
  visible: boolean;
  value: PickupMethod;
  onClose: () => void;
  onSelect: (v: PickupMethod) => void;
}

const OPTIONS: { key: PickupMethod; label: string; hint?: string }[] = [
  { key: "any", label: "Any" },
  { key: "meet-owner", label: "Meet the owner" },
  { key: "connect", label: "Connect (keyless)" },
];

export const PickupMethodModal: React.FC<PickupMethodModalProps> = ({
  visible,
  value,
  onClose,
  onSelect,
}) => {
  return (
    <BottomSheet visible={visible} title="Pickup method" onClose={onClose}>
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

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch } from "react-native";
import BottomSheet from "../Sheet/BottomSheet";
import type { FeatureKey } from "../../../types";

interface MoreFiltersModalProps {
  visible: boolean;
  instantBooking: boolean;
  seatsMin: number;
  newCarsOnly: boolean;
  features: FeatureKey[];
  onClose: () => void;
  onChange: (
    changes: Partial<{
      instantBooking: boolean;
      seatsMin: number;
      newCarsOnly: boolean;
      features: FeatureKey[];
    }>
  ) => void;
}

const FEATURE_OPTIONS: { key: FeatureKey; label: string }[] = [
  { key: "child-seat", label: "Child seat" },
  { key: "gps", label: "GPS" },
  { key: "air-conditioning", label: "Air conditioning" },
  { key: "bike-rack", label: "Bike rack" },
  { key: "roof-box", label: "Roof box" },
];

export const MoreFiltersModal: React.FC<MoreFiltersModalProps> = ({
  visible,
  instantBooking,
  seatsMin,
  newCarsOnly,
  features,
  onClose,
  onChange,
}) => {
  const toggleFeature = (key: FeatureKey) => {
    const set = new Set<FeatureKey>(features);
    if (set.has(key)) {
      set.delete(key);
    } else {
      set.add(key);
    }
    onChange({ features: Array.from(set) });
  };

  const Footer = (
    <View style={styles.footerRow}>
      <TouchableOpacity
        style={[styles.ctaBtn, styles.clearBtn]}
        onPress={onClose}
      >
        <Text style={[styles.ctaText, styles.clearText]}>Close</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.ctaBtn, styles.primaryBtn]}
        onPress={onClose}
      >
        <Text style={styles.ctaText}>Show results</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <BottomSheet
      visible={visible}
      title="More filters"
      onClose={onClose}
      footer={Footer}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instant booking</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.muted}>
            Vehicles bookable without owner approval
          </Text>
          <Switch
            value={instantBooking}
            onValueChange={(v) => onChange({ instantBooking: v })}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Number of seats</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => onChange({ seatsMin: Math.max(1, seatsMin - 1) })}
          >
            <Text style={styles.counterText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.counterValue}>{seatsMin}</Text>
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => onChange({ seatsMin: seatsMin + 1 })}
          >
            <Text style={styles.counterText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>New cars only</Text>
          <Switch
            value={newCarsOnly}
            onValueChange={(v) => onChange({ newCarsOnly: v })}
          />
        </View>
        <Text style={styles.muted}>Manufactured in the last 5 years</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <View style={styles.chipsWrap}>
          {FEATURE_OPTIONS.map((f) => {
            const selected = features.includes(f.key);
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleFeature(f.key)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSel]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  section: { paddingVertical: 12 },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  muted: { color: "#A0A0A0" },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  counterRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  counterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2A2A2A",
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  counterText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  counterValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginHorizontal: 12,
  },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: "#1C1C1C",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: { borderColor: "#A64DFF" },
  chipText: { color: "#EDEDED", fontWeight: "600" },
  chipTextSel: { color: "#FFFFFF" },
  footerRow: {
    flexDirection: "row",
    gap: 12,
  },
  ctaBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtn: {
    backgroundColor: "#1C1C1C",
    borderWidth: 1,
    borderColor: "#373737",
  },
  primaryBtn: {
    backgroundColor: "#D946EF",
  },
  ctaText: { color: "#FFFFFF", fontWeight: "700" },
  clearText: { color: "#E0E0E0" },
});

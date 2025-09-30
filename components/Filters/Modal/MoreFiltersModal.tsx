import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch } from "react-native";
import BottomSheet from "../Sheet/BottomSheet";

interface MoreFiltersModalProps {
  visible: boolean;
  subscribedOnly: boolean;
  participantsMin: number;
  newEventsOnly: boolean;
  cities: string[];
  onClose: () => void;
  onChange: (
    changes: Partial<{
      subscribedOnly: boolean;
      participantsMin: number;
      newEventsOnly: boolean;
      cities: string[];
    }>
  ) => void;
}

const CITY_OPTIONS: string[] = [
  "Paris",
  "London",
  "Berlin",
  "New York",
  "Tokyo",
  "Sydney",
  "Marrakesh",
  "Casablanca",
];

export const MoreFiltersModal: React.FC<MoreFiltersModalProps> = ({
  visible,
  subscribedOnly,
  participantsMin,
  newEventsOnly,
  cities,
  onClose,
  onChange,
}) => {
  const toggleCity = (name: string) => {
    const set = new Set<string>(cities);
    if (set.has(name)) {
      set.delete(name);
    } else {
      set.add(name);
    }
    onChange({ cities: Array.from(set) });
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
        <Text style={styles.sectionTitle}>Events I'm subscribed to</Text>
        <View style={styles.rowBetween}>
          <Text style={styles.muted}>Show only events you've joined</Text>
          <Switch
            value={subscribedOnly}
            onValueChange={(v) => onChange({ subscribedOnly: v })}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Number of participants</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() =>
              onChange({ participantsMin: Math.max(0, participantsMin - 10) })
            }
          >
            <Text style={styles.counterText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.counterValue}>{participantsMin}</Text>
          <TouchableOpacity
            style={styles.counterBtn}
            onPress={() => onChange({ participantsMin: participantsMin + 10 })}
          >
            <Text style={styles.counterText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>New events only</Text>
          <Switch
            value={newEventsOnly}
            onValueChange={(v) => onChange({ newEventsOnly: v })}
          />
        </View>
        <Text style={styles.muted}>Created within the last 7 days</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cities</Text>
        <View style={styles.chipsWrap}>
          {CITY_OPTIONS.map((city) => {
            const selected = cities.includes(city);
            return (
              <TouchableOpacity
                key={city}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleCity(city)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSel]}>
                  {city}
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

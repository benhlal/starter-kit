import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { FilterModal } from "./FilterModal";
import type { EventStatusFilter } from "../../../types";

interface StatusFilterModalProps {
  visible: boolean;
  value: EventStatusFilter;
  onClose: () => void;
  onSelect: (status: EventStatusFilter) => void;
}

const statusOptions = [
  {
    value: "any" as const,
    label: "Any Status",
    icon: "🔄",
    description: "Show all events",
  },
  {
    value: "ongoing" as const,
    label: "Ongoing",
    icon: "🟢",
    description: "Currently active events",
  },
  {
    value: "upcoming" as const,
    label: "Upcoming",
    icon: "⏳",
    description: "Events starting soon",
  },
  {
    value: "completed" as const,
    label: "Completed",
    icon: "✅",
    description: "Finished events",
  },
];

export const StatusFilterModal: React.FC<StatusFilterModalProps> = ({
  visible,
  value,
  onClose,
  onSelect,
}) => {
  const handleStatusSelect = (status: EventStatusFilter) => {
    onSelect(status);
    onClose();
  };

  const renderStatusItem = (option: (typeof statusOptions)[0]) => {
    const isSelected = value === option.value;

    return (
      <TouchableOpacity
        key={option.value}
        style={[styles.statusItem, isSelected && styles.statusItemSelected]}
        onPress={() => handleStatusSelect(option.value)}
      >
        <View style={styles.statusContent}>
          <View style={styles.statusIcon}>
            <Text style={styles.statusIconText}>{option.icon}</Text>
          </View>
          <View style={styles.statusTextContainer}>
            <Text
              style={[
                styles.statusLabel,
                isSelected && styles.statusLabelSelected,
              ]}
            >
              {option.label}
            </Text>
            <Text style={styles.statusDescription}>{option.description}</Text>
          </View>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FilterModal visible={visible} title="Event Status" onClose={onClose}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.sectionTitle}>
            Filter events by their current status
          </Text>

          <View style={styles.statusList}>
            {statusOptions.map(renderStatusItem)}
          </View>
        </View>
      </ScrollView>
    </FilterModal>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 400,
  },
  container: {
    paddingVertical: 8,
  },
  sectionTitle: {
    color: "#A0A0A0",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  statusList: {
    gap: 8,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  statusItemSelected: {
    backgroundColor: "#2A2A2A",
    borderColor: "#D946EF",
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statusIconText: {
    fontSize: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusLabel: {
    color: "#EDEDED",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  statusLabelSelected: {
    color: "#D946EF",
  },
  statusDescription: {
    color: "#A0A0A0",
    fontSize: 13,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#D946EF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});

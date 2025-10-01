import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { FilterModal } from "./FilterModal";
import type { TimePreset, DateRange } from "../../../types";

interface TimeFilterModalProps {
  visible: boolean;
  timePreset: TimePreset;
  customDateRange?: DateRange;
  onClose: () => void;
  onSelectPreset: (preset: TimePreset) => void;
  onSelectDateRange: (range: DateRange) => void;
}

const timePresetOptions = [
  {
    value: "anytime" as const,
    label: "Anytime",
    icon: "🌐",
    description: "No time restrictions",
  },
  {
    value: "today" as const,
    label: "Today",
    icon: "📅",
    description: "Events happening today",
  },
  {
    value: "tomorrow" as const,
    label: "Tomorrow",
    icon: "📆",
    description: "Events happening tomorrow",
  },
  {
    value: "this-week" as const,
    label: "This Week",
    icon: "📊",
    description: "Events this week",
  },
  {
    value: "next-week" as const,
    label: "Next Week",
    icon: "⏭️",
    description: "Events next week",
  },
  {
    value: "this-month" as const,
    label: "This Month",
    icon: "🗓️",
    description: "Events this month",
  },
  {
    value: "custom" as const,
    label: "Custom Period",
    icon: "⚙️",
    description: "Choose specific dates",
  },
];

export const TimeFilterModal: React.FC<TimeFilterModalProps> = ({
  visible,
  timePreset,
  customDateRange,
  onClose,
  onSelectPreset,
  onSelectDateRange,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempStartDate, _setTempStartDate] = useState(
    customDateRange?.startDate || new Date().toISOString().split("T")[0]
  );
  const [tempEndDate, _setTempEndDate] = useState(
    customDateRange?.endDate || new Date().toISOString().split("T")[0]
  );

  const handlePresetSelect = (preset: TimePreset) => {
    if (preset === "custom") {
      setShowDatePicker(true);
    } else {
      onSelectPreset(preset);
      onClose();
    }
  };

  const handleDateRangeConfirm = () => {
    onSelectDateRange({
      startDate: tempStartDate,
      endDate: tempEndDate,
    });
    onSelectPreset("custom");
    setShowDatePicker(false);
    onClose();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderPresetItem = (option: (typeof timePresetOptions)[0]) => {
    const isSelected = timePreset === option.value;

    return (
      <TouchableOpacity
        key={option.value}
        style={[styles.presetItem, isSelected && styles.presetItemSelected]}
        onPress={() => handlePresetSelect(option.value)}
      >
        <View style={styles.presetContent}>
          <View style={styles.presetIcon}>
            <Text style={styles.presetIconText}>{option.icon}</Text>
          </View>
          <View style={styles.presetTextContainer}>
            <Text
              style={[
                styles.presetLabel,
                isSelected && styles.presetLabelSelected,
              ]}
            >
              {option.label}
            </Text>
            <Text style={styles.presetDescription}>{option.description}</Text>
            {option.value === "custom" && customDateRange && (
              <Text style={styles.customRangeText}>
                {formatDate(customDateRange.startDate)} -{" "}
                {formatDate(customDateRange.endDate)}
              </Text>
            )}
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

  if (showDatePicker) {
    return (
      <FilterModal
        visible={visible}
        title="Custom Date Range"
        onClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerContainer}>
          <Text style={styles.sectionTitle}>Choose your date range</Text>

          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>From</Text>
            <TouchableOpacity style={styles.dateInput}>
              <Text style={styles.dateInputText}>
                {formatDate(tempStartDate)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>To</Text>
            <TouchableOpacity style={styles.dateInput}>
              <Text style={styles.dateInputText}>
                {formatDate(tempEndDate)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.datePickerButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleDateRangeConfirm}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </FilterModal>
    );
  }

  return (
    <FilterModal visible={visible} title="When" onClose={onClose}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.sectionTitle}>
            Choose when events should occur
          </Text>

          <View style={styles.presetList}>
            {timePresetOptions.map(renderPresetItem)}
          </View>
        </View>
      </ScrollView>
    </FilterModal>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: 500,
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
  presetList: {
    gap: 8,
  },
  presetItem: {
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
  presetItemSelected: {
    backgroundColor: "#2A2A2A",
    borderColor: "#D946EF",
  },
  presetContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  presetIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  presetIconText: {
    fontSize: 16,
  },
  presetTextContainer: {
    flex: 1,
  },
  presetLabel: {
    color: "#EDEDED",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  presetLabelSelected: {
    color: "#D946EF",
  },
  presetDescription: {
    color: "#A0A0A0",
    fontSize: 13,
  },
  customRangeText: {
    color: "#D946EF",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
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
  // Date picker styles
  datePickerContainer: {
    paddingVertical: 16,
  },
  dateInputContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    color: "#EDEDED",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  dateInputText: {
    color: "#EDEDED",
    fontSize: 16,
  },
  datePickerButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#A0A0A0",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#D946EF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

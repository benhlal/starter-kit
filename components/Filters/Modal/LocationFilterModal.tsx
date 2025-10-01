import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { FilterModal } from "./FilterModal";
import { useLocationFilter } from "../../../state/recoil/hooks";

interface LocationFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onCurrentLocation?: () => void;
  onChooseOnMap?: () => void;
}

export const LocationFilterModal: React.FC<LocationFilterModalProps> = ({
  visible,
  onClose,
  onCurrentLocation,
  onChooseOnMap,
}) => {
  const { selectedLocation, availableLocations, setSelectedLocation } =
    useLocationFilter();

  const handleLocationSelect = (location: string) => {
    if (location === "Current Location") {
      setSelectedLocation(location);
      onCurrentLocation?.();
      onClose();
    } else if (location === "Choose on Map") {
      setSelectedLocation(location);
      onChooseOnMap?.();
      onClose();
    } else {
      setSelectedLocation(location);
      onClose();
    }
  };

  const renderLocationItem = (location: string) => {
    const isSelected = selectedLocation === location;

    const getLocationIcon = (loc: string) => {
      if (loc === "anywhere") {
        return "🌍";
      }
      if (loc === "Current Location") {
        return "📍";
      }
      if (loc === "Choose on Map") {
        return "🗺️";
      }
      return "📍";
    };

    const getLocationLabel = (loc: string) => {
      if (loc === "anywhere") {
        return "Anywhere";
      }
      return loc;
    };

    return (
      <TouchableOpacity
        key={location}
        style={[styles.locationItem, isSelected && styles.locationItemSelected]}
        onPress={() => handleLocationSelect(location)}
      >
        <View style={styles.locationContent}>
          <Text style={styles.locationIcon}>{getLocationIcon(location)}</Text>
          <Text
            style={[
              styles.locationText,
              isSelected && styles.locationTextSelected,
            ]}
          >
            {getLocationLabel(location)}
          </Text>
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
    <FilterModal visible={visible} title="Choose Location" onClose={onClose}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Text style={styles.sectionTitle}>
            Select a location to filter events
          </Text>

          <View style={styles.locationsList}>
            {availableLocations.map(renderLocationItem)}
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
  locationsList: {
    gap: 2,
  },
  locationItem: {
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
  locationItemSelected: {
    backgroundColor: "#2A2A2A",
    borderColor: "#D946EF",
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  locationText: {
    color: "#EDEDED",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  locationTextSelected: {
    color: "#D946EF",
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

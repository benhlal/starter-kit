import React, { useMemo, useRef, useState } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { EventList } from "../../components/Events/EventList";
import { FloatingButton } from "../../components/Home/FloatingButton";
import { events } from "../../utils/constants";
import { FocusLocation } from "../../types";
import {
  FloatingFilters,
  FilterChip,
} from "../../components/Filters/FloatingFilters/FloatingFilters";
// import { styles } from "./EventScreen.styles"; // TODO: Use when implementing styled components

interface EventScreenProps {
  setActiveTab?: (location?: FocusLocation) => void;
}

const EventScreen: React.FC<EventScreenProps> = ({ setActiveTab }) => {
  const [filtersVisible, setFiltersVisible] = useState(true);
  const filtersOpacity = useRef(new Animated.Value(1)).current;

  const chips: FilterChip[] = useMemo(
    () => [
      { id: "vehicle", label: "Vehicle type" },
      { id: "pickup", label: "Pickup method" },
      { id: "more", label: "More filters" },
    ],
    []
  );

  const setVisible = (visible: boolean) => {
    setFiltersVisible(visible);
    Animated.timing(filtersOpacity, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const handleEventPress = (event: any) => {
    if (setActiveTab) {
      setActiveTab({
        latitude: event.coordinate.latitude,
        longitude: event.coordinate.longitude,
        title: event.name,
      });
    }
  };

  const handleFloatingButtonPress = () => {
    if (setActiveTab) {
      setActiveTab();
    }
  };

  return (
    <View style={screenStyles.container}>
      {/* Floating Filters overlay */}
      <FloatingFilters
        chips={chips}
        visible={filtersVisible}
        animatedValue={filtersOpacity}
      />

      <EventList
        events={events}
        onEventPress={handleEventPress}
        onScrollDirectionChange={(dir) => setVisible(dir === "up")}
        topInset={64}
      />
      <FloatingButton text="📍 Map" onPress={handleFloatingButtonPress} />
    </View>
  );
};

const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
});

export default EventScreen;

import React from "react";
import { View } from "react-native";
import { EventList } from "../components/EventList";
import { FloatingButton } from "../components/FloatingButton";
import { events } from "../utils/constants";
import { FocusLocation } from "../types";

interface EventScreenProps {
  setActiveTab?: (location?: FocusLocation) => void;
}

const EventScreen: React.FC<EventScreenProps> = ({ setActiveTab }) => {
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
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <EventList events={events} onEventPress={handleEventPress} />
      <FloatingButton text="📍 Map" onPress={handleFloatingButtonPress} />
    </View>
  );
};

export default EventScreen;

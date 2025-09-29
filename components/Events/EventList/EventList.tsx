import React from "react";
import { View, FlatList, ListRenderItem } from "react-native";
import { Event, FocusLocation } from "../../types";
import { EventItem } from "../EventItem/EventItem";
import { styles } from "./EventList.styles";

export interface EventListProps {
  events: Event[];
  onEventPress?: (event: Event) => void;
}

export const EventList: React.FC<EventListProps> = ({
  events,
  onEventPress,
}) => {
  const handleMapPress = (location: FocusLocation) => {
    if (onEventPress) {
      // Find the event that matches this location
      const event = events.find(
        (e) =>
          e.coordinate.latitude === location.latitude &&
          e.coordinate.longitude === location.longitude
      );
      if (event) {
        onEventPress(event);
      }
    }
  };

  const renderItem: ListRenderItem<Event> = ({ item }) => (
    <EventItem event={item} onMapPress={handleMapPress} />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
};

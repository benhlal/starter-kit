import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Event, FocusLocation } from "../../types";
import { styles } from "./EventItem.styles";

interface EventItemProps {
  event: Event;
  onMapPress?: (location: FocusLocation) => void;
}

export const EventItem: React.FC<EventItemProps> = ({ event, onMapPress }) => {
  const handleMapPress = () => {
    if (onMapPress) {
      onMapPress({
        latitude: event.coordinate.latitude,
        longitude: event.coordinate.longitude,
        title: event.name,
      });
    }
  };

  return (
    <View style={styles.card}>
      <Image source={{ uri: event.img }} style={styles.image} />
      <Text style={styles.title}>{event.name}</Text>
      <Text style={styles.detail}>{event.balance}</Text>
      <Text style={styles.detail}>{event.subscribers}</Text>
      <Text style={styles.distance}>📍 {event.distance}</Text>

      <TouchableOpacity style={styles.mapButton} onPress={handleMapPress}>
        <Text style={styles.mapButtonText}>🗺️ View on Map</Text>
      </TouchableOpacity>
    </View>
  );
};

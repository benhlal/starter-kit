import React, { useRef } from "react";
import {
  View,
  FlatList,
  ListRenderItem,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
} from "react-native";
import { Event, FocusLocation } from "../../../types";
import { EventItem } from "../EventItem/EventItem";
import { styles } from "./EventList.styles";

export interface EventListProps {
  events: Event[];
  onEventPress?: (event: Event) => void;
  onScrollDirectionChange?: (dir: "up" | "down") => void;
  topInset?: number; // padding to avoid overlay collisions (e.g., floating filters)
  onParticipate?: (event: Event) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const EventList: React.FC<EventListProps> = ({
  events,
  onEventPress,
  onScrollDirectionChange,
  topInset = 64,
  onParticipate,
  onRefresh,
  refreshing = false,
}) => {
  const handleMapPress = (location: FocusLocation) => {
    if (onEventPress) {
      // Find the event that matches this location
      const event = events.find((e) => {
        const coord = e.coordinate ?? e.location;
        return (
          coord &&
          coord.latitude === location.latitude &&
          coord.longitude === location.longitude
        );
      });
      if (event) {
        onEventPress(event);
      }
    }
  };

  const prevYRef = useRef(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const prev = prevYRef.current;
    const dy = y - prev;
    // Threshold to avoid flicker on tiny moves
    const threshold = 8;
    if (Math.abs(dy) > threshold && onScrollDirectionChange) {
      onScrollDirectionChange(dy > 0 ? "down" : "up");
    }
    prevYRef.current = y;
  };

  const renderItem: ListRenderItem<Event> = ({ item }) => (
    <EventItem
      event={item}
      onMapPress={handleMapPress}
      onParticipate={onParticipate}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: topInset },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D946EF"
            colors={["#D946EF"]}
            progressBackgroundColor="#1C1C1C"
            title="Pull to refresh events..."
            titleColor="#EDEDED"
          />
        }
      />
    </View>
  );
};

import React from "react";
import { Marker } from "react-native-maps";
import { EventLocation, Coin } from "../../types";

interface MapMarkerProps {
  item: EventLocation | Coin;
  onPress?: (item: EventLocation | Coin) => void;
}

export const MapMarker: React.FC<MapMarkerProps> = ({ item, onPress }) => {
  const handlePress = () => {
    if (onPress) {
      onPress(item);
    }
  };

  // Check if it's an EventLocation (has 'title') or Coin (has 'value')
  const isEventLocation = "title" in item;
  const isCoin = "value" in item;

  return (
    <Marker
      coordinate={item.coordinate}
      title={isEventLocation ? item.title : undefined}
      description={isEventLocation ? item.description : undefined}
      onPress={handlePress}
      pinColor={isCoin ? "#FFD700" : "#FF9500"} // Gold for coins, orange for events
    />
  );
};

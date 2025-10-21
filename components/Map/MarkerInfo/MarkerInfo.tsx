import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { EventLocation, Coin } from "../../../types";
import { styles } from "./MarkerInfo.styles";

interface MarkerInfoProps {
  item?: EventLocation | Coin | null;
  onClose?: () => void;
  onViewDetails?: (item: EventLocation | Coin) => void;
}

export const MarkerInfo: React.FC<MarkerInfoProps> = ({
  item,
  onClose,
  onViewDetails,
}) => {
  if (!item) {
    return null;
  }

  const isEventLocation = "title" in item;
  const isCoin = "value" in item;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEventLocation
              ? (item as EventLocation).title
              : `Coin (${(item as Coin).value})`}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        {isEventLocation && (
          <Text style={styles.description}>{item.description}</Text>
        )}

        {isCoin && (
          <Text style={styles.description}>
            Collectible coin worth {item.value} points
          </Text>
        )}

        {onViewDetails && (
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => onViewDetails(item)}
          >
            <Text style={styles.detailsButtonText}>
              {isEventLocation ? "View Event Details" : "Collect Coin"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

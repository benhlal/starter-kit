import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { styles } from "./MapControls.styles";

interface MapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onCurrentLocation?: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onCurrentLocation,
}) => {
  return (
    <View style={styles.container}>
      {/* Zoom Controls */}
      <View style={styles.zoomContainer}>
        <TouchableOpacity style={styles.zoomButton} onPress={onZoomIn}>
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={onZoomOut}>
          <Text style={styles.zoomButtonText}>-</Text>
        </TouchableOpacity>
      </View>

      {/* Current Location Button */}
      <TouchableOpacity
        style={styles.locationButton}
        onPress={onCurrentLocation}
      >
        <Text style={styles.locationButtonText}>📍</Text>
      </TouchableOpacity>
    </View>
  );
};

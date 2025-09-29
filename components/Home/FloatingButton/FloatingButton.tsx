import React from "react";
import { View, Text, TouchableWithoutFeedback } from "react-native";
import { styles } from "./FloatingButton.styles";

interface FloatingButtonProps {
  text: string;
  onPress: () => void;
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({
  text,
  onPress,
}) => (
  <TouchableWithoutFeedback onPress={onPress}>
    <View style={styles.floatingButton}>
      <Text style={styles.floatingButtonText}>{text}</Text>
    </View>
  </TouchableWithoutFeedback>
);

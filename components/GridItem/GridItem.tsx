import React from "react";
import { Image, Text, TouchableOpacity } from "react-native";
import { styles } from "./GridItem.styles";

// Import the ARObject type from App or from a shared types file
import type { ARObject } from "../../App";

interface GridItemProps {
  item: ARObject;
  onSelect: (item: ARObject) => void;
}

const GridItem: React.FC<GridItemProps> = ({ item, onSelect }) => {
  return (
    <TouchableOpacity style={styles.listItem} onPress={() => onSelect(item)}>
      <Image source={item.img} style={styles.listItemImage} />
      <Text style={styles.listItemText}>{item.name}</Text>
    </TouchableOpacity>
  );
};

export default GridItem;

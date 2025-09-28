import React from "react";
import { FlatList, View } from "react-native";
import GridItem from "../GridItem/GridItem";
import { styles } from "./Grid.styles";

// Import the ARObject type from App or from a shared types file
import type { ARObject } from "../../App";

interface GridProps {
  items: ARObject[];
  onSelect: (item: ARObject) => void;
}

const Grid: React.FC<GridProps> = ({ items, onSelect }) => {
  const renderItem = ({ item }: { item: ARObject }) => (
    <GridItem item={item} onSelect={onSelect} />
  );

  return (
    <View style={styles.scrollContent}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.scrollContent}
      />
    </View>
  );
};

export default Grid;

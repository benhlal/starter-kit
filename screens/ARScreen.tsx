import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

const ARScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🕶️ AR Screen (empty for now)</Text>
      <Button title="Go to Home" onPress={() => {}} />
      <Button title="Go to Profile" onPress={() => {}} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, marginBottom: 20 },
});

export default ARScreen;

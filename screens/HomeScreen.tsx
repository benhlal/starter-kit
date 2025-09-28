import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";

type HomeScreenNav = StackNavigationProp<RootStackParamList, "Home">;

interface Props {
  navigation: HomeScreenNav;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏠 Home Screen</Text>
      <Button
        title="Go to Profile"
        onPress={() => navigation.navigate("Profile")}
      />
      <Button title="Go to Map" onPress={() => navigation.navigate("Map")} />
      <Button title="Go to AR" onPress={() => navigation.navigate("AR")} />
      <Button
        title="Check Events"
        onPress={() => navigation.navigate("EVENTS")}
      />
      <Button
        title="Go to Search"
        onPress={() => navigation.navigate("Search")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, marginBottom: 20 },
});

export default HomeScreen;

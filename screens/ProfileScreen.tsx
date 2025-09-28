import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../App";

type ProfileNav = StackNavigationProp<RootStackParamList, "Profile">;

interface Props {
  navigation: ProfileNav;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>👤 Profile Screen</Text>
      <Button title="Go to Home" onPress={() => navigation.navigate("Home")} />
      <Button title="Go to Map" onPress={() => navigation.navigate("Map")} />
      <Button title="Go to AR" onPress={() => navigation.navigate("AR")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, marginBottom: 20 },
});

export default ProfileScreen;

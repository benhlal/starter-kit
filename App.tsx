import * as React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import HomeScreen from "./screens/HomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MapScreen from "./screens/MapScreen";
import ARScreen from "./screens/ARScreen";
import EventScreen from "./screens/EventScreen";
import SearchScreen from "./screens/SearchScreen";

export type RootStackParamList = {
  Home: undefined;
  Profile: undefined;
  Map: undefined;
  AR: undefined;
  EVENTS: undefined;
  Search: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="AR" component={ARScreen} />
        <Stack.Screen
          name="EVENTS"
          component={EventScreen}
          options={{ headerShown: false }}
        />
  <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;

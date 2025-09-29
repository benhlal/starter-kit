import React from "react";
import { RecoilRoot } from "recoil";
import { SafeAreaProvider } from "react-native-safe-area-context";
import HomeScreen from "./screens/Home/HomeScreen";

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <RecoilRoot>
        <HomeScreen />
      </RecoilRoot>
    </SafeAreaProvider>
  );
};

export default App;

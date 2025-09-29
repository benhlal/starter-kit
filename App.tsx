import React from "react";
import { RecoilRoot } from "recoil";
import HomeScreen from "./screens/Home/HomeScreen";

const App: React.FC = () => {
  return (
    <RecoilRoot>
      <HomeScreen />
    </RecoilRoot>
  );
};

export default App;

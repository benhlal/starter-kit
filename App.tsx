// App.tsx
import * as React from 'react';
import { ViroARScene, ViroARSceneNavigator, ViroText } from '@reactvision/react-viro';





const App = () => {
  const  InitialScene= (): JSX.Element =>{
  return <ViroARScene>
      <ViroText text={"youness"}
        position={[0, 0, -2]}
        style={{fontFamily:'Arial', fontSize:50}}
        >

      </ViroText>
    </ViroARScene>;
  }

  return (

  <ViroARSceneNavigator initialScene={{
    scene:InitialScene
  }}
  style={{flex:1}}>

  </ViroARSceneNavigator>  
  );
};

export default App;

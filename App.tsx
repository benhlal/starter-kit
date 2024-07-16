// App.tsx
import * as React from 'react';
import { ViroARScene, ViroARSceneNavigator, ViroMaterials ,ViroBox, ViroAnimations} from '@reactvision/react-viro';





const App = () => {
  
  const  InitialScene= (): JSX.Element =>{
    ViroMaterials.createMaterials({
      wood:{
        diffuseTexture:require('./assets/wood.jpg')
      }
    })

    ViroAnimations.registerAnimations({
      rotate:{
        duration:2550,
        properties:{rotateY: '+=90'}
      }
    })
    

  return <ViroARScene>
   {
/**
     <ViroText text={"youness"}
        position={[0, 0, -2]}
        style={{fontFamily:'Arial', fontSize:50}}
        >

      </ViroText>
     */  
   } 
   <ViroBox
   height={2}
   length={2}
   width={2}
   scale={[0.2,0.2,0.2]}
   position={[0,-1,-1]}
   materials={["wood"]}
   animation={{name:'rotate',loop:true ,run:true}}
   ></ViroBox>
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

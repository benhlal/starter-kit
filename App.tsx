// App.tsx
import * as React from 'react';
import { ViroARScene, ViroARSceneNavigator, ViroMaterials ,ViroBox, ViroAnimations} from '@reactvision/react-viro';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';





const App = () => {

  const [object,setObject]= React.useState('lock');
  const styles =StyleSheet.create({
    controlView:{
      width:'100%',
      height:100,
      backgroundColor:'#ffffff',
      display:"flex",
      flexDirection:"row",
      justifyContent:'space-between'
    },
    mainView: {
      flex:1
    }

  })
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
<View style={styles.mainView}>
<ViroARSceneNavigator initialScene={{
    scene:InitialScene
  }}
  viroAppProps={{"object": object}}
  style={{flex:1}}>

  </ViroARSceneNavigator>  
  <View style={styles.controlView}>
  <TouchableOpacity onPress={()=>setObject('lock')}><Text>GetLock</Text></TouchableOpacity>
  <TouchableOpacity onPress={()=>setObject('heart')}><Text>GetHeart</Text></TouchableOpacity>

  </View>
</View>

   );
};

export default App;

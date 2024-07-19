import * as React from "react";
import { ViroARSceneNavigator } from "@reactvision/react-viro";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  PinchGestureHandlerGestureEvent,
  State
} from "react-native-gesture-handler";
import HomeScene from "./scenes/HomeScene";

const { height: screenHeight } = Dimensions.get('window');

interface ARObject {
  id: string;
  name: string;
  img: any;
  obj: any;
  mtl: any;
}

const objects: ARObject[] = [
  {
    id: 'lock',
    name: 'Lock',
    img: require('./assets/lock/lock_preview.jpg'),
    obj: require('./assets/lock/18932_Heart-shaped_lock_v1.obj'),
    mtl: require('./assets/lock/Blank.mtl')
  },
  {
    id: 'heart',
    name: 'Heart',
    img: require('./assets/heart/heart_preview.jpg'),
    obj: require('./assets/heart/12190_Heart_v1_L3.obj'),
    mtl: require('./assets/heart/12190_Heart_v1_L3.mtl')
  },
  // Add more objects as needed
];

const App = () => {
  const [selectedObject, setSelectedObject] = React.useState<ARObject | null>(objects[0]);
  const [scale, setScale] = React.useState<[number, number, number]>([0.05, 0.05, 0.05]);
  const [textInput, setTextInput] = React.useState('');
  const [textObject, setTextObject] = React.useState<{ id: string, text: string } | null>(null);

  const animatedHeight = React.useRef(new Animated.Value(screenHeight * 0.5)).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 20,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dy < 0) {
          // Swiping up
          Animated.timing(animatedHeight, {
            toValue: screenHeight * 0.5,
            duration: 300,
            useNativeDriver: false
          }).start();
        } else if (gestureState.dy > 0 && animatedHeight._value > 40) {
          // Swiping down
          Animated.timing(animatedHeight, {
            toValue: 40,
            duration: 300,
            useNativeDriver: false
          }).start();
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50) {
          // Release after swiping down
          Animated.timing(animatedHeight, {
            toValue: 40,
            duration: 300,
            useNativeDriver: false,
          }).start();
        } else if (gestureState.dy < -50) {
          // Release after swiping up
          Animated.timing(animatedHeight, {
            toValue: screenHeight * 0.5,
            duration: 300,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const onPinchEvent = (event: PinchGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      const newScale = Math.max(0.01, 0.05 * event.nativeEvent.scale); // Prevent scale from being too small
      setScale([newScale, newScale, newScale]);
    }
  };

  const handleTextSubmit = () => {
    if (textInput.trim() !== '') {
      setTextObject({ id: 'text', text: textInput.trim() });
      setSelectedObject(null); // Set to null to ensure the text object is displayed instead of a 3D object
      setTextInput(''); // Clear the input field
    }
  };

  const styles = StyleSheet.create({
    mainView: {
      flex: 1,
    },
    scrollContainer: {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      overflow: 'hidden',
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    listItem: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 15,
      margin: 10,
      backgroundColor: '#ffffff',
      borderRadius: 15,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 10,
      borderWidth: 1,
      borderColor: '#ddd',
    },
    listItemText: {
      marginTop: 10,
      fontSize: 16,
      textAlign: 'center',
      fontWeight: 'bold',
      color: '#333',
    },
    listItemImage: {
      width: 80,
      height: 80,
      borderRadius: 10
    },
    handle: {
      width: 50,
      height: 5,
      backgroundColor: '#ccc',
      borderRadius: 2.5,
      alignSelf: 'center',
      marginVertical: 10,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 10,
      background

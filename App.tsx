import * as React from "react";
import { ViroARSceneNavigator } from "@reactvision/react-viro";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  PanResponder,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  PinchGestureHandler,
  PinchGestureHandlerGestureEvent,
  State,
} from "react-native-gesture-handler";
import HomeScene from "./scenes/HomeScene";
import styles from "./styles"; // Importing the styles
import firestore from "@react-native-firebase/firestore";

const { height: screenHeight } = Dimensions.get("window");

interface ARObject {
  id: string;
  name: string;
  img: any;
  obj: any;
  mtl: any;
  position: [number, number, number];
}

interface TextObject {
  id: string;
  text: string;
  position: [number, number, number];
}

const objects: ARObject[] = [
  {
    id: "lock",
    name: "Lock",
    img: require("./assets/lock/lock_preview.jpg"),
    obj: require("./assets/lock/18932_Heart-shaped_lock_v1.obj"),
    mtl: require("./assets/lock/Blank.mtl"),
    position: [0, 0, -3],
  },
  {
    id: "heart",
    name: "Heart",
    img: require("./assets/heart/heart_preview.jpg"),
    obj: require("./assets/heart/12190_Heart_v1_L3.obj"),
    mtl: require("./assets/heart/12190_Heart_v1_L3.mtl"),
    position: [0, 0, -3],
  },
  // Add more objects as needed
];

const App = () => {
  const [selectedObject, setSelectedObject] = React.useState<ARObject | null>(null);
  const [scale, setScale] = React.useState<[number, number, number]>([0.05, 0.05, 0.05]);
  const [textInput, setTextInput] = React.useState("");
  const [textObject, setTextObject] = React.useState<TextObject | null>(null);

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
            useNativeDriver: false,
          }).start();
        } else if (gestureState.dy > 0 && animatedHeight.__getValue() > 40) {
          // Swiping down
          Animated.timing(animatedHeight, {
            toValue: 40,
            duration: 300,
            useNativeDriver: false,
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

  React.useEffect(() => {
    // Fetch AR objects from Firebase
    const fetchObjects = async () => {
      const objectsSnapshot = await firestore().collection('arObjects').orderBy('timestamp', 'desc').limit(1).get();
      if (!objectsSnapshot.empty) {
        const lastObject = objectsSnapshot.docs[0].data() as ARObject | TextObject;
        if ('text' in lastObject) {
          setTextObject(lastObject as TextObject);
          setSelectedObject(null);
        } else {
          setSelectedObject(lastObject as ARObject);
          setTextObject(null);
        }
      }
    };

    fetchObjects();
  }, []);

  const handleTextSubmit = () => {
    if (textInput.trim() !== "") {
      const newTextObject: TextObject = { id: "text", text: textInput.trim(), position: [0, 0, -3] };
      setTextObject(newTextObject);
      setSelectedObject(null); // Set to null to ensure the text object is displayed instead of a 3D object
      setTextInput(""); // Clear the input field
      // Save the text object to Firebase
      firestore().collection('arObjects').add({ ...newTextObject, timestamp: firestore.FieldValue.serverTimestamp() });
    }
  };

  const handleObjectSelect = (item: ARObject) => {
    setSelectedObject(item);
    setTextObject(null); // Clear any text object when a 3D object is selected
    // Ensure the menu remains open when selecting an object
    Animated.timing(animatedHeight, {
      toValue: screenHeight * 0.5,
      duration: 300,
      useNativeDriver: false,
    }).start();
    // Save the object selection to Firebase
    firestore().collection('arObjects').add({ ...item, timestamp: firestore.FieldValue.serverTimestamp() });
  };

  const renderItem = ({ item }: { item: ARObject }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => handleObjectSelect(item)}
    >
      <Image source={item.img} style={styles.listItemImage} />
      <Text style={styles.listItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.mainView}>
        <PinchGestureHandler onGestureEvent={onPinchEvent}>
          <Animated.View style={{ flex: 1 }}>
            <ViroARSceneNavigator
              initialScene={{ scene: HomeScene }}
              viroAppProps={{ object: selectedObject, scale, textObject }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </PinchGestureHandler>
        <Animated.View
          style={[
            styles.scrollContainer,
            {
              height: animatedHeight.interpolate({
                inputRange: [40, screenHeight * 0.5],
                outputRange: [40, screenHeight * 0.5],
                extrapolate: "clamp",
              }),
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handle} />
          <FlatList
            data={objects}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.scrollContent}
          />
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your text here..."
              value={textInput}
              onChangeText={setTextInput}
            />
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleTextSubmit}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </GestureHandlerRootView>
  );
};

export default App;

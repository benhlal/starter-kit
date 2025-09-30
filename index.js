// Silence RNFB modular deprecation warnings while migrating (optional)
global.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

// Ensure Firebase native app is loaded before any module usage
import "@react-native-firebase/app";
import firebase from "@react-native-firebase/app";

import { AppRegistry } from "react-native";
import App from "./App";
import { name as appName } from "./app.json";

// Guard: if default app isn't available yet, initialize using native config
try {
  firebase.app();
} catch (e) {
  try {
    // initialize with native config from google-services.json / GoogleService-Info.plist
    firebase.initializeApp();
  } catch (err) {
    console.warn("Firebase default app init failed:", err?.message || err);
  }
}

AppRegistry.registerComponent(appName, () => App);

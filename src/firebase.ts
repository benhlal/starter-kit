// Deprecated: Firebase bootstrap not required; native config is used by RN Firebase modules
export {};

import app from "@react-native-firebase/app";

// Ensure the default app is available; in RN, native config initializes automatically when modules are used
export function ensureFirebaseApp() {
  // Simply return the default app if available; avoid calling initializeApp() without params
  return app.app();
}

// Optional: re-export modules for consistent imports
export { default as auth } from "@react-native-firebase/auth";
export { default as firestore } from "@react-native-firebase/firestore";
export { default as firebase } from "@react-native-firebase/app";

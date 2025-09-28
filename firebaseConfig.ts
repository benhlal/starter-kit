import firebase from "@react-native-firebase/app";
import firestore from "@react-native-firebase/firestore";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Firebase configuration from your Google services JSON
const firebaseConfig: FirebaseConfig = {
  apiKey: "AIzaSyAftq8Ar0oV1svei2FDhAXhNJzEM7dDbtg",
  authDomain: "lookhere-8e2fa.firebaseapp.com",
  projectId: "lookhere-8e2fa",
  storageBucket: "lookhere-8e2fa.appspot.com",
  messagingSenderId: "816594107270",
  appId: "1:816594107270:android:b5ece4d67a684094c50a07",
  measurementId: "G-XXXXXXXXXX", // replace with your actual measurement ID if you have one
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export { firebase, firestore };

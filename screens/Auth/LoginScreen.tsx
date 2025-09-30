import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
} from "@react-native-firebase/auth";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

// Use an official PNG for better RN Image support (SVG URLs won't render natively)
const googleLogo = "https://developers.google.com/identity/images/g-logo.png";

const LoginScreen: React.FC = () => {
  useEffect(() => {
    GoogleSignin.configure({
      // From android/app/google-services.json -> client_type 3 (Web client)
      webClientId:
        "764853553419-namss394okrfjlmappqqlhbnvrltcrqv.apps.googleusercontent.com",
      offlineAccess: true,
      forceCodeForRefreshToken: false,
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Prefer idToken from signIn(); fallback to getTokens() for some devices
      const signInRes: any = await GoogleSignin.signIn();
      let idToken: string | undefined = signInRes?.idToken;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens();
        idToken = (tokens as any)?.idToken as string | undefined;
      }
      if (!idToken) {
        throw new Error("No idToken returned from Google");
      }

      const auth = getAuth();
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (e: any) {
      if (e?.code === statusCodes.SIGN_IN_CANCELLED) {
        return; // user dismissed
      }
      console.warn("Google sign-in error:", e?.message || e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>
        <Text style={styles.brandCoins}>Coins</Text>
        <Text style={styles.brandHunter}>Hunter</Text>
        <Text style={styles.brandSpark}> ✨</Text>
      </Text>
      <Text style={styles.subtitle}>
        Sign in to save your progress and sync your profile across devices.
      </Text>

      <TouchableOpacity onPress={signInWithGoogle} style={styles.googleBtn}>
        <Image source={{ uri: googleLogo }} style={styles.googleIcon} />
        <Text style={styles.googleText}>Continue with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  brand: {
    fontSize: 40,
    fontWeight: "900",
    marginBottom: 12,
    textTransform: "none",
  },
  brandCoins: {
    color: "#FFD700", // gold
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  brandHunter: {
    color: "#7FDBFF", // cyan
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  brandSpark: {
    color: "#FFA500",
  },
  subtitle: {
    color: "#aaa",
    marginBottom: 32,
    textAlign: "center",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  googleIcon: { width: 20, height: 20, marginRight: 12 },
  googleText: { color: "#111", fontWeight: "600" },
});

export default LoginScreen;

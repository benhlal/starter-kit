import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { FirebaseService } from "../../services/firebase/FirebaseService";

const PACKS = [
  { id: "p1", label: "Starter Pack", amountCents: 100, tokens: 1 },
  { id: "p2", label: "Value Pack", amountCents: 1000, tokens: 10 },
  { id: "p3", label: "Mega Pack", amountCents: 5000, tokens: 60 },
];

export default function BuyTokens() {
  const [loadingPack, setLoadingPack] = useState<string | null>(null);

  async function buy(pack: { amountCents: number; tokens: number; id: string }) {
    const user = FirebaseService.getCurrentUser();
    if (!user) {
      Alert.alert("Not signed in", "Please sign in to make purchases.");
      return;
    }
    try {
      setLoadingPack(pack.id);
      // In a real app we would call Stripe SDK. Here we mock the payment and record via FirebaseService
      const res = await FirebaseService.createTokenPurchase(
        user.uid,
        pack.amountCents,
        pack.tokens,
        "usd",
        { source: "mock_stripe" }
      );
      Alert.alert("Purchase successful", `Added ${pack.tokens} tokens to your balance.`);
      return res;
    } catch (error: any) {
      console.error("BuyTokens error:", error);
      Alert.alert("Purchase failed", error?.message || String(error));
    } finally {
      setLoadingPack(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buy Tokens</Text>
      {PACKS.map((p) => (
        <TouchableOpacity
          key={p.id}
          style={styles.pack}
          onPress={() => buy(p)}
          disabled={!!loadingPack}
        >
          <Text style={styles.packLabel}>{p.label}</Text>
          <Text style={styles.packPrice}>${(p.amountCents / 100).toFixed(2)}</Text>
          <Text style={styles.packTokens}>{p.tokens} tokens</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  pack: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginBottom: 10,
    elevation: 2,
  },
  packLabel: { fontSize: 16, fontWeight: "600" },
  packPrice: { fontSize: 14, color: "#333" },
  packTokens: { fontSize: 12, color: "#666" },
});

import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { FirebaseService } from "../../services/firebase/FirebaseService";

const PACKS = [
  { id: "c1", label: "Small Pack", tokensCost: 5, coins: 1 },
  { id: "c2", label: "Medium Pack", tokensCost: 20, coins: 5 },
  { id: "c3", label: "Large Pack", tokensCost: 50, coins: 15 },
];

export default function BuyCoinPack() {
  const [loading, setLoading] = useState<string | null>(null);

  async function buyPack(pack: { tokensCost: number; id: string }) {
    const user = FirebaseService.getCurrentUser();
    if (!user) {
      Alert.alert("Not signed in", "Please sign in to make purchases.");
      return;
    }
    try {
      setLoading(pack.id);
      // Deduct tokens and record margin entry
      await FirebaseService.purchaseWithTokens(user.uid, pack.tokensCost, {
        item: "coin_pack",
        metadata: { packId: pack.id },
      });
      Alert.alert("Purchase successful", `Spent ${pack.tokensCost} tokens`);
    } catch (err) {
      Alert.alert("Purchase failed", (err as any)?.message || String(err));
    } finally {
      setLoading(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buy Coin Packs (Tokens)</Text>
      {PACKS.map((p) => (
        <TouchableOpacity
          key={p.id}
          style={styles.pack}
          onPress={() => buyPack(p)}
          disabled={!!loading}
        >
          <Text style={styles.packLabel}>{p.label}</Text>
          <Text style={styles.packPrice}>{p.tokensCost} tokens</Text>
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
});

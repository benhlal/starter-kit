import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Button, Alert } from "react-native";
import { FirebaseService } from "../../services/firebase/FirebaseService";

export default function TokenEconomySettings() {
  const [loading, setLoading] = useState(true);
  const [prizePoolShare, setPrizePoolShare] = useState<string>("0.7");
  const [coinAllocationFactor, setCoinAllocationFactor] = useState<string>("0.8");
  const [defaultTokensRequired, setDefaultTokensRequired] = useState<string>("10");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const doc = (await FirebaseService.getSettings("tokenEconomy")) as any;
        if (!mounted) return;
        const settings = doc || {};
        setPrizePoolShare(String(settings.prizePoolShare ?? 0.7));
        setCoinAllocationFactor(String(settings.coinAllocationFactor ?? 0.8));
        setDefaultTokensRequired(String(settings.defaultTokensRequired ?? 10));
      } catch (error) {
        console.warn("Failed to load token economy settings:", error);
        Alert.alert("Error", "Failed to load token economy settings");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function save() {
    try {
      const payload = {
        prizePoolShare: Number(prizePoolShare),
        coinAllocationFactor: Number(coinAllocationFactor),
        defaultTokensRequired: Number(defaultTokensRequired),
      };
      await FirebaseService.upsertSettings("tokenEconomy", payload);
      Alert.alert("Saved", "Token economy settings updated");
    } catch (error) {
      Alert.alert("Error", String(error));
    }
  }

  if (loading) return <Text>Loading...</Text>;

  return (
    <View style={{ padding: 12 }}>
      <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Token Economy</Text>
      <Text>Prize pool share (0-1):</Text>
      <TextInput
        value={prizePoolShare}
        onChangeText={setPrizePoolShare}
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 8, marginBottom: 8 }}
      />

      <Text>Coin allocation factor (0-1):</Text>
      <TextInput
        value={coinAllocationFactor}
        onChangeText={setCoinAllocationFactor}
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 8, marginBottom: 8 }}
      />

      <Text>Default tokens required (integer):</Text>
      <TextInput
        value={defaultTokensRequired}
        onChangeText={setDefaultTokensRequired}
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 8, marginBottom: 12 }}
      />

      <Button title="Save" onPress={save} />
    </View>
  );
}

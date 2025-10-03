import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import firestore from "@react-native-firebase/firestore";

const TestMigration: React.FC = () => {
  const [testStatus, setTestStatus] = useState<string>("Ready to test");
  const [isLoading, setIsLoading] = useState(false);

  const testFirebaseConnection = async () => {
    setIsLoading(true);
    setTestStatus("Testing Firebase connection...");

    try {
      // Test 1: Simple document creation
      const testDoc = await firestore().collection("test").add({
        message: "Hello Firebase!",
        timestamp: firestore.FieldValue.serverTimestamp(),
        testNumber: Math.random(),
      });

      console.log("✅ Test document created with ID:", testDoc.id);

      // Test 2: Read the document back
      const docSnapshot = await firestore()
        .collection("test")
        .doc(testDoc.id)
        .get();
      if (docSnapshot.exists()) {
        console.log("✅ Test document retrieved:", docSnapshot.data());
        setTestStatus(
          "✅ Firebase is working! Document created and retrieved."
        );

        // Test 3: Create a sample event
        const eventDoc = await firestore().collection("events").add({
          title: "Test Event",
          description: "This is a test event to verify Firebase collections",
          category: "Test",
          createdAt: firestore.FieldValue.serverTimestamp(),
          status: "active",
        });

        console.log("✅ Test event created with ID:", eventDoc.id);
        setTestStatus("✅ All tests passed! Events collection created.");

        Alert.alert(
          "Success!",
          `Firebase is working correctly!\n\nCreated:\n• Test document: ${testDoc.id}\n• Test event: ${eventDoc.id}\n\nCheck your Firebase Console!`
        );
      } else {
        throw new Error("Could not retrieve test document");
      }
    } catch (error) {
      console.error("❌ Firebase test failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setTestStatus(`❌ Test failed: ${errorMessage}`);
      Alert.alert("Test Failed", `Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createSampleEvent = async () => {
    setIsLoading(true);
    setTestStatus("Creating sample event...");

    try {
      const sampleEvent = {
        title: "AR Treasure Hunt Downtown",
        description:
          "Explore downtown landmarks using AR technology to find hidden treasures and earn rewards!",
        category: "Adventure",
        difficulty: "Medium",
        startDate: new Date("2024-02-15T10:00:00Z"),
        endDate: new Date("2024-02-15T16:00:00Z"),
        location: {
          name: "Downtown Central Park",
          address: "123 Central Park Ave, City Center",
          latitude: 40.7829,
          longitude: -73.9654,
        },
        maxParticipants: 50,
        currentParticipants: 23,
        rewards: {
          coins: 100,
          badges: ["Explorer", "First Timer"],
        },
        status: "active",
        visibility: "public",
        createdBy: "user_1",
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      const eventDoc = await firestore().collection("events").add(sampleEvent);
      console.log("✅ Sample event created with ID:", eventDoc.id);

      setTestStatus("✅ Sample event created successfully!");
      Alert.alert(
        "Success!",
        `Sample event created with ID: ${eventDoc.id}\n\nCheck Firebase Console > events collection`
      );
    } catch (error) {
      console.error("❌ Failed to create sample event:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setTestStatus(`❌ Failed: ${errorMessage}`);
      Alert.alert("Error", `Failed to create event: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ padding: 20, backgroundColor: "#1C1C1C", flex: 1 }}>
      <Text
        style={{
          color: "#EDEDED",
          fontSize: 20,
          fontWeight: "bold",
          marginBottom: 20,
        }}
      >
        Firebase Connection Test
      </Text>

      <Text style={{ color: "#EDEDED", marginBottom: 20 }}>
        Status: {testStatus}
      </Text>

      <TouchableOpacity
        style={{
          backgroundColor: "#D946EF",
          padding: 15,
          borderRadius: 8,
          marginBottom: 15,
          opacity: isLoading ? 0.5 : 1,
        }}
        onPress={testFirebaseConnection}
        disabled={isLoading}
      >
        <Text
          style={{ color: "#FFFFFF", textAlign: "center", fontWeight: "bold" }}
        >
          {isLoading ? "Testing..." : "Test Firebase Connection"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: "#10B981",
          padding: 15,
          borderRadius: 8,
          marginBottom: 15,
          opacity: isLoading ? 0.5 : 1,
        }}
        onPress={createSampleEvent}
        disabled={isLoading}
      >
        <Text
          style={{ color: "#FFFFFF", textAlign: "center", fontWeight: "bold" }}
        >
          {isLoading ? "Creating..." : "Create Sample Event"}
        </Text>
      </TouchableOpacity>

      <Text style={{ color: "#666666", fontSize: 12, marginTop: 20 }}>
        This will test Firebase Firestore connection and create test documents.
        Check your Firebase Console to see the created collections and
        documents.
      </Text>
    </View>
  );
};

export default TestMigration;

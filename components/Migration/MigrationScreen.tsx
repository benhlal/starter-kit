import React, { useState } from "react";
import { Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import firestore from "@react-native-firebase/firestore";
import { FirebaseService } from "../../services/firebase/FirebaseService";

const sampleEvents = [
  {
    title: "Paris Treasure Hunt",
    description:
      "Explore the City of Light and discover hidden treasures around iconic landmarks.",
    type: "treasure-hunt" as const,
    status: "active" as const,
    location: {
      latitude: 48.8566,
      longitude: 2.3522,
      address: "Paris, France",
      venue: "City Center",
    },
    startDate: new Date("2024-03-01T10:00:00Z").toISOString(),
    endDate: new Date("2024-03-01T18:00:00Z").toISOString(),
    maxParticipants: 100,
    currentParticipants: 532,
    participants: [],
    organizer: { id: "event_organizer_1", name: "Paris Adventures" },
    tags: ["urban", "exploration", "landmarks"],
    image:
      "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&w=600",
    rewards: {
      coins: 1200,
      experience: 500,
      badges: ["First Prize", "Second Prize", "Third Prize"],
    },
    visibility: "public" as const,
  },
  {
    title: "Central Park Adventure",
    description:
      "A thrilling adventure through Central Park with AR-enhanced exploration.",
    type: "ar-experience" as const,
    status: "active" as const,
    location: {
      latitude: 40.7829,
      longitude: -73.9654,
      address: "Central Park, New York",
      venue: "Central Park",
    },
    startDate: new Date("2024-03-05T14:00:00Z").toISOString(),
    endDate: new Date("2024-03-05T20:00:00Z").toISOString(),
    maxParticipants: 75,
    currentParticipants: 420,
    participants: [],
    organizer: { id: "event_organizer_2", name: "NYC Explorers" },
    tags: ["nature", "park", "community"],
    image:
      "https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&w=600",
    rewards: {
      coins: 950,
      experience: 400,
      badges: ["First Prize", "Second Prize", "Third Prize"],
    },
    visibility: "public" as const,
  },
  {
    title: "Tokyo Night Quest",
    description:
      "Experience the vibrant nightlife of Tokyo while completing AR challenges.",
    type: "challenge" as const,
    status: "upcoming" as const,
    location: {
      latitude: 35.6762,
      longitude: 139.6503,
      address: "Tokyo, Japan",
      venue: "Shibuya District",
    },
    startDate: new Date("2024-03-10T19:00:00Z").toISOString(),
    endDate: new Date("2024-03-10T23:00:00Z").toISOString(),
    maxParticipants: 50,
    currentParticipants: 300,
    participants: [],
    organizer: { id: "event_organizer_3", name: "Tokyo Treks" },
    tags: ["night", "city", "challenge"],
    image: "https://images.pexels.com/photos/356830/pexels-photo-356830.jpeg",
    rewards: {
      coins: 150000,
      experience: 800,
      badges: ["First Prize", "Second Prize", "Third Prize"],
    },
    visibility: "public" as const,
  },
];

const sampleUsers = [
  {
    email: "john.doe@example.com",
    displayName: "John Doe",
    photoURL:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
    totalCoins: 25,
    level: 3,
    eventsJoined: 5,
    achievements: ["First Event", "Coin Collector", "Explorer"],
  },
  {
    email: "jane.smith@example.com",
    displayName: "Jane Smith",
    photoURL:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
    totalCoins: 42,
    level: 5,
    eventsJoined: 8,
    achievements: [
      "First Event",
      "Coin Collector",
      "Explorer",
      "Social Butterfly",
      "Master Hunter",
    ],
  },
];

const sampleCoins = [
  {
    value: 10,
    region: "paris",
    collected: false,
    type: "standard",
    rarity: "common",
    location: { latitude: 48.8566, longitude: 2.3522 },
    collectible: true,
  },
  {
    value: 25,
    region: "new_york",
    collected: false,
    type: "event",
    rarity: "uncommon",
    location: { latitude: 40.7829, longitude: -73.9654 },
    collectible: true,
  },
  {
    value: 50,
    region: "tokyo",
    collected: false,
    type: "premium",
    rarity: "rare",
    location: { latitude: 35.6762, longitude: 139.6503 },
    collectible: true,
  },
];

export const MigrationScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<string>("");

  const migrateEvents = async () => {
    setIsLoading(true);
    setMigrationStatus("Migrating events...");

    try {
      let successCount = 0;
      for (const event of sampleEvents) {
        try {
          const now = new Date().toISOString();
          const eventWithTimestamps = {
            ...event,
            createdAt: now,
            updatedAt: now,
          };
          const eventId = await FirebaseService.createEvent(
            eventWithTimestamps
          );
          console.log(`Created event: ${event.title} with ID: ${eventId}`);
          successCount++;
        } catch (error) {
          console.error(`Failed to create event ${event.title}:`, error);
        }
      }

      setMigrationStatus(
        `Successfully migrated ${successCount}/${sampleEvents.length} events`
      );
      Alert.alert("Success", `Migrated ${successCount} events to Firebase!`);
    } catch (error) {
      console.error("Migration failed:", error);
      setMigrationStatus("Migration failed");
      Alert.alert(
        "Error",
        "Failed to migrate events. Check console for details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const migrateUsers = async () => {
    setIsLoading(true);
    setMigrationStatus("Migrating users...");

    try {
      let successCount = 0;
      for (const user of sampleUsers) {
        try {
          const userId = await FirebaseService.createUser(user);
          console.log(`Created user: ${user.displayName} with ID: ${userId}`);
          successCount++;
        } catch (error) {
          console.error(`Failed to create user ${user.displayName}:`, error);
        }
      }

      setMigrationStatus(
        `Successfully migrated ${successCount}/${sampleUsers.length} users`
      );
      Alert.alert("Success", `Migrated ${successCount} users to Firebase!`);
    } catch (error) {
      console.error("Migration failed:", error);
      setMigrationStatus("Migration failed");
      Alert.alert(
        "Error",
        "Failed to migrate users. Check console for details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const migrateCoins = async () => {
    setIsLoading(true);
    setMigrationStatus("Migrating coins...");

    try {
      let successCount = 0;
      for (const coin of sampleCoins) {
        try {
          const coinId = await FirebaseService.createCoin(coin);
          console.log(`Created coin in ${coin.region} with ID: ${coinId}`);
          successCount++;
        } catch (error) {
          console.error(`Failed to create coin in ${coin.region}:`, error);
        }
      }

      setMigrationStatus(
        `Successfully migrated ${successCount}/${sampleCoins.length} coins`
      );
      Alert.alert("Success", `Migrated ${successCount} coins to Firebase!`);
    } catch (error) {
      console.error("Migration failed:", error);
      setMigrationStatus("Migration failed");
      Alert.alert(
        "Error",
        "Failed to migrate coins. Check console for details."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testFirebaseConnection = async () => {
    setIsLoading(true);
    setMigrationStatus("Testing Firebase connection...");

    try {
      // Direct test using firestore
      const testDoc = await firestore().collection("test").add({
        message: "Hello Firebase!",
        timestamp: firestore.FieldValue.serverTimestamp(),
        testNumber: Math.random(),
      });

      console.log("✅ Test document created with ID:", testDoc.id);

      // Create a simple event document
      const eventDoc = await firestore().collection("events").add({
        title: "Test Event",
        description: "Test event to verify Firebase collections",
        category: "Test",
        status: "active",
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      console.log("✅ Test event created with ID:", eventDoc.id);
      setMigrationStatus(
        "✅ Firebase connection successful! Collections created."
      );
      Alert.alert(
        "Success!",
        `Firebase is working!\n\nCreated:\n• Test doc: ${testDoc.id}\n• Test event: ${eventDoc.id}`
      );
    } catch (error) {
      console.error("❌ Firebase test failed:", error);
      setMigrationStatus(`❌ Test failed: ${(error as Error).message}`);
      Alert.alert("Test Failed", `Error: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const migrateAll = async () => {
    setIsLoading(true);
    try {
      await migrateEvents();
      await migrateUsers();
      await migrateCoins();
      setMigrationStatus("All data migrated successfully!");
      Alert.alert("Success", "All sample data has been migrated to Firebase!");
    } catch (error) {
      console.error("Full migration failed:", error);
      Alert.alert("Error", "Migration failed. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: "#121212" }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          color: "#EDEDED",
          marginBottom: 20,
        }}
      >
        Firebase Migration
      </Text>

      <Text style={{ color: "#A0A0A0", marginBottom: 20 }}>
        This will create Firebase collections and insert sample data.
      </Text>

      {migrationStatus ? (
        <Text style={{ color: "#D946EF", marginBottom: 20, fontWeight: "600" }}>
          Status: {migrationStatus}
        </Text>
      ) : null}

      <TouchableOpacity
        style={{
          backgroundColor: "#10B981",
          padding: 15,
          borderRadius: 10,
          marginBottom: 15,
          opacity: isLoading ? 0.5 : 1,
        }}
        onPress={testFirebaseConnection}
        disabled={isLoading}
      >
        <Text
          style={{ color: "#FFFFFF", textAlign: "center", fontWeight: "600" }}
        >
          🧪 Test Firebase Connection
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: "#D946EF",
          padding: 15,
          borderRadius: 10,
          marginBottom: 10,
          opacity: isLoading ? 0.5 : 1,
        }}
        onPress={migrateEvents}
        disabled={isLoading}
      >
        <Text
          style={{ color: "#FFFFFF", textAlign: "center", fontWeight: "600" }}
        >
          Migrate Events ({sampleEvents.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: "#D946EF",
          padding: 15,
          borderRadius: 10,
          marginBottom: 10,
          opacity: isLoading ? 0.5 : 1,
        }}
        onPress={migrateUsers}
        disabled={isLoading}
      >
        <Text
          style={{ color: "#FFFFFF", textAlign: "center", fontWeight: "600" }}
        >
          Migrate Users ({sampleUsers.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: "#D946EF",
          padding: 15,
          borderRadius: 10,
          marginBottom: 10,
          opacity: isLoading ? 0.5 : 1,
        }}
        onPress={migrateCoins}
        disabled={isLoading}
      >
        <Text
          style={{ color: "#FFFFFF", textAlign: "center", fontWeight: "600" }}
        >
          Migrate Coins ({sampleCoins.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: "#1C1C1C",
          borderWidth: 2,
          borderColor: "#D946EF",
          padding: 15,
          borderRadius: 10,
          marginBottom: 20,
          opacity: isLoading ? 0.5 : 1,
        }}
        onPress={migrateAll}
        disabled={isLoading}
      >
        <Text
          style={{ color: "#D946EF", textAlign: "center", fontWeight: "600" }}
        >
          Migrate All Data
        </Text>
      </TouchableOpacity>

      <Text style={{ color: "#666666", fontSize: 12 }}>
        Note: This will create the following Firebase collections:
        {"\n"}• events
        {"\n"}• users
        {"\n"}• coins
        {"\n"}• eventLocations (if needed)
        {"\n"}• achievements (if needed)
      </Text>
    </ScrollView>
  );
};

export default MigrationScreen;

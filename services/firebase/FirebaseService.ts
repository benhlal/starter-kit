// @ts-nocheck
// Note: This file contains Firebase service implementations that require @react-native-firebase packages
// It's currently disabled for TypeScript checking until Firebase is properly installed
// Remove @ts-nocheck when you install @react-native-firebase/firestore and @react-native-firebase/auth

// Remove placeholders and use actual RN Firebase modules
// import app from "@react-native-firebase/app";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { Event, EventLocation, Coin } from "../../types";

// Ensure default app exists if this file is imported before App.tsx
// Do not call initializeApp() without params; native config initializes automatically in RN

export class FirebaseService {
  // Collections
  private static EVENTS_COLLECTION = "events";
  private static EVENT_LOCATIONS_COLLECTION = "eventLocations";
  private static COINS_COLLECTION = "coins";
  private static USERS_COLLECTION = "users";

  // Helper method to safely convert Firebase document to plain object
  private static docToObject<T>(doc: any): T {
    const data = JSON.parse(
      JSON.stringify({
        id: doc.id,
        ...doc.data(),
      })
    );

    // Validate event location data if this is an Event
    if (data.type && data.status) {
      // This looks like an Event object
      if (
        !data.location ||
        typeof data.location.latitude !== "number" ||
        typeof data.location.longitude !== "number"
      ) {
        console.warn(
          `Event ${data.id} has invalid location data, using default Paris location`
        );
        data.location = {
          latitude: 48.8566,
          longitude: 2.3522,
          address: "Paris, France",
          venue: "Default Location",
          ...(data.location || {}),
        };
      }
    }

    return data as T;
  }

  // Events
  static async getEvents(): Promise<Event[]> {
    try {
      const snapshot = await firestore()
        .collection(this.EVENTS_COLLECTION)
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map((doc) => this.docToObject<Event>(doc));
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  }

  static async getEventById(id: string): Promise<Event | null> {
    try {
      const doc = await firestore()
        .collection(this.EVENTS_COLLECTION)
        .doc(id)
        .get();

      if (!doc.exists) {
        return null;
      }

      return this.docToObject<Event>(doc);
    } catch (error) {
      console.error(`Error fetching event ${id}:`, error);
      throw error;
    }
  }

  static async createEvent(event: Omit<Event, "id">): Promise<string> {
    try {
      const docRef = await firestore()
        .collection(this.EVENTS_COLLECTION)
        .add({
          ...event,
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

      return docRef.id;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  }

  // Event Locations
  static async getEventLocations(): Promise<EventLocation[]> {
    try {
      const snapshot = await firestore()
        .collection(this.EVENT_LOCATIONS_COLLECTION)
        .get();

      return snapshot.docs.map((doc) => this.docToObject<EventLocation>(doc));
    } catch (error) {
      console.error("Error fetching event locations:", error);
      throw error;
    }
  }

  // Coins
  static async getCoins(): Promise<Coin[]> {
    try {
      const snapshot = await firestore()
        .collection(this.COINS_COLLECTION)
        .get();

      return snapshot.docs.map((doc) => this.docToObject<Coin>(doc));
    } catch (error) {
      console.error("Error fetching coins:", error);
      throw error;
    }
  }

  static async getCoinsByRegion(region: string): Promise<Coin[]> {
    try {
      const snapshot = await firestore()
        .collection(this.COINS_COLLECTION)
        .where("region", "==", region)
        .get();

      return snapshot.docs.map((doc) => this.docToObject<Coin>(doc));
    } catch (error) {
      console.error(`Error fetching coins for region ${region}:`, error);
      throw error;
    }
  }

  static async collectCoin(coinId: string, userId: string): Promise<void> {
    try {
      const batch = firestore().batch();
      const coinRef = firestore().collection(this.COINS_COLLECTION).doc(coinId);
      batch.update(coinRef, {
        collected: true,
        collectedBy: userId,
        collectedAt: firestore.FieldValue.serverTimestamp(),
      });

      const userRef = firestore().collection(this.USERS_COLLECTION).doc(userId);
      batch.update(userRef, {
        totalCoins: firestore.FieldValue.increment(1),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      console.error(`Error collecting coin ${coinId}:`, error);
      throw error;
    }
  }

  // Users
  static async getUserProfile(userId: string) {
    try {
      const doc = await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .get();

      if (!doc.exists) {
        return null;
      }

      return this.docToObject(doc);
    } catch (error) {
      console.error(`Error fetching user profile ${userId}:`, error);
      throw error;
    }
  }

  static async createUserProfile(userId: string, profile: any) {
    try {
      await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .set({
          ...profile,
          totalCoins: 0,
          level: 1,
          eventsJoined: 0,
          achievements: [],
          createdAt: firestore.FieldValue.serverTimestamp(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error("Error creating user profile:", error);
      throw error;
    }
  }

  static async updateUserProfile(userId: string, updates: any) {
    try {
      await firestore()
        .collection(this.USERS_COLLECTION)
        .doc(userId)
        .update({
          ...updates,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    } catch (error) {
      console.error(`Error updating user profile ${userId}:`, error);
      throw error;
    }
  }

  // Authentication helpers
  static getCurrentUser() {
    return auth().currentUser;
  }

  static onAuthStateChanged(callback: (user: any) => void) {
    return auth().onAuthStateChanged(callback);
  }

  // Real-time listeners
  static subscribeToEvents(callback: (events: Event[]) => void) {
    return firestore()
      .collection(this.EVENTS_COLLECTION)
      .orderBy("createdAt", "desc")
      .onSnapshot(
        (snapshot) => {
          const events = snapshot.docs.map((doc) =>
            this.docToObject<Event>(doc)
          );
          callback(events);
        },
        (error) => {
          console.error("Events subscription error:", error);
        }
      );
  }

  static subscribeToUserProfile(
    userId: string,
    callback: (profile: any) => void
  ) {
    return firestore()
      .collection(this.USERS_COLLECTION)
      .doc(userId)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            callback(this.docToObject(doc));
          }
        },
        (error) => {
          console.error("User profile subscription error:", error);
        }
      );
  }

  // Additional methods for data migration
  static async createUser(userData: any): Promise<string> {
    try {
      const docRef = await firestore()
        .collection(this.USERS_COLLECTION)
        .add(userData);
      return docRef.id;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  static async createEventLocation(locationData: any): Promise<string> {
    try {
      const docRef = await firestore()
        .collection(this.EVENT_LOCATIONS_COLLECTION)
        .add(locationData);
      return docRef.id;
    } catch (error) {
      console.error("Error creating event location:", error);
      throw error;
    }
  }

  static async createCoin(coinData: any): Promise<string> {
    try {
      const docRef = await firestore()
        .collection(this.COINS_COLLECTION)
        .add(coinData);
      return docRef.id;
    } catch (error) {
      console.error("Error creating coin:", error);
      throw error;
    }
  }

  static async createAchievement(achievementData: any): Promise<string> {
    try {
      const docRef = await firestore()
        .collection("achievements")
        .add(achievementData);
      return docRef.id;
    } catch (error) {
      console.error("Error creating achievement:", error);
      throw error;
    }
  }

  static async createRegion(regionData: any): Promise<string> {
    try {
      const docRef = await firestore().collection("regions").add(regionData);
      return docRef.id;
    } catch (error) {
      console.error("Error creating region:", error);
      throw error;
    }
  }

  static async createLeaderboard(leaderboardData: any): Promise<string> {
    try {
      const docRef = await firestore()
        .collection("leaderboards")
        .add(leaderboardData);
      return docRef.id;
    } catch (error) {
      console.error("Error creating leaderboard:", error);
      throw error;
    }
  }

  static async clearCollection(collectionName: string): Promise<void> {
    try {
      const snapshot = await firestore().collection(collectionName).get();
      const batch = firestore().batch();

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`Cleared ${snapshot.size} documents from ${collectionName}`);
    } catch (error) {
      console.error(`Error clearing collection ${collectionName}:`, error);
      throw error;
    }
  }
}

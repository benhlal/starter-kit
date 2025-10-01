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

  // Events
  static async getEvents(): Promise<Event[]> {
    try {
      const snapshot = await firestore()
        .collection(this.EVENTS_COLLECTION)
        .orderBy("createdAt", "desc")
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];
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

      return { id: doc.id, ...doc.data() } as Event;
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

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EventLocation[];
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

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Coin[];
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

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Coin[];
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

      return {
        id: doc.id,
        ...doc.data(),
      };
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
          const events = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Event[];
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
            callback({
              id: doc.id,
              ...doc.data(),
            });
          }
        },
        (error) => {
          console.error("User profile subscription error:", error);
        }
      );
  }
}

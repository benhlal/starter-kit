// @ts-nocheck
// Note: This file contains Firebase service implementations that require @react-native-firebase packages
// It's currently disabled for TypeScript checking until Firebase is properly installed
// Remove @ts-nocheck when you install @react-native-firebase/firestore and @react-native-firebase/auth

// Remove placeholders and use actual RN Firebase modules
// import app from "@react-native-firebase/app";
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import { Event, EventLocation, Coin, ARObject } from "../../types";

// Ensure default app exists if this file is imported before App.tsx
// Do not call initializeApp() without params; native config initializes automatically in RN

export class FirebaseService {
  // Collections
  private static EVENTS_COLLECTION = "events";
  private static EVENT_LOCATIONS_COLLECTION = "eventLocations";
  private static COINS_COLLECTION = "coins";
  private static USERS_COLLECTION = "users";
  private static AR_OBJECTS_COLLECTION = "arObjects";

  // Remove undefined values recursively (Firestore does not allow undefined fields)
  private static stripUndefined(input: any): any {
    if (input === undefined) {
      return undefined;
    }
    if (input === null) {
      return null;
    }
    if (Array.isArray(input)) {
      return input
        .map((v) => this.stripUndefined(v))
        .filter((v) => v !== undefined);
    }
    if (typeof input === "object") {
      const out: any = {};
      for (const [k, v] of Object.entries(input)) {
        const sv = this.stripUndefined(v);
        if (sv !== undefined) {
          out[k] = sv;
        }
      }
      return out;
    }
    return input;
  }

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
        .add(
          this.stripUndefined({
            // Strip undefined fields
            ...event,
            createdAt: firestore.FieldValue.serverTimestamp(),
            updatedAt: firestore.FieldValue.serverTimestamp(),
          })
        );

      return docRef.id;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  }

  static async updateEvent(
    eventId: string,
    updates: Partial<Event>
  ): Promise<void> {
    try {
      await firestore()
        .collection(this.EVENTS_COLLECTION)
        .doc(eventId)
        .update(
          this.stripUndefined({
            ...updates,
            updatedAt: firestore.FieldValue.serverTimestamp(),
          })
        );
    } catch (error) {
      console.error(`Error updating event ${eventId}:`, error);
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

  static async getCoinById(id: string): Promise<Coin | null> {
    try {
      const docRef = await firestore()
        .collection(this.COINS_COLLECTION)
        .doc(id)
        .get();
      if (!docRef.exists) {
        return null;
      }
      return this.docToObject<Coin>(docRef);
    } catch (error) {
      console.error(`Error fetching coin ${id}:`, error);
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

  static async getCoinsForEvent(eventId: string): Promise<Coin[]> {
    try {
      const snapshot = await firestore()
        .collection(this.COINS_COLLECTION)
        .where("eventId", "==", eventId)
        .where("collectible", "==", true)
        .get();

      return snapshot.docs.map((doc) => this.docToObject<Coin>(doc));
    } catch (error) {
      console.error(`Error fetching coins for event ${eventId}:`, error);
      throw error;
    }
  }

  static subscribeToEventCoins(
    eventId: string,
    callback: (coins: Coin[]) => void
  ) {
    try {
      console.log(`[FIREBASE] Setting up subscription for eventId: ${eventId}`);
      const unsub = firestore()
        .collection(this.COINS_COLLECTION)
        .where("eventId", "==", eventId)
        .onSnapshot(
          (snapshot) => {
            console.log(
              `[FIREBASE] Received ${snapshot.docs.length} documents for event ${eventId}`
            );
            const coins = snapshot.docs.map((doc) => {
              const coinData = this.docToObject<Coin>(doc);
              console.log(`[FIREBASE] Coin document:`, coinData);
              return coinData;
            });
            console.log(
              `[FIREBASE] Calling callback with ${coins.length} coins`
            );
            callback(coins);
          },
          (error) => {
            console.error(
              `Coins subscription error for event ${eventId}:`,
              error
            );
          }
        );
      return unsub;
    } catch (error) {
      console.error(
        `Failed to subscribe to coins for event ${eventId}:`,
        error
      );
      return () => {};
    }
  }

  static async getLatestCoins(
    limit: number = 1,
    eventId?: string
  ): Promise<Coin[]> {
    try {
      let query = firestore().collection(this.COINS_COLLECTION) as any;
      if (eventId) {
        query = query.where("eventId", "==", eventId);
      }
      const snapshot = await query
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
      return snapshot.docs.map((doc: any) => this.docToObject<Coin>(doc));
    } catch (error) {
      console.error("Error fetching latest coins:", error);
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

  static async deleteCoin(coinId: string): Promise<void> {
    try {
      await firestore().collection(this.COINS_COLLECTION).doc(coinId).delete();
    } catch (error) {
      console.error(`Error deleting coin ${coinId}:`, error);
      throw error;
    }
  }

  static async deleteCoinsForEvent(eventId: string): Promise<number> {
    try {
      const snapshot = await firestore()
        .collection(this.COINS_COLLECTION)
        .where("eventId", "==", eventId)
        .get();
      const docs = snapshot.docs;
      if (docs.length === 0) {
        return 0;
      }
      // Firestore batch limit is 500; chunk to 400 for safety
      const chunkSize = 400;
      let deleted = 0;
      for (let i = 0; i < docs.length; i += chunkSize) {
        const batch = firestore().batch();
        for (const doc of docs.slice(i, i + chunkSize)) {
          batch.delete(doc.ref);
          deleted += 1;
        }
        await batch.commit();
      }
      return deleted;
    } catch (error) {
      console.error(`Error deleting coins for event ${eventId}:`, error);
      throw error;
    }
  }

  static async deleteEvent(eventId: string): Promise<void> {
    try {
      console.log(
        `[Firebase] Deleting event ${eventId} and all associated data`
      );

      // Delete all coins for this event first
      const deletedCoins = await this.deleteCoinsForEvent(eventId);
      console.log(
        `[Firebase] Deleted ${deletedCoins} coins for event ${eventId}`
      );

      // Remove event from all users' joinedEvents arrays
      const usersSnapshot = await firestore()
        .collection(this.USERS_COLLECTION)
        .where("joinedEvents", "array-contains", eventId)
        .get();

      if (!usersSnapshot.empty) {
        const batch = firestore().batch();
        usersSnapshot.docs.forEach((userDoc) => {
          batch.update(userDoc.ref, {
            joinedEvents: firestore.FieldValue.arrayRemove(eventId),
            updatedAt: firestore.FieldValue.serverTimestamp(),
          });
        });
        await batch.commit();
        console.log(
          `[Firebase] Removed event ${eventId} from ${usersSnapshot.docs.length} users`
        );
      }

      // Finally delete the event document
      await firestore()
        .collection(this.EVENTS_COLLECTION)
        .doc(eventId)
        .delete();
      console.log(`[Firebase] Event ${eventId} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting event ${eventId}:`, error);
      throw error;
    }
  }

  static async joinEvent(userId: string, eventId: string): Promise<void> {
    try {
      const batch = firestore().batch();
      const userRef = firestore().collection(this.USERS_COLLECTION).doc(userId);
      const eventRef = firestore()
        .collection(this.EVENTS_COLLECTION)
        .doc(eventId);

      batch.update(userRef, {
        joinedEvents: firestore.FieldValue.arrayUnion(eventId),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      batch.update(eventRef, {
        currentParticipants: firestore.FieldValue.increment(1),
        participants: firestore.FieldValue.arrayUnion(userId),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();
    } catch (error) {
      console.error(`Error joining event ${eventId}:`, error);
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

  // AR Objects
  static async createARObject(
    data: Omit<ARObject, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const payload = this.stripUndefined({
        ...data,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      const docRef = await firestore()
        .collection(this.AR_OBJECTS_COLLECTION)
        .add(payload);
      return docRef.id;
    } catch (error) {
      console.error("Error creating AR object:", error);
      throw error;
    }
  }

  static async updateARObject(
    id: string,
    updates: Partial<ARObject>
  ): Promise<void> {
    try {
      const payload = this.stripUndefined({
        ...updates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      await firestore()
        .collection(this.AR_OBJECTS_COLLECTION)
        .doc(id)
        .update(payload);
    } catch (error) {
      console.error(`Error updating AR object ${id}:`, error);
      throw error;
    }
  }

  static async getUserARObjects(
    userId: string,
    options?: { limit?: number; activeOnly?: boolean }
  ): Promise<ARObject[]> {
    try {
      let query: any = firestore()
        .collection(this.AR_OBJECTS_COLLECTION)
        .where("userId", "==", userId);
      if (options?.activeOnly) {
        query = query.where("active", "==", true);
      }
      const snapshot = await query.get();
      const items = snapshot.docs.map((doc: any) =>
        this.docToObject<ARObject>(doc)
      );
      const toMs = (x: any) => {
        const t: any = (x as any).createdAt || (x as any).updatedAt;
        if (!t) {
          return 0;
        }
        if (typeof t === "string") {
          return Date.parse(t) || 0;
        }
        const s = (t.seconds ?? t._seconds) as number | undefined;
        const ns = (t.nanoseconds ?? t._nanoseconds ?? 0) as number;
        if (typeof s === "number") {
          return s * 1000 + Math.floor(ns / 1e6);
        }
        return 0;
      };
      items.sort((a, b) => toMs(b) - toMs(a));
      return options?.limit ? items.slice(0, options.limit) : items;
    } catch (error) {
      console.error("Error fetching user AR objects:", error);
      throw error;
    }
  }

  static async getLatestUserARObject(
    userId: string,
    type?: ARObject["type"]
  ): Promise<ARObject | null> {
    try {
      let query: any = firestore()
        .collection(this.AR_OBJECTS_COLLECTION)
        .where("userId", "==", userId);
      if (type) {
        query = query.where("type", "==", type);
      }
      const snapshot = await query.get();
      if (snapshot.empty) {
        return null;
      }
      const items = snapshot.docs.map((doc: any) =>
        this.docToObject<ARObject>(doc)
      );
      const toMs = (x: any) => {
        const t: any = (x as any).createdAt || (x as any).updatedAt;
        if (!t) {
          return 0;
        }
        if (typeof t === "string") {
          return Date.parse(t) || 0;
        }
        const s = (t.seconds ?? t._seconds) as number | undefined;
        const ns = (t.nanoseconds ?? t._nanoseconds ?? 0) as number;
        if (typeof s === "number") {
          return s * 1000 + Math.floor(ns / 1e6);
        }
        return 0;
      };
      items.sort((a, b) => toMs(b) - toMs(a));
      return items[0] ?? null;
    } catch (error) {
      console.error("Error fetching latest user AR object:", error);
      throw error;
    }
  }

  static async upsertUserSpawnARObject(params: {
    userId: string;
    latitude: number;
    longitude: number;
    rotation?: { yaw?: number; pitch?: number; roll?: number };
    scale?: number;
    metadata?: Record<string, any>;
  }): Promise<string> {
    const { userId, latitude, longitude, rotation, scale, metadata } = params;
    try {
      // find active spawn
      const snapshot = await firestore()
        .collection(this.AR_OBJECTS_COLLECTION)
        .where("userId", "==", userId)
        .where("type", "==", "spawn")
        .where("active", "==", true)
        .limit(1)
        .get();
      if (snapshot.empty) {
        const id = await this.createARObject({
          userId,
          type: "spawn",
          model: "coin",
          location: { latitude, longitude },
          rotation,
          scale,
          active: true,
          metadata,
        } as any);
        return id;
      }
      const ref = snapshot.docs[0].ref;
      const payload = this.stripUndefined({
        location: { latitude, longitude },
        rotation,
        scale,
        metadata,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      await ref.update(payload);
      return ref.id;
    } catch (error) {
      console.error("Error upserting user spawn AR object:", error);
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
      console.log("[FIREBASE] Creating coin with data:", coinData);
      const docRef = await firestore()
        .collection(this.COINS_COLLECTION)
        .add(coinData);
      console.log(`[FIREBASE] Coin created successfully with ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error("Error creating coin:", error);
      throw error;
    }
  }

  static async createEventCoin(params: {
    eventId: string;
    createdBy: string;
    latitude: number;
    longitude: number;
    value?: number;
    type?: string;
    rarity?: string;
  }): Promise<string> {
    const {
      eventId,
      createdBy,
      latitude,
      longitude,
      value = 10,
      type = "event",
      rarity = "common",
    } = params as any;
    try {
      const id = await this.createCoin({
        eventId,
        createdBy,
        value,
        type,
        rarity,
        region: "global",
        location: { latitude, longitude },
        collectible: true,
        collected: false,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      return id;
    } catch (error) {
      console.error("Error creating event coin:", error);
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

  static async createMockCoins(eventId: string): Promise<string[]> {
    try {
      const centerLat = 48.834667;
      const centerLon = 2.492917;
      const createdBy = this.getCurrentUser()?.uid || "mock-user";

      // Create 5 mock coins at 1-2 meter distances around exact position
      const coinIds: string[] = [];
      const positions = [
        { lat: centerLat + 0.000009, lon: centerLon }, // ~1m North
        { lat: centerLat + 0.000018, lon: centerLon }, // ~2m North
        { lat: centerLat, lon: centerLon + 0.000012 }, // ~1m East
        { lat: centerLat, lon: centerLon - 0.000024 }, // ~2m West
        { lat: centerLat - 0.000009, lon: centerLon + 0.000012 }, // ~1.5m SE
      ];

      for (let i = 0; i < 5; i++) {
        const pos = positions[i];
        const mockCoin = {
          id: `mock${i + 1}`,
          name: `Mock${i + 1} (${pos.lat.toFixed(6)}, ${pos.lon.toFixed(6)})`,
          eventId: eventId,
          createdBy: createdBy,
          location: {
            latitude: pos.lat,
            longitude: pos.lon,
          },
          latitude: pos.lat,
          longitude: pos.lon,
          value: 10,
          type: "mock",
          rarity: "common",
          collected: false,
          collectible: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const docRef = await firestore()
          .collection(this.COINS_COLLECTION)
          .add(this.stripUndefined(mockCoin));
        coinIds.push(docRef.id);
      }

      console.log(
        `[Firebase] Created ${coinIds.length} mock coins for event ${eventId}:`,
        coinIds
      );
      console.log("[Firebase] Mock coin positions:", positions);
      return coinIds;
    } catch (error) {
      console.error("[Firebase] Error creating mock coins:", error);
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

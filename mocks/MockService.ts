import {
  mockEvents,
  mockEventLocations,
  mockCoins,
  mockUserProfiles,
} from "./data/mockResponses";
import { Event, EventLocation, Coin } from "../types";

// Simulate network delay
const simulateDelay = (ms: number = 1000): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Simulate network errors occasionally
const simulateNetworkError = (errorRate: number = 0.1): void => {
  if (Math.random() < errorRate) {
    throw new Error("Network error: Failed to fetch data");
  }
};

export class MockService {
  private static isOffline: boolean = false;

  // Configuration
  static setOfflineMode(offline: boolean) {
    this.isOffline = offline;
  }

  static getOfflineMode(): boolean {
    return this.isOffline;
  }

  // Events
  static async getEvents(): Promise<Event[]> {
    if (this.isOffline) {
      throw new Error("Offline: Cannot fetch events");
    }

    await simulateDelay(800);
    simulateNetworkError(0.05); // 5% error rate

    return mockEvents;
  }

  static async getEventById(id: string): Promise<Event | null> {
    if (this.isOffline) {
      throw new Error("Offline: Cannot fetch event");
    }

    await simulateDelay(500);
    simulateNetworkError(0.03);

    return mockEvents.find((event) => event.id === id) || null;
  }

  static async createEvent(event: Omit<Event, "id">): Promise<string> {
    if (this.isOffline) {
      throw new Error("Offline: Cannot create event");
    }

    await simulateDelay(1200);
    simulateNetworkError(0.08);

    const newId = `event_${Date.now()}`;
    const newEvent = {
      id: newId,
      ...event,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Simulate adding to mock data
    mockEvents.push(newEvent as Event);

    return newId;
  }

  static async joinEvent(eventId: string, userId: string): Promise<void> {
    if (this.isOffline) {
      throw new Error("Offline: Cannot join event");
    }

    await simulateDelay(600);
    simulateNetworkError(0.05);

    // Simulate joining logic
    console.log(`User ${userId} joined event ${eventId}`);
  }

  // Event Locations
  static async getEventLocations(): Promise<EventLocation[]> {
    if (this.isOffline) {
      throw new Error("Offline: Cannot fetch event locations");
    }

    await simulateDelay(700);
    simulateNetworkError(0.04);

    return mockEventLocations;
  }

  // Coins
  static async getCoins(): Promise<Coin[]> {
    if (this.isOffline) {
      throw new Error("Offline: Cannot fetch coins");
    }

    await simulateDelay(650);
    simulateNetworkError(0.06);

    return mockCoins;
  }

  static async getCoinsByRegion(region: string): Promise<Coin[]> {
    if (this.isOffline) {
      throw new Error("Offline: Cannot fetch coins by region");
    }

    await simulateDelay(550);
    simulateNetworkError(0.04);

    return mockCoins.filter((coin) => coin.region === region);
  }

  static async collectCoin(coinId: string, userId: string): Promise<void> {
    if (this.isOffline) {
      throw new Error("Offline: Cannot collect coin");
    }

    await simulateDelay(800);
    simulateNetworkError(0.07);

    // Simulate coin collection
    const coin = mockCoins.find((c) => c.id === coinId);
    if (coin && !coin.collected) {
      coin.collected = true;
      coin.collectedBy = userId;
      coin.collectedAt = new Date().toISOString();

      // Update user coins
      const user = mockUserProfiles.find((u) => u.id === userId);
      if (user) {
        user.totalCoins += coin.value;
        user.level = Math.floor(user.totalCoins / 10) + 1;
      }
    } else {
      throw new Error("Coin already collected or not found");
    }
  }

  // Users
  static async getUserProfile(userId: string) {
    if (this.isOffline) {
      throw new Error("Offline: Cannot fetch user profile");
    }

    await simulateDelay(400);
    simulateNetworkError(0.03);

    return mockUserProfiles.find((profile) => profile.id === userId) || null;
  }

  static async createUserProfile(userId: string, profile: any) {
    if (this.isOffline) {
      throw new Error("Offline: Cannot create user profile");
    }

    await simulateDelay(1000);
    simulateNetworkError(0.08);

    const newProfile = {
      id: userId,
      ...profile,
      totalCoins: 0,
      level: 1,
      eventsJoined: 0,
      achievements: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockUserProfiles.push(newProfile);
    return newProfile;
  }

  static async updateUserProfile(userId: string, updates: any) {
    if (this.isOffline) {
      throw new Error("Offline: Cannot update user profile");
    }

    await simulateDelay(600);
    simulateNetworkError(0.05);

    const userIndex = mockUserProfiles.findIndex((u) => u.id === userId);
    if (userIndex !== -1) {
      mockUserProfiles[userIndex] = {
        ...mockUserProfiles[userIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      return mockUserProfiles[userIndex];
    }

    throw new Error("User not found");
  }

  // Search and filtering
  static async searchEvents(query: string): Promise<Event[]> {
    if (this.isOffline) {
      throw new Error("Offline: Cannot search events");
    }

    await simulateDelay(450);
    simulateNetworkError(0.04);

    const q = query.toLowerCase();
    return mockEvents.filter((event) => {
      const title = (event.title ?? event.name ?? "").toLowerCase();
      const desc = (event.description ?? "").toLowerCase();
      const tags = (event.tags ?? []).join(" ").toLowerCase();
      return title.includes(q) || desc.includes(q) || tags.includes(q);
    });
  }

  static async getEventsByCategory(category: string): Promise<Event[]> {
    if (this.isOffline) {
      throw new Error("Offline: Cannot fetch events by category");
    }

    await simulateDelay(500);
    simulateNetworkError(0.04);

    const cat = category.toLowerCase();
    return mockEvents.filter((event) =>
      (event.tags ?? []).some((t) => t.toLowerCase() === cat)
    );
  }

  static async getNearbyEvents(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<Event[]> {
    if (this.isOffline) {
      throw new Error("Offline: Cannot fetch nearby events");
    }

    await simulateDelay(600);
    simulateNetworkError(0.05);

    // Simple distance calculation (not accurate for real use)
    return mockEvents.filter((event) => {
      const loc = event.location ?? event.coordinate;
      if (!loc) {
        return false;
      }
      const distance = Math.sqrt(
        Math.pow(loc.latitude - latitude, 2) +
          Math.pow(loc.longitude - longitude, 2)
      );
      return distance <= radius;
    });
  }

  // Statistics
  static async getUserStats(userId: string) {
    if (this.isOffline) {
      throw new Error("Offline: Cannot fetch user stats");
    }

    await simulateDelay(400);
    simulateNetworkError(0.03);

    const user = mockUserProfiles.find((u) => u.id === userId);
    const userCoins = mockCoins.filter((coin) => coin.collectedBy === userId);

    return {
      totalCoins: user?.totalCoins || 0,
      level: user?.level || 1,
      eventsJoined: user?.eventsJoined || 0,
      coinsCollected: userCoins.length,
      achievements: user?.achievements || [],
      rank: mockUserProfiles.findIndex((u) => u.id === userId) + 1,
      totalUsers: mockUserProfiles.length,
    };
  }

  // Batch operations
  static async batchGetData() {
    if (this.isOffline) {
      throw new Error("Offline: Cannot fetch batch data");
    }

    await simulateDelay(1500);
    simulateNetworkError(0.08);

    return {
      events: mockEvents,
      eventLocations: mockEventLocations,
      coins: mockCoins,
      timestamp: new Date().toISOString(),
    };
  }
}

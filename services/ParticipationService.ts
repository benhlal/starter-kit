import firestore from "@react-native-firebase/firestore";
import { getAuth } from "@react-native-firebase/auth";

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  coins: number;
  joinedEvents: string[];
  collectedCoins?: string[]; // IDs of coins collected by user
  participationHistory: {
    eventId: string;
    eventName: string;
    participatedAt: any; // Firebase Timestamp
    fee: number;
    status: "active" | "completed" | "refunded";
  }[];
}

export class ParticipationService {
  private static instance: ParticipationService;

  public static getInstance(): ParticipationService {
    if (!ParticipationService.instance) {
      ParticipationService.instance = new ParticipationService();
    }
    return ParticipationService.instance;
  }

  async getCurrentUser(): Promise<string | null> {
    const auth = getAuth();
    return auth.currentUser?.uid || null;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await firestore().collection("users").doc(userId).get();

      if (!userDoc.exists) {
        // Initialize new user profile with starting coins
        const newProfile: Partial<UserProfile> = {
          id: userId,
          coins: 1000, // Starting coins for new users
          joinedEvents: [],
          participationHistory: [],
          collectedCoins: [], // Initialize collected coins array
        };

        await firestore()
          .collection("users")
          .doc(userId)
          .set(newProfile, { merge: true });
        return newProfile as UserProfile;
      }

      const data = userDoc.data() as UserProfile;
      return {
        ...data,
        coins: data.coins || 1000, // Ensure coins field exists
        joinedEvents: data.joinedEvents || [],
        participationHistory: data.participationHistory || [],
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  }

  async hasCollectedCoinsFromEvent(
    userId: string,
    eventId: string
  ): Promise<boolean> {
    try {
      // Check if user has collected any coins from this specific event
      const coinsSnapshot = await firestore()
        .collection("coins")
        .where("collectedBy", "==", userId)
        .where("eventId", "==", eventId) // Assuming coins have eventId field
        .get();

      return !coinsSnapshot.empty;
    } catch (error) {
      console.error("Error checking collected coins:", error);
      // Fallback: check user profile's collectedCoins array
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile?.collectedCoins) {
        return false;
      }

      // For now, assume any collected coins count (we'd need event-specific tracking)
      return userProfile.collectedCoins.length > 0;
    }
  }

  // Calculate join fee based on event timing
  calculateJoinFee(event: any, baseFee: number): number {
    const now = Date.now();
    const startTime = this.getEventStartTime(event);

    if (!startTime) {
      return baseFee; // Default if no start time
    }

    const isOngoing = startTime <= now;

    if (isOngoing) {
      // Event is ongoing: add 10 extra coins penalty
      return baseFee + 10;
    } else {
      // Event hasn't started: normal fee
      return baseFee;
    }
  }

  // Calculate refund amount when leaving event
  calculateLeaveRefund(
    event: any,
    originalFee: number,
    hasCollectedCoins: boolean
  ): { refund: number; explanation: string } {
    const now = Date.now();
    const startTime = this.getEventStartTime(event);

    if (!startTime) {
      return {
        refund: originalFee,
        explanation: "Full refund (no start time)",
      };
    }

    const isOngoing = startTime <= now;

    if (hasCollectedCoins) {
      // User collected coins: full refund + keep collected coins
      return {
        refund: originalFee,
        explanation: "Full refund + keep collected coins",
      };
    }

    if (isOngoing) {
      // Event ongoing, no coins collected: lose join fee
      return {
        refund: 0,
        explanation: "No refund - event already started",
      };
    } else {
      // Event not started, no coins collected
      const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);

      if (hoursUntilStart >= 5) {
        // 5+ hours before start: free to leave
        return {
          refund: originalFee,
          explanation: "Free cancellation (5+ hours before start)",
        };
      } else {
        // Less than 5 hours: lose 2 coins per hour
        const hoursRemaining = Math.max(0, hoursUntilStart);
        const penaltyHours = 5 - hoursRemaining;
        const penalty = Math.floor(penaltyHours * 2);
        const refund = Math.max(0, originalFee - penalty);

        return {
          refund,
          explanation: `Cancellation fee: ${penalty} coins (${penaltyHours.toFixed(
            1
          )}h penalty)`,
        };
      }
    }
  }

  // Helper to get event start time
  private getEventStartTime(event: any): number | null {
    if (!event.startDate) {
      return null;
    }

    try {
      // Handle Firebase Timestamp objects
      if (typeof event.startDate === "object" && event.startDate !== null) {
        if (typeof event.startDate.toDate === "function") {
          return event.startDate.toDate().getTime();
        }
        if (typeof event.startDate.seconds === "number") {
          return event.startDate.seconds * 1000;
        }
      }

      // Handle ISO string dates
      const timestamp = Date.parse(event.startDate);
      return Number.isNaN(timestamp) ? null : timestamp;
    } catch (error) {
      console.warn("Error parsing event start date:", error);
      return null;
    }
  }

  async participateInEvent(
    eventId: string,
    eventName: string,
    event: any,
    baseFee: number
  ): Promise<{ success: boolean; fee: number; message: string }> {
    const userId = await this.getCurrentUser();
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const actualFee = this.calculateJoinFee(event, baseFee);
    const batch = firestore().batch();

    try {
      // Get user profile and check balance
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile || userProfile.coins < actualFee) {
        return {
          success: false,
          fee: actualFee,
          message: `Insufficient coins. Need ${actualFee} coins.`,
        };
      }

      // Check if already participating
      if (userProfile.joinedEvents.includes(eventId)) {
        return {
          success: false,
          fee: actualFee,
          message: "Already participating in this event",
        };
      }

      // Update user profile
      const userRef = firestore().collection("users").doc(userId);
      batch.update(userRef, {
        coins: userProfile.coins - actualFee,
        joinedEvents: [...userProfile.joinedEvents, eventId],
        participationHistory: [
          ...userProfile.participationHistory,
          {
            eventId,
            eventName,
            participatedAt: firestore.Timestamp.now(),
            fee: actualFee,
            baseFee,
            status: "active",
          },
        ],
      });

      // Update event participant count
      const eventRef = firestore().collection("events").doc(eventId);
      batch.update(eventRef, {
        currentParticipants: firestore.FieldValue.increment(1),
        participants: firestore.FieldValue.arrayUnion(userId),
      });

      // Create participation record
      const participationRef = firestore().collection("participations").doc();
      batch.set(participationRef, {
        userId,
        eventId,
        eventName,
        participationFee: actualFee,
        baseFee,
        participatedAt: firestore.Timestamp.now(),
        status: "active",
      });

      await batch.commit();

      const startTime = this.getEventStartTime(event);
      const isOngoing = startTime ? startTime <= Date.now() : false;
      const message = isOngoing
        ? `Joined ongoing event! Fee: ${actualFee} coins (${baseFee} + 10 late fee)`
        : `Joined event! Fee: ${actualFee} coins`;

      return {
        success: true,
        fee: actualFee,
        message,
      };
    } catch (error) {
      console.error("Error participating in event:", error);
      throw error;
    }
  }

  async leaveEvent(
    eventId: string,
    event: any,
    hasCollectedCoins: boolean = false
  ): Promise<{ success: boolean; refund: number; message: string }> {
    const userId = await this.getCurrentUser();
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const batch = firestore().batch();

    try {
      // Get user profile
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile || !userProfile.joinedEvents.includes(eventId)) {
        return {
          success: false,
          refund: 0,
          message: "Not participating in this event",
        };
      }

      // Find participation record to get fee amount
      const participationRecord = userProfile.participationHistory.find(
        (p) => p.eventId === eventId && p.status === "active"
      );

      if (!participationRecord) {
        return {
          success: false,
          refund: 0,
          message: "Participation record not found",
        };
      }

      // Calculate refund based on sophisticated logic
      const { refund, explanation } = this.calculateLeaveRefund(
        event,
        participationRecord.fee,
        hasCollectedCoins
      );

      // Update user profile
      const userRef = firestore().collection("users").doc(userId);
      batch.update(userRef, {
        coins: userProfile.coins + refund,
        joinedEvents: userProfile.joinedEvents.filter((id) => id !== eventId),
        participationHistory: userProfile.participationHistory.map((p) =>
          p.eventId === eventId
            ? { ...p, status: "refunded", refundAmount: refund }
            : p
        ),
      });

      // Update event participant count
      const eventRef = firestore().collection("events").doc(eventId);
      batch.update(eventRef, {
        currentParticipants: firestore.FieldValue.increment(-1),
        participants: firestore.FieldValue.arrayRemove(userId),
      });

      // Update participation record
      const participationQuery = await firestore()
        .collection("participations")
        .where("userId", "==", userId)
        .where("eventId", "==", eventId)
        .where("status", "==", "active")
        .get();

      if (!participationQuery.empty) {
        const participationDoc = participationQuery.docs[0];
        batch.update(participationDoc.ref, {
          status: "refunded",
          refundedAt: firestore.Timestamp.now(),
          refundAmount: refund,
          refundReason: explanation,
        });
      }

      await batch.commit();

      return {
        success: true,
        refund,
        message: explanation,
      };
    } catch (error) {
      console.error("Error leaving event:", error);
      throw error;
    }
  }

  async isUserParticipating(eventId: string): Promise<boolean> {
    const userId = await this.getCurrentUser();
    if (!userId) {
      return false;
    }

    try {
      const userProfile = await this.getUserProfile(userId);
      return userProfile?.joinedEvents.includes(eventId) || false;
    } catch (error) {
      console.error("Error checking participation:", error);
      return false;
    }
  }

  async getUserCoins(): Promise<number> {
    const userId = await this.getCurrentUser();
    if (!userId) {
      return 0;
    }

    try {
      const userProfile = await this.getUserProfile(userId);
      return userProfile?.coins || 0;
    } catch (error) {
      console.error("Error fetching user coins:", error);
      return 0;
    }
  }

  // Admin function to award coins to a user
  async awardCoins(
    userId: string,
    amount: number,
    reason: string
  ): Promise<boolean> {
    try {
      const userRef = firestore().collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const currentCoins = userDoc.data()?.coins || 0;

      await userRef.update({
        coins: currentCoins + amount,
        coinHistory: firestore.FieldValue.arrayUnion({
          amount,
          reason,
          timestamp: firestore.Timestamp.now(),
          type: "award",
        }),
      });

      return true;
    } catch (error) {
      console.error("Error awarding coins:", error);
      return false;
    }
  }
}

export const participationService = ParticipationService.getInstance();

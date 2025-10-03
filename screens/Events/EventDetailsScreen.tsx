import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { FirebaseService } from "../../services/firebase/FirebaseService";
import { useEvents, useUserProfile } from "../../state/recoil/hooks";
import { isAdmin } from "../../utils/userRoles";
import { Coin, Event } from "../../types";
import { participationService } from "../../services/ParticipationService";

interface EventDetailsScreenProps {
  eventId: string;
  onClose?: () => void;
  onStartHunt?: (eventId: string) => void;
}

const EventDetailsScreen: React.FC<EventDetailsScreenProps> = ({
  eventId,
  onClose,
  onStartHunt,
}) => {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [joiningEvent, setJoiningEvent] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const { deleteEvent } = useEvents();
  const { userProfile, fetchUserProfile } = useUserProfile();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const ev = await FirebaseService.getEventById(eventId);
        const cs = await FirebaseService.getCoinsForEvent(eventId);
        if (!cancelled) {
          setEvent(ev);
          setCoins(cs || []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load event");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const stats = useMemo(() => {
    const total = coins.length;
    const collected = coins.filter((c) => !!c.collected).length;
    const remaining = coins.filter((c) => c.collectible && !c.collected);
    const remainingCount = remaining.length;
    const totalAmountRemaining = remaining.reduce(
      (sum, c) => sum + (c.value || 0),
      0
    );
    const participantsInEvent =
      (event?.currentParticipants ?? event?.participants?.length) || 0;
    const remainingSlots =
      (event?.maxParticipants ?? 0) > 0
        ? Math.max(0, (event!.maxParticipants as number) - participantsInEvent)
        : null;
    return {
      total,
      collected,
      remainingCount,
      totalAmountRemaining,
      participantsInEvent,
      remainingSlots,
    };
  }, [coins, event]);

  // Check if user has joined this event
  const isUserJoined = useMemo(() => {
    const userJoinedEvents: string[] = userProfile?.joinedEvents || [];
    return userJoinedEvents.includes(eventId);
  }, [userProfile?.joinedEvents, eventId]);

  // Check if event is currently ongoing
  const isEventOngoing = useMemo(() => {
    if (!event) {
      return false;
    }
    const now = Date.now();
    const startMs = event.startDate ? new Date(event.startDate).getTime() : 0;
    const endMs = event.endDate ? new Date(event.endDate).getTime() : 0;
    return startMs <= now && now <= endMs;
  }, [event]);

  const handleJoinEvent = async () => {
    if (!event) {
      return;
    }

    setJoiningEvent(true);
    try {
      const user = FirebaseService.getCurrentUser?.();
      if (!user?.uid) {
        Alert.alert("Error", "Please log in to join events");
        return;
      }

      // Use ParticipationService for proper join logic with fees
      const baseFee = 10; // Default base fee
      const result = await participationService.participateInEvent(
        eventId,
        event.name || event.title || "Event",
        event,
        baseFee
      );

      if (result.success) {
        Alert.alert("Success", result.message);
        // Refresh user profile to update joined events
        await fetchUserProfile(user.uid);
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (joinError) {
      console.error("Error joining event:", joinError);
      Alert.alert("Error", "Failed to join event. Please try again.");
    } finally {
      setJoiningEvent(false);
    }
  };

  const handleLeaveEvent = async () => {
    if (!event) {
      return;
    }

    Alert.alert(
      "Leave Hunt",
      `Are you sure you want to leave "${event.name || event.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave Hunt",
          style: "destructive",
          onPress: async () => {
            setJoiningEvent(true); // Reuse the loading state
            try {
              const user = FirebaseService.getCurrentUser?.();
              if (!user?.uid) {
                Alert.alert("Error", "Please log in to manage events");
                return;
              }

              // Use ParticipationService to leave properly
              const result = await participationService.leaveEvent(
                eventId,
                event
              );
              
              if (result.success) {
                Alert.alert("Success", `Left event! ${result.message}`, [
                  {
                    text: "OK",
                    onPress: () => {
                      // Close modal after successful leave
                      onClose?.();
                    },
                  },
                ]);
                // Refresh user profile to update joined events
                await fetchUserProfile(user.uid);
              } else {
                Alert.alert("Error", result.message);
              }
            } catch (leaveError) {
              console.error("Error leaving event:", leaveError);
              Alert.alert("Error", "Failed to leave event. Please try again.");
            } finally {
              setJoiningEvent(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteEvent = async () => {
    if (!event) {
      return;
    }

    Alert.alert(
      "Delete Event",
      `Are you sure you want to delete "${
        event.name || event.title
      }"? This will permanently delete the event and all its coins. This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeletingEvent(true);
            try {
              await deleteEvent(eventId);
              Alert.alert("Success", "Event deleted successfully!", [
                {
                  text: "OK",
                  onPress: () => onClose?.(),
                },
              ]);
            } catch (deleteError) {
              console.error("Error deleting event:", deleteError);
              Alert.alert("Error", "Failed to delete event. Please try again.");
            } finally {
              setDeletingEvent(false);
            }
          },
        },
      ]
    );
  };

  // Check if current user is admin
  const currentUser = FirebaseService.getCurrentUser?.();
  const userIsAdmin = isAdmin(currentUser?.email || null);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Event Details</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7B3FE4" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : !event ? (
        <View style={styles.center}>
          <Text style={styles.error}>Event not found</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
        >
          <Text style={styles.eventName}>{event.name || event.title}</Text>
          {event.description ? (
            <Text style={styles.eventDesc}>{event.description}</Text>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Coins</Text>
            <Text style={styles.row}>
              Remaining: <Text style={styles.bold}>{stats.remainingCount}</Text>
            </Text>
            <Text style={styles.row}>
              Collected: <Text style={styles.bold}>{stats.collected}</Text>
            </Text>
            <Text style={styles.row}>
              Total Remaining Value:{" "}
              <Text style={styles.bold}>{stats.totalAmountRemaining}</Text>
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Participants</Text>
            <Text style={styles.row}>
              Currently in event:{" "}
              <Text style={styles.bold}>{stats.participantsInEvent}</Text>
            </Text>
            {stats.remainingSlots !== null && (
              <Text style={styles.row}>
                Slots remaining:{" "}
                <Text style={styles.bold}>{stats.remainingSlots}</Text>
              </Text>
            )}
          </View>

          {!isUserJoined ? (
            <TouchableOpacity
              style={[styles.cta, styles.joinButton]}
              onPress={handleJoinEvent}
              disabled={joiningEvent}
            >
              <Text style={styles.ctaText}>
                {joiningEvent ? "Joining..." : "🚀 Join Event"}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              {isEventOngoing ? (
                <TouchableOpacity
                  style={styles.cta}
                  onPress={() => onStartHunt?.(event.id)}
                >
                  <Text style={styles.ctaText}>🎯 Start Hunting</Text>
                </TouchableOpacity>
              ) : (
                <View style={[styles.cta, styles.waitingButton]}>
                  <Text style={styles.ctaText}>⏳ Event Not Started</Text>
                </View>
              )}
              
              {/* Leave Hunt Button for joined users */}
              <TouchableOpacity
                style={[styles.cta, styles.leaveButton]}
                onPress={handleLeaveEvent}
                disabled={joiningEvent}
              >
                <Text style={styles.ctaText}>
                  {joiningEvent ? "Leaving..." : "🚪 Leave Hunt"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Admin Delete Button */}
          {userIsAdmin && (
            <TouchableOpacity
              style={[styles.cta, styles.deleteButton]}
              onPress={handleDeleteEvent}
              disabled={deletingEvent}
            >
              <Text style={styles.ctaText}>
                {deletingEvent ? "Deleting..." : "🗑️ Delete Event (Admin)"}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0B0F" },
  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "700" },
  close: { color: "#4da3ff", fontSize: 16, fontWeight: "600" },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  error: { color: "#f66" },
  eventName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  eventDesc: { color: "#bbb", fontSize: 14, marginBottom: 16 },
  card: {
    backgroundColor: "#14141A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#23232A",
  },
  cardTitle: { color: "#ddd", fontWeight: "700", marginBottom: 8 },
  row: { color: "#ccc", marginBottom: 6 },
  bold: { color: "#fff", fontWeight: "800" },
  cta: {
    marginTop: 12,
    backgroundColor: "#7B3FE4",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  joinButton: {
    backgroundColor: "#00C851", // Green for join
  },
  waitingButton: {
    backgroundColor: "#666", // Gray for waiting
  },
  deleteButton: {
    backgroundColor: "#ff4444", // Red for delete
    marginTop: 8,
  },
  leaveButton: {
    backgroundColor: "#FF8C00", // Orange for leave
    marginTop: 8,
  },
});

export default EventDetailsScreen;

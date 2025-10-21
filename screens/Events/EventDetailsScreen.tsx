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
import { useRecoilValue } from "recoil";
import { coinsState } from "../../state/recoil/atoms";
import { FirebaseService } from "../../services/firebase/FirebaseService";
import { useEvents, useUserProfile } from "../../state/recoil/hooks";
import { isAdmin } from "../../utils/userRoles";
import { Coin, Event } from "../../types";
import { participationService } from "../../services/ParticipationService";
import {
  isEventJoinable,
  isEventAllCoinsCollected,
  // getEventStatusLabel, // unused
} from "../../utils/eventStatus";

interface EventDetailsScreenProps {
  eventId: string;
  onClose?: () => void;
  onStartHunt?: (eventId: string) => void;
  onParticipationChange?: (eventId: string, isJoined: boolean) => void;
}

const EventDetailsScreen: React.FC<EventDetailsScreenProps> = ({
  eventId,
  onClose,
  onStartHunt,
  onParticipationChange,
}) => {
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [joiningEvent, setJoiningEvent] = useState(false);
  const [deletingEvent, setDeletingEvent] = useState(false);
  const { deleteEvent } = useEvents();
  const { userProfile, fetchUserProfile } = useUserProfile();
  const globalCoins = useRecoilValue(coinsState);

  useEffect(() => {
    let cancelled = false;
    let coinsUnsubscribe: (() => void) | null = null;
    const loadEventData = async () => {
      try {
        if (!cancelled) {
          setLoading(true);
          setError(null);
        }
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
    };

    // Initial load
    loadEventData();

    // Set up real-time listener for coins (which can affect event completion)
    coinsUnsubscribe = FirebaseService.subscribeToEventCoins(
      eventId,
      (updatedCoins) => {
        if (!cancelled) {
          setCoins(updatedCoins || []);
          // Refetch event data when coins change to get updated completion status
          FirebaseService.getEventById(eventId).then((updatedEvent) => {
            if (!cancelled && updatedEvent) {
              setEvent(updatedEvent);
            }
          });
        }
      }
    );

    return () => {
      cancelled = true;
      coinsUnsubscribe?.();
    };
  }, [eventId]);

  // Prefer local subscribed coins when present. If not present but global has coins for this event, use those.
  // If neither is present, set derivedCoins to undefined so joinability checks don't incorrectly block joining.
  const globalCoinsForEvent = globalCoins.filter(
    (c: Coin) => c.eventId === eventId
  );
  const derivedCoins: Coin[] | undefined =
    coins && coins.length > 0
      ? coins
      : globalCoinsForEvent.length > 0
      ? globalCoinsForEvent
      : undefined;

  const stats = useMemo(() => {
    const coinSource: Coin[] = derivedCoins ?? [];
    const total: number = coinSource.length;
    const collected: number = coinSource.filter(
      (c: Coin) => !!c.collected
    ).length;
    const remaining: Coin[] = coinSource.filter(
      (c: Coin) => c.collectible && !c.collected
    );
    const remainingCount: number = remaining.length;
    const totalAmountRemaining: number = remaining.reduce(
      (sum: number, c: Coin) => sum + (c.value || 0),
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
  }, [event, derivedCoins]);

  // Check if user has joined this event - use fresh data
  const [isUserJoined, setIsUserJoined] = useState(false);

  // Load participation status when component mounts or event changes
  useEffect(() => {
    const checkParticipationStatus = async () => {
      try {
        const isParticipating = await participationService.isUserParticipating(
          eventId
        );
        setIsUserJoined(isParticipating);
      } catch (participationError) {
        console.error(
          "Error checking participation status:",
          participationError
        );
        // Fallback to userProfile data
        const userJoinedEvents: string[] = userProfile?.joinedEvents || [];
        setIsUserJoined(userJoinedEvents.includes(eventId));
      }
    };

    checkParticipationStatus();
  }, [eventId, userProfile?.joinedEvents]);

  // Check if event is currently ongoing
  const isEventOngoing = useMemo(() => {
    if (!event) {
      return false;
    }
    // Check if event is marked as completed
    if (
      (event as any).status === "completed" ||
      (event as any).allCoinsCollected
    ) {
      return false;
    }
    const now = Date.now();
    const startMs = event.startDate ? new Date(event.startDate).getTime() : 0;
    const endMs = event.endDate ? new Date(event.endDate).getTime() : 0;
    return startMs <= now && now <= endMs;
  }, [event]);

  // Check if event is completed
  const isEventCompleted = useMemo(() => {
    if (!event) {
      return false;
    }
    return (
      (event as any).status === "completed" || (event as any).allCoinsCollected
    );
  }, [event]);

  // Use shared helpers for status and joinability (use derivedCoins so missing data doesn't falsely mark events completed)
  const joinable = event ? isEventJoinable(event, derivedCoins) : false;
  const allCoinsCollected = event
    ? isEventAllCoinsCollected(event, derivedCoins)
    : false;

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
        // Update local state immediately for instant UI feedback
        setIsUserJoined(true);
        // Refresh user profile to update joined events
        await fetchUserProfile(user.uid);
        // Notify parent about participation change for real-time sync
        onParticipationChange?.(eventId, true);
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
                // Update local state immediately for instant UI feedback
                setIsUserJoined(false);
                // Refresh user profile to update joined events
                await fetchUserProfile(user.uid);
                // Notify parent about participation change for real-time sync
                onParticipationChange?.(eventId, false);
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

  // Render states: loading -> spinner; error -> retry/close; event -> details; not found -> message with close
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7B3FE4" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <View style={styles.retryRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.retryButtonLeft]}
            onPress={() => {
              // Retry load
              setLoading(true);
              setError(null);
              // Re-run the effect by calling the fetch logic directly
              (async () => {
                try {
                  const ev = await FirebaseService.getEventById(eventId);
                  const cs = await FirebaseService.getCoinsForEvent(eventId);
                  setEvent(ev);
                  setCoins(cs || []);
                } catch (e: any) {
                  setError(e?.message || "Failed to load event");
                } finally {
                  setLoading(false);
                }
              })();
            }}
          >
            <Text style={styles.actionButtonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.retryButtonRight]}
            onPress={() => onClose?.()}
          >
            <Text style={styles.actionButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Event not found.</Text>
      </View>
    );
  }

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
            <Text style={styles.cardTitle}>Entry Fee & Prize Pool</Text>
            <Text style={styles.row}>
              Entry Fee:{" "}
              <Text style={styles.bold}>
                {event.huntDetails?.tokensRequired || 10} tokens
              </Text>
            </Text>
            <Text style={styles.row}>
              Prize Pool:{" "}
              <Text style={styles.bold}>
                {event.rewards?.coins || 0} tokens
              </Text>
            </Text>
            {event.huntDetails?.totalPrizePool && (
              <Text style={styles.row}>
                Current Prize Pool:{" "}
                <Text style={styles.bold}>
                  {event.huntDetails.totalPrizePool} tokens
                </Text>
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>AR Coins to Collect</Text>
            <Text style={styles.row}>
              Coins Available:{" "}
              <Text style={styles.bold}>{stats.total}</Text>
            </Text>
            <Text style={styles.row}>
              Coins Remaining:{" "}
              <Text style={styles.bold}>{stats.remainingCount}</Text>
            </Text>
            <Text style={styles.row}>
              Coins Collected:{" "}
              <Text style={styles.bold}>{stats.collected}</Text>
            </Text>
            <Text style={styles.row}>
              Total Token Value Remaining:{" "}
              <Text style={styles.bold}>
                {stats.totalAmountRemaining} tokens
              </Text>
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

          {!isUserJoined && joinable ? (
            <TouchableOpacity
              style={[styles.cta, styles.joinButton]}
              onPress={handleJoinEvent}
              disabled={joiningEvent}
            >
              <Text style={styles.ctaText}>
                {joiningEvent
                  ? "Joining..."
                  : `🚀 Join Event (${event.huntDetails?.tokensRequired || 10} tokens)`}
              </Text>
            </TouchableOpacity>
          ) : allCoinsCollected && !isUserJoined ? (
            <View style={[styles.cta, styles.completedButton]}>
              <Text style={styles.ctaText}>🎉 All coins collected!</Text>
            </View>
          ) : (
            <>
              {isEventCompleted ? (
                <View style={[styles.cta, styles.completedButton]}>
                  <Text style={styles.ctaText}>
                    🎉 Event Completed - All Coins Collected!
                  </Text>
                </View>
              ) : isEventOngoing ? (
                <TouchableOpacity
                  style={styles.cta}
                  onPress={() => onStartHunt?.(event.id)}
                >
                  <Text style={styles.ctaText}>
                    🎯 Start AR Hunt ({stats.remainingCount} coins remaining)
                  </Text>
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

          {/* Add More Coins Button for Organizer */}
          {event &&
            event.organizer?.id === currentUser?.uid &&
            !isEventOngoing && (
              <TouchableOpacity
                style={[styles.cta, styles.addCoinsButton]}
                onPress={async () => {
                  try {
                    const user = FirebaseService.getCurrentUser?.();
                    if (!user?.uid) {
                      Alert.alert("Error", "Please log in to add coins.");
                      return;
                    }
                    // Add 1-3 random coins
                    const numCoins = Math.floor(Math.random() * 3) + 1;
                    const coinPromises = [];
                    for (let i = 0; i < numCoins; i++) {
                      const eventLat = event.location?.latitude || 0;
                      const eventLng = event.location?.longitude || 0;
                      const distance = Math.random() * 200 + 100; // 100-300 meters
                      const angle = Math.random() * 2 * Math.PI;
                      const metersPerDegLat = 111320;
                      const metersPerDegLon =
                        metersPerDegLat * Math.cos((eventLat * Math.PI) / 180);
                      const offsetLat =
                        (distance * Math.cos(angle)) / metersPerDegLat;
                      const offsetLon =
                        (distance * Math.sin(angle)) / metersPerDegLon;
                      const coinLat = eventLat + offsetLat;
                      const coinLng = eventLng + offsetLon;

                      const coinData = {
                        eventId: event.id,
                        location: { latitude: coinLat, longitude: coinLng },
                        value: Math.floor(Math.random() * 100) + 50, // 50-150 coins
                        collectible: true,
                        collected: false,
                        createdAt: new Date().toISOString(),
                        createdBy: user.uid,
                        type: "treasure",
                      };
                      coinPromises.push(FirebaseService.createCoin(coinData));
                    }
                    await Promise.all(coinPromises);
                    Alert.alert(
                      "Success",
                      `Added ${numCoins} more coins to attract participants!`
                    );
                    // Refresh coins
                    const updatedCoins = await FirebaseService.getCoinsForEvent(
                      eventId
                    );
                    setCoins(updatedCoins);
                  } catch (addCoinsError) {
                    console.error("Error adding coins:", addCoinsError);
                    Alert.alert("Error", "Failed to add coins.");
                  }
                }}
              >
                <Text style={styles.ctaText}>💰 Add More Coins</Text>
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
  retryRow: { flexDirection: "row", marginTop: 12 },
  actionButton: {
    backgroundColor: "#7B3FE4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
  },
  retryButtonLeft: {
    marginRight: 8,
  },
  retryButtonRight: {
    backgroundColor: "#9E9E9E",
    marginLeft: 0,
  },
  actionButtonText: { color: "#fff", fontWeight: "700" },
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
  completedButton: {
    backgroundColor: "#00C851", // Green for completed
  },
  addCoinsButton: {
    backgroundColor: "#FFD700", // Gold for add coins
    marginTop: 8,
  },
});

export default EventDetailsScreen;

/* eslint-disable prettier/prettier */
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { FirebaseService } from "../../services/firebase/FirebaseService";
import { Coin, Event } from "../../types";

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
  <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
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
              Total Remaining Value: <Text style={styles.bold}>{stats.totalAmountRemaining}</Text>
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Participants</Text>
            <Text style={styles.row}>
              Currently in event: <Text style={styles.bold}>{stats.participantsInEvent}</Text>
            </Text>
            {stats.remainingSlots !== null && (
              <Text style={styles.row}>
                Slots remaining: <Text style={styles.bold}>{stats.remainingSlots}</Text>
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.cta}
            onPress={() => onStartHunt?.(event.id)}
          >
            <Text style={styles.ctaText}>Start Hunting</Text>
          </TouchableOpacity>
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
  eventName: { color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 6 },
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
});

export default EventDetailsScreen;


import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Image, TouchableOpacity, Pressable } from "react-native";
import { Event } from "../../../types";
import { useMapState } from "../../../state/recoil/hooks";
import { styles } from "./EventItem.styles";

interface EventItemProps {
  event: Event;
  onPress?: () => void;
  onDetails?: () => void;
  onMapPress?: (location: {
    latitude: number;
    longitude: number;
    title: string;
  }) => void;
  onParticipate?: (event: Event) => void;
  isParticipating?: boolean;
}

export const EventItem: React.FC<EventItemProps> = ({
  event,
  onMapPress,
  onParticipate,
  isParticipating = false,
  onDetails,
}) => {
  const { setSelectedEvent } = useMapState();
  const isParticipant = isParticipating;
  const [showDetails, setShowDetails] = useState(false);
  // Time status computation
  const now = Date.now();
  const startMs = useMemo(() => {
    if (!event.startDate) {
      return undefined;
    }
    try {
      // Handle Firebase Timestamp objects
      if (
        typeof event.startDate === "object" &&
        event.startDate !== null &&
        typeof (event.startDate as any).toDate === "function"
      ) {
        return (event.startDate as any).toDate().getTime();
      }
      // Handle Firebase Timestamp with seconds/nanoseconds
      if (
        typeof event.startDate === "object" &&
        event.startDate !== null &&
        typeof (event.startDate as any).seconds === "number"
      ) {
        return (event.startDate as any).seconds * 1000;
      }
      // Handle Date objects
      if (event.startDate && (event.startDate as any).getTime) {
        return (event.startDate as any).getTime();
      }
      // Handle ISO string dates
      const t = Date.parse(event.startDate as string);
      return Number.isNaN(t) ? undefined : t;
    } catch (error) {
      console.warn("Error parsing startDate:", error, event.startDate);
      return undefined;
    }
  }, [event.startDate]);
  const endMs = useMemo(() => {
    if (!event.endDate) {
      return undefined;
    }
    try {
      // Handle Firebase Timestamp objects
      if (
        typeof event.endDate === "object" &&
        event.endDate !== null &&
        typeof (event.endDate as any).toDate === "function"
      ) {
        return (event.endDate as any).toDate().getTime();
      }
      // Handle Firebase Timestamp with seconds/nanoseconds
      if (
        typeof event.endDate === "object" &&
        event.endDate !== null &&
        typeof (event.endDate as any).seconds === "number"
      ) {
        return (event.endDate as any).seconds * 1000;
      }
      // Handle Date objects
      if (event.endDate && (event.endDate as any).getTime) {
        return (event.endDate as any).getTime();
      }
      // Handle ISO string dates
      const t = Date.parse(event.endDate as string);
      return Number.isNaN(t) ? undefined : t;
    } catch (error) {
      console.warn("Error parsing endDate:", error, event.endDate);
      return undefined;
    }
  }, [event.endDate]);
  const isExpired = endMs !== undefined ? endMs < now : false;
  const isOngoing = (() => {
    if (isExpired) {
      return false;
    }
    if (startMs === undefined) {
      return false;
    }
    if (endMs === undefined) {
      return startMs <= now;
    }
    return startMs <= now && now <= endMs;
  })();

  // Derive participants text: use currentParticipants/maxParticipants if available
  const participantsText = useMemo(() => {
    const current = event.currentParticipants ?? 0;
    const max = event.maxParticipants ?? 0;
    if (max > 0) {
      return `${current}/${max}`;
    }
    // Fallback to legacy subscribers string like "410 subscribers"
    const match = (event.subscribers || "").match(/(\d+)/);
    return match ? `${match[1]}` : `${current}`;
  }, [event.currentParticipants, event.maxParticipants, event.subscribers]);

  // Live countdown based on real start/end dates if available
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    const compute = () => {
      const nowMs = Date.now();
      if (isExpired) {
        setCountdown("");
        return;
      }
      if (isOngoing && endMs !== undefined) {
        const diff = Math.max(0, endMs - nowMs);
        const totalMinutes = Math.floor(diff / (60 * 1000));
        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        const minutes = totalMinutes % 60;
        setCountdown(`${days}d ${hours}h ${minutes}m left`);
        return;
      }
      if (!isOngoing && startMs !== undefined) {
        const diff = Math.max(0, startMs - nowMs);
        const totalMinutes = Math.floor(diff / (60 * 1000));
        const days = Math.floor(totalMinutes / (24 * 60));
        const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
        const minutes = totalMinutes % 60;
        setCountdown(`${days}d ${hours}h ${minutes}m to start`);
        return;
      }
      setCountdown("");
    };
    compute();
    const t = setInterval(compute, 60 * 1000);
    return () => clearInterval(t);
  }, [isExpired, isOngoing, startMs, endMs]);

  const handleMapPress = () => {
    // Set selected event for map visibility logic
    setSelectedEvent(event);
    if (onMapPress) {
      const coord = event.coordinate ?? event.location;
      onMapPress({
        latitude: coord.latitude,
        longitude: coord.longitude,
        title: event.name || event.title,
      });
    }
  };

  const handleParticipatePress = () => {
    if (onParticipate) {
      onParticipate(event);
    }
  };

  const statusType: "ongoing" | "expired" | "upcoming" | undefined = isOngoing
    ? "ongoing"
    : isExpired
    ? "expired"
    : "upcoming";
  const statusLabel =
    statusType === "ongoing"
      ? "Ongoing"
      : statusType === "expired"
      ? "Expired"
      : statusType === "upcoming"
      ? "Upcoming"
      : undefined;

  return (
    <Pressable
      onPress={() => setShowDetails(!showDetails)}
      android_ripple={{ color: "rgba(255,255,255,0.06)" }}
      style={({ pressed }) => [
        styles.card,
        isExpired && styles.cardExpired,
        pressed ? styles.cardPressed : null,
      ]}
    >
      <Image
        source={{
          uri:
            event.img ||
            event.image ||
            "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80",
        }}
        style={[styles.image, isExpired && styles.imageExpired]}
        defaultSource={require("../../../assets/wood.jpg")}
        onError={() =>
          console.log("Failed to load image:", event.img || event.image)
        }
      />
      <View style={styles.titleRow}>
        <Text style={styles.title}>{event.name}</Text>
      </View>
      {statusLabel ? (
        <View style={styles.statusRow}>
          <Text
            style={[
              styles.statusBadge,
              statusType === "ongoing"
                ? [styles.statusOngoing, styles.statusRight]
                : statusType === "expired"
                ? [styles.statusExpired, styles.statusRight]
                : [styles.statusUpcoming, styles.statusRight],
            ]}
          >
            {statusLabel}
          </Text>
        </View>
      ) : null}
      {/* Essential info only */}
      {event.balance ? (
        <Text style={styles.detail}>{event.balance}</Text>
      ) : event.rewards ? (
        <Text style={styles.prizePool}>
          💰 Prize: {event.rewards.coins} coins
        </Text>
      ) : null}

      <Text style={styles.detail}>👥 {participantsText} participants</Text>

      {showDetails && (
        <>
          {/* Detailed info shown only when expanded */}
          <Text style={styles.detail}>
            🏷️ Type:{" "}
            {(event as any).huntDetails?.difficulty === "Easy"
              ? "Flash Hunt"
              : (event as any).huntDetails?.difficulty === "Hard"
              ? "Epic Journey Hunt"
              : "Adventure Hunt"}
          </Text>

          <Text style={styles.detail}>
            ⭐ Difficulty: {(event as any).huntDetails?.difficulty || "Medium"}
          </Text>

          {(event as any).radius && (
            <Text style={styles.detail}>
              📏 Range: {Math.round((event as any).radius / 1000)}km
            </Text>
          )}

          <Text style={styles.detail}>
            ⏳ Duration:{" "}
            {(() => {
              if (startMs === undefined || endMs === undefined) {
                return "TBD";
              }
              const durationMs = endMs - startMs;
              if (durationMs <= 0) {
                return "TBD";
              }
              const hours = Math.floor(durationMs / (1000 * 60 * 60));
              const days = Math.floor(hours / 24);
              return days > 0 ? `${days} days` : `${hours} hours`;
            })()}
          </Text>
        </>
      )}

      {/* Status with countdown */}
      <Text style={styles.detail}>
        {isExpired ? (
          "❌ Expired"
        ) : isOngoing ? (
          <>
            🟢 Live •{" "}
            <Text style={styles.countdown}>{countdown || "Ending soon"}</Text>
          </>
        ) : (
          <>
            � Upcoming •{" "}
            <Text style={styles.countdown}>{countdown || "Starting soon"}</Text>
          </>
        )}
      </Text>
      {/* Actions */}
      <View style={styles.actionsRow}>
        {!isExpired ? (
          <TouchableOpacity
            style={[
              styles.participateButton,
              isParticipant && styles.participateButtonSubscribed,
            ]}
            onPress={handleParticipatePress}
          >
            <Text style={styles.participateButtonText}>
              {isParticipant ? "Leave Hunt" : "Join Hunt"}
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.mapButton} onPress={handleMapPress}>
          <Text style={styles.mapButtonText}>View on Map</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mapButton, styles.detailsButton]}
          onPress={() => onDetails?.()}
        >
          <Text style={styles.mapButtonText}>Details</Text>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
};

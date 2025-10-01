import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Event, FocusLocation } from "../../../types";
import { useMapState, useUserProfile } from "../../../state/recoil/hooks";
import BottomSheet from "../../Filters/Sheet/BottomSheet";
import { styles } from "./EventItem.styles";

interface EventItemProps {
  event: Event;
  onMapPress?: (location: FocusLocation) => void;
  onParticipate?: (event: Event) => void;
}

export const EventItem: React.FC<EventItemProps> = ({
  event,
  onMapPress,
  onParticipate,
}) => {
  const { setSelectedEvent } = useMapState();
  const { userProfile } = useUserProfile();
  const isParticipant = Array.isArray((userProfile as any)?.joinedEvents)
    ? (userProfile as any).joinedEvents.includes(event.id)
    : false;
  const [confirmOpen, setConfirmOpen] = React.useState(false);
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
    if (isParticipant) {
      // open unsubscribe confirm
      setConfirmOpen(true);
      return;
    }
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
    <View style={[styles.card, isExpired && styles.cardExpired]}>
      <Image
        source={{ uri: event.img }}
        style={[styles.image, isExpired && styles.imageExpired]}
      />
      <Text style={styles.title}>{event.name}</Text>
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
      {/* Primary details */}
      {event.balance ? (
        <Text style={styles.detail}>{event.balance}</Text>
      ) : null}
      {/* Total Prize Pool - FIRST and COLORED */}
      {event.rewards ? (
        <Text style={styles.prizePool}>
          💰 Total Prize:{" "}
          {event.rewards.coins +
            (event.rewards.experience || (event.rewards as any).xp || 0) *
              2}{" "}
          coins
        </Text>
      ) : null}

      {/* Participants */}
      <Text style={styles.detail}>👥 Participants: {participantsText}</Text>

      {/* Hunt Type - Dynamic with Tag Icon */}
      <Text style={styles.detail}>
        🏷️ Type:{" "}
        {(event as any).huntDetails?.difficulty === "Easy"
          ? "Flash Hunt"
          : (event as any).huntDetails?.difficulty === "Hard"
          ? "Epic Journey Hunt"
          : "Adventure Hunt"}
      </Text>

      {/* Terrain */}
      <Text style={styles.detail}>
        🏞️ Terrain:{" "}
        {(event as any).huntDetails?.terrain ||
          (event as any).terrain ||
          "Urban"}
      </Text>

      {/* Difficulty */}
      <Text style={styles.detail}>
        ⭐ Difficulty:{" "}
        {(event as any).huntDetails?.difficulty ||
          (event as any).difficulty ||
          "Medium"}
      </Text>

      {/* Event Duration */}
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
          const remainingHours = hours % 24;

          if (days > 0) {
            return remainingHours > 0
              ? `${days}d ${remainingHours}h`
              : `${days} day${days > 1 ? "s" : ""}`;
          } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? "s" : ""}`;
          } else {
            const minutes = Math.floor(durationMs / (1000 * 60));
            return `${minutes} min${minutes > 1 ? "s" : ""}`;
          }
        })()}
      </Text>

      {/* Hunt Range */}
      {(event as any).huntDetails?.range ? (
        <Text style={styles.detail}>
          📍 Range: {(event as any).huntDetails.range}km radius
        </Text>
      ) : typeof (event as any).radius !== "undefined" ? (
        <Text style={styles.detail}>
          📏 Range: {Math.round((event as any).radius / 1000)}km radius
        </Text>
      ) : null}
      {/* Dynamic Status with Countdown */}
      <Text style={styles.detail}>
        {isExpired ? (
          "⏰ Status: Expired"
        ) : isOngoing ? (
          <>
            ⏱️ Ends in:{" "}
            <Text style={styles.countdown}>{countdown || "Soon"}</Text>
          </>
        ) : (
          <>
            🗓️ Starts in:{" "}
            <Text style={styles.countdown}>{countdown || "Soon"}</Text>
          </>
        )}
      </Text>
      {/* Distance (legacy) */}
      {event.distance ? (
        <Text style={styles.distance}>📍 {event.distance}</Text>
      ) : null}
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
              {isParticipant ? "Subscribed" : "Participate"}
            </Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.mapButton} onPress={handleMapPress}>
          <Text style={styles.mapButtonText}>View on Map</Text>
        </TouchableOpacity>
      </View>
      {/* Unsubscribe confirm */}
      <BottomSheet
        visible={confirmOpen}
        title={"Unsubscribe"}
        onClose={() => setConfirmOpen(false)}
        maxHeightPercent={0.3}
      >
        <Text style={confirmStyles.message}>
          Do you want to unsubscribe from this event?
        </Text>
        <View style={confirmStyles.row}>
          <TouchableOpacity
            style={[confirmStyles.btn, confirmStyles.btnCancel]}
            onPress={() => setConfirmOpen(false)}
          >
            <Text style={confirmStyles.btnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[confirmStyles.btn, confirmStyles.btnDanger]}
            onPress={() => {
              // NOTE: In real app, update backend/profile. Demo: just close.
              setConfirmOpen(false);
            }}
          >
            <Text style={confirmStyles.btnText}>Unsubscribe</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  );
};

const confirmStyles = {
  message: { color: "#EDEDED", marginBottom: 12 } as const,
  row: { flexDirection: "row" as const, columnGap: 12 } as const,
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  } as const,
  btnCancel: {
    backgroundColor: "#1C1C1C",
    borderWidth: 1,
    borderColor: "#373737",
  },
  btnDanger: {
    backgroundColor: "#E53935",
  },
  btnText: { color: "#FFFFFF", fontWeight: "700" as const },
};

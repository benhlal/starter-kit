import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Event, FocusLocation } from "../../../types";
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
  // Time status computation
  const now = Date.now();
  const startMs = useMemo(() => {
    const t = Date.parse(event.startDate);
    return Number.isNaN(t) ? undefined : t;
  }, [event.startDate]);
  const endMs = useMemo(() => {
    const t = Date.parse(event.endDate);
    return Number.isNaN(t) ? undefined : t;
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

  const statusLabel = isOngoing ? "Ongoing" : isExpired ? "Expired" : undefined;

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
              isOngoing ? styles.statusOngoing : styles.statusExpired,
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
      {/* Participants */}
      <Text style={styles.detail}>👥 Participants: {participantsText}</Text>
      {/* Type, Radius, Rewards */}
      <Text style={styles.detail}>🏷️ Type: {event.type}</Text>
      {typeof (event as any).radius !== "undefined" ? (
        <Text style={styles.detail}>📏 Radius: {(event as any).radius} m</Text>
      ) : null}
      {event.rewards ? (
        <Text style={styles.detail}>
          🎁 Rewards: {event.rewards.coins} coins, {event.rewards.experience} XP
        </Text>
      ) : null}
      {/* Countdown / timing */}
      {isExpired ? (
        <Text style={styles.expiredText}>⏰ This event has ended</Text>
      ) : countdown ? (
        <Text style={isOngoing ? styles.ongoingText : styles.planned}>
          {isOngoing ? "⏱️ Ends in: " : "🗓️ Starts in: "}
          {countdown}
        </Text>
      ) : null}
      {/* Distance (legacy) */}
      {event.distance ? (
        <Text style={styles.distance}>📍 {event.distance}</Text>
      ) : null}
      {/* Actions */}
      <View style={styles.actionsRow}>
        {!isExpired ? (
          <TouchableOpacity
            style={styles.participateButton}
            onPress={handleParticipatePress}
          >
            <Text style={styles.participateButtonText}>Participate</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.mapButton} onPress={handleMapPress}>
          <Text style={styles.mapButtonText}>View on Map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

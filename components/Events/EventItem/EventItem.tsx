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

  // Deterministic target within 3..6 days + 0..23 hours based on event id
  const targetDate = useMemo(() => {
    const seed = Array.from(event.id).reduce((a, c) => a + c.charCodeAt(0), 0);
    const days = 3 + (seed % 4); // 3..6
    const hours = Math.abs(Math.floor(seed / 7)) % 24; // 0..23
    const now = Date.now();
    return new Date(now + (days * 24 + hours) * 60 * 60 * 1000);
  }, [event.id]);

  const [plannedCountdown, setPlannedCountdown] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const diff = Math.max(0, targetDate.getTime() - Date.now());
      const totalMinutes = Math.floor(diff / (60 * 1000));
      const days = Math.floor(totalMinutes / (24 * 60));
      const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
      const minutes = totalMinutes % 60;
      setPlannedCountdown(`${days} days ${hours} hours ${minutes} min`);
    };
    update();
    const t = setInterval(update, 60 * 1000); // update every minute
    return () => clearInterval(t);
  }, [targetDate]);

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

  return (
    <View style={styles.card}>
      <Image source={{ uri: event.img }} style={styles.image} />
      <Text style={styles.title}>{event.name}</Text>
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
      {/* Planned countdown (live) */}
      <Text style={styles.planned}>🗓️ Planned: {plannedCountdown}</Text>
      {/* Distance (legacy) */}
      {event.distance ? (
        <Text style={styles.distance}>📍 {event.distance}</Text>
      ) : null}
      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.participateButton}
          onPress={handleParticipatePress}
        >
          <Text style={styles.participateButtonText}>Participate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapButton} onPress={handleMapPress}>
          <Text style={styles.mapButtonText}>View on Map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

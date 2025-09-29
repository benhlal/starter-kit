import React from "react";
import { View, Text } from "react-native";
import { styles } from "./ProfileStats.styles";

interface ProfileStatsProps {
  totalCoins: number;
  eventsJoined: number;
  currentLevel: number;
  daysActive: number;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  totalCoins,
  eventsJoined,
  currentLevel,
  daysActive,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalCoins}</Text>
          <Text style={styles.statLabel}>Total Coins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{eventsJoined}</Text>
          <Text style={styles.statLabel}>Events Joined</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{currentLevel}</Text>
          <Text style={styles.statLabel}>Current Level</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{daysActive}</Text>
          <Text style={styles.statLabel}>Days Active</Text>
        </View>
      </View>
    </View>
  );
};

import React, { useEffect, useState } from "react";
// @ts-ignore types will exist after install
import auth from "@react-native-firebase/auth";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
} from "react-native";
import {
  useUserProfile,
  useCoins,
  useAppState,
} from "../../state/recoil/hooks";
import { styles } from "./ProfileScreen.styles";
import MigrationScreen from "../../components/Migration";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
  completed: boolean;
}

const ProfileScreen: React.FC = () => {
  const { userProfile, userLevel, fetchUserProfile } = useUserProfile();
  const { collectedCoinsCount } = useCoins();
  const { appConfig, toggleMockMode } = useAppState();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  useEffect(() => {
    // Fetch user profile when component mounts
    if (!userProfile) {
      fetchUserProfile("user_1"); // Mock user ID
    }

    // Mock achievements data
    setAchievements([
      {
        id: "1",
        name: "First Steps",
        description: "Join your first event",
        icon: "🎯",
        progress: { current: 5, target: 1, percentage: 100 },
        completed: true,
      },
      {
        id: "2",
        name: "Coin Collector",
        description: "Collect 50 coins",
        icon: "🪙",
        progress: {
          current: collectedCoinsCount,
          target: 50,
          percentage: (collectedCoinsCount / 50) * 100,
        },
        completed: collectedCoinsCount >= 50,
      },
      {
        id: "3",
        name: "Explorer",
        description: "Visit 10 different locations",
        icon: "🗺️",
        progress: { current: 3, target: 10, percentage: 30 },
        completed: false,
      },
      {
        id: "4",
        name: "Social Butterfly",
        description: "Join 20 community events",
        icon: "👥",
        progress: { current: 8, target: 20, percentage: 40 },
        completed: false,
      },
    ]);
  }, [userProfile, collectedCoinsCount, fetchUserProfile]);

  const handleSettingPress = (setting: string) => {
    switch (setting) {
      case "notifications":
        Alert.alert("Notifications", "Notification settings coming soon!");
        break;
      case "privacy":
        Alert.alert("Privacy", "Privacy settings coming soon!");
        break;
      case "help":
        Alert.alert("Help", "Help & support coming soon!");
        break;
      case "about":
        Alert.alert("About", "AR Treasure Hunt v1.0.0");
        break;
      case "mockMode":
        toggleMockMode();
        Alert.alert(
          "Mock Mode",
          `Mock mode ${appConfig.useMockData ? "enabled" : "disabled"}`
        );
        break;
      case "migration":
        setShowMigrationModal(true);
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          auth()
            .signOut()
            .then(() =>
              Alert.alert(
                "Logged Out",
                "You have been logged out successfully!"
              )
            )
            .catch((e) =>
              Alert.alert("Logout Error", e?.message || "Unknown error")
            );
        },
      },
    ]);
  };

  const renderProfileHeader = () => (
    <View style={styles.header}>
      <View style={styles.profileImageContainer}>
        {userProfile?.photoURL ? (
          <Image
            source={{ uri: userProfile.photoURL }}
            style={styles.profileImage}
          />
        ) : (
          <Text style={styles.profileImagePlaceholder}>
            {userProfile?.displayName
              ? userProfile.displayName.charAt(0).toUpperCase()
              : "U"}
          </Text>
        )}
      </View>
      <Text style={styles.userName}>
        {userProfile?.displayName || "User Name"}
      </Text>
      <Text style={styles.userEmail}>
        {userProfile?.email || "user@example.com"}
      </Text>
      <Text style={styles.userLevel}>Level {userLevel}</Text>
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userProfile?.totalCoins || 0}</Text>
          <Text style={styles.statLabel}>Total Coins</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userProfile?.eventsJoined || 0}</Text>
          <Text style={styles.statLabel}>Events Joined</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userLevel}</Text>
          <Text style={styles.statLabel}>Current Level</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>7</Text>
          <Text style={styles.statLabel}>Days Active</Text>
        </View>
      </View>
    </View>
  );

  const renderAchievements = () => (
    <View style={styles.achievementsContainer}>
      <Text style={styles.sectionTitle}>Achievements</Text>
      <View style={styles.achievementsList}>
        {achievements.map((achievement) => (
          <View key={achievement.id} style={styles.achievementCard}>
            <View style={styles.achievementIcon}>
              <Text style={styles.achievementIconText}>{achievement.icon}</Text>
            </View>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>{achievement.name}</Text>
              <Text style={styles.achievementDescription}>
                {achievement.description}
              </Text>
              {!achievement.completed && (
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${achievement.progress.percentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {achievement.progress.current}/{achievement.progress.target}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.sectionTitle}>Settings</Text>

      <TouchableOpacity
        style={styles.settingItem}
        onPress={() => handleSettingPress("notifications")}
      >
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <Text style={styles.settingIconText}>🔔</Text>
          </View>
          <Text style={styles.settingText}>Notifications</Text>
        </View>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingItem}
        onPress={() => handleSettingPress("privacy")}
      >
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <Text style={styles.settingIconText}>🔒</Text>
          </View>
          <Text style={styles.settingText}>Privacy & Security</Text>
        </View>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingItem}
        onPress={() => handleSettingPress("mockMode")}
      >
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <Text style={styles.settingIconText}>🔄</Text>
          </View>
          <Text style={styles.settingText}>
            Mock Mode {appConfig.useMockData ? "(On)" : "(Off)"}
          </Text>
        </View>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingItem}
        onPress={() => handleSettingPress("migration")}
      >
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <Text style={styles.settingIconText}>🚀</Text>
          </View>
          <Text style={styles.settingText}>Database Migration</Text>
        </View>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingItem}
        onPress={() => handleSettingPress("help")}
      >
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <Text style={styles.settingIconText}>❓</Text>
          </View>
          <Text style={styles.settingText}>Help & Support</Text>
        </View>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingItem}
        onPress={() => handleSettingPress("about")}
      >
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <Text style={styles.settingIconText}>ℹ️</Text>
          </View>
          <Text style={styles.settingText}>About</Text>
        </View>
        <Text style={styles.settingArrow}>›</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderProfileHeader()}
        {renderStats()}
        {renderAchievements()}
        {renderSettings()}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showMigrationModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMigrationModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#1C1C1C" }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 20,
              paddingTop: 60,
              borderBottomWidth: 1,
              borderBottomColor: "#333333",
            }}
          >
            <Text style={{ color: "#EDEDED", fontSize: 20, fontWeight: "600" }}>
              Database Migration
            </Text>
            <TouchableOpacity
              onPress={() => setShowMigrationModal(false)}
              style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: "#333333",
              }}
            >
              <Text style={{ color: "#EDEDED", fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <MigrationScreen />
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;

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
// import ARGPSDemo from "../../components/ARGPSDemo"; // Temporarily disabled
import { CreateEventModal } from "../../components/Events/CreateEventModal";
import { FirebaseService } from "../../services/firebase/FirebaseService";
import { getUserPermissions } from "../../utils/userRoles";
import {
  useUserProfile,
  useCoins,
  useAppState,
} from "../../state/recoil/hooks";
import { styles } from "./ProfileScreen.styles";
import MigrationScreen from "../../components/Migration";
import TokenEconomySettings from "../../components/Admin/TokenEconomySettings";

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
  const currentUser = auth().currentUser;
  const isAdmin = getUserPermissions(
    currentUser?.email || null
  ).canCreateEvents;
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [showARGPS, setShowARGPS] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showTokenEconomyModal, setShowTokenEconomyModal] = useState(false);

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
      case "testARGPS":
        setShowARGPS(true);
        break;
      case "createEvent":
        setShowCreateEventModal(true);
        break;
      case "clearEvents":
        Alert.alert(
          "Clear All Events",
          "This will permanently delete all events from the database. This action cannot be undone!",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Clear Events",
              style: "destructive",
              onPress: async () => {
                try {
                  await FirebaseService.clearCollection("events");
                  Alert.alert("Success", "All events cleared successfully!");
                } catch (error) {
                  console.error("Clear events error:", error);
                  Alert.alert(
                    "Error",
                    `Failed to clear events: ${(error as Error).message}`
                  );
                }
              },
            },
          ]
        );
        break;
      case "manageUsers":
        Alert.alert(
          "Manage Users",
          "User management features:\n• View all users\n• Edit permissions\n• Ban/unban users\n\nComing soon!"
        );
        break;
      case "eventAnalytics":
        Alert.alert(
          "Event Analytics",
          "Analytics features:\n• Event participation stats\n• Coin collection metrics\n• User engagement data\n\nComing soon!"
        );
        break;
      case "populateEvents":
        Alert.alert(
          "Populate Events",
          "This will add 25 new AR coin hunt events to the database.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Add Events",
              onPress: async () => {
                try {
                  const {
                    populateMoreEvents,
                  } = require("../../utils/populateEvents");
                  await populateMoreEvents();
                  Alert.alert("Success", "25 new AR coin hunt events added!");
                } catch (error) {
                  Alert.alert("Error", "Failed to populate events");
                }
              },
            },
          ]
        );
        break;
      case "populateDemoData":
        Alert.alert(
          "Populate Demo Data",
          "This will create comprehensive demo data with events, participants, and prize calculations based on collected tokens.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Create Demo Data",
              onPress: async () => {
                try {
                  const {
                    populateDemoData,
                  } = require("../../utils/populateDemoData");
                  await populateDemoData();
                  Alert.alert("Success", "Demo data created successfully!");
                } catch (error) {
                  console.error("Demo data population error:", error);
                  Alert.alert(
                    "Error",
                    `Failed to create demo data: ${(error as Error).message}`
                  );
                }
              },
            },
          ]
        );
        break;
      case "clearAllData":
        Alert.alert(
          "Clear All Data Except Users",
          "This will permanently delete all events, coins, participations, and other data. User accounts will be preserved. This action cannot be undone!",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Clear All Data",
              style: "destructive",
              onPress: async () => {
                try {
                  Alert.alert(
                    "Confirm Clear All Data",
                    "Are you absolutely sure? This will delete ALL events, coins, and participations. Only user accounts will remain.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Yes, Clear Everything",
                        style: "destructive",
                        onPress: async () => {
                          try {
                            const {
                              FirebaseService,
                            } = require("../../services/firebase/FirebaseService");
                            await FirebaseService.clearAllDataExceptUsers();
                            Alert.alert(
                              "Success",
                              "All data cleared except user accounts!"
                            );
                          } catch (error) {
                            console.error("Clear data error:", error);
                            Alert.alert(
                              "Error",
                              `Failed to clear data: ${
                                (error as Error).message
                              }`
                            );
                          }
                        },
                      },
                    ]
                  );
                } catch (error) {
                  console.error("Clear data error:", error);
                  Alert.alert(
                    "Error",
                    `Failed to clear data: ${(error as Error).message}`
                  );
                }
              },
            },
          ]
        );
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

  const openTokenEconomy = () => {
    console.log("Opening Token Economy modal...");
    Alert.alert("Opening", "Opening Token Economy settings...");
    setShowTokenEconomyModal(true);
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

  const renderDeveloper = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.sectionTitle}>🚀 Developer & Testing</Text>

      <TouchableOpacity
        style={styles.settingItem}
        onPress={() => handleSettingPress("testARGPS")}
      >
        <View style={styles.settingLeft}>
          <View style={styles.settingIcon}>
            <Text style={styles.settingIconText}>🎯</Text>
          </View>
          <Text style={styles.settingText}>Test AR GPS</Text>
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

      {isAdmin && (
        <>
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>⚙️ Admin Operations</Text>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => handleSettingPress("createEvent")}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>➕</Text>
              </View>
              <Text style={styles.settingText}>Create Event</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={openTokenEconomy}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>⚖️</Text>
              </View>
              <Text style={styles.settingText}>Token Economy Settings</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => handleSettingPress("clearEvents")}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>🗑️</Text>
              </View>
              <Text style={styles.settingText}>Clear All Events</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert(
                "Clear All Coins",
                "This will permanently delete all coins from the database. This action cannot be undone!",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clear Coins",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        await FirebaseService.clearCollection("coins");
                        Alert.alert("Success", "All coins cleared successfully!");
                      } catch (error) {
                        console.error("Clear coins error:", error);
                        Alert.alert(
                          "Error",
                          `Failed to clear coins: ${(error as Error).message}`
                        );
                      }
                    },
                  },
                ]
              );
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>🧹</Text>
              </View>
              <Text style={styles.settingText}>Clear All Coins</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              Alert.alert(
                "Clear All Database",
                "This will permanently delete ALL data from the database including events, coins, locations, and other collections. This action cannot be undone!",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clear Everything",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        const collections = [
                          "events",
                          "eventLocations",
                          "coins",
                          "arObjects",
                          "achievements",
                          "regions",
                          "leaderboards",
                          "participations",
                        ];

                        for (const collection of collections) {
                          try {
                            await FirebaseService.clearCollection(collection);
                          } catch (error) {
                            console.warn(`Failed to clear ${collection}:`, error);
                          }
                        }

                        Alert.alert("Success", "All database data cleared successfully!");
                      } catch (error) {
                        console.error("Clear database error:", error);
                        Alert.alert(
                          "Error",
                          `Failed to clear database: ${(error as Error).message}`
                        );
                      }
                    },
                  },
                ]
              );
            }}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>⚠️</Text>
              </View>
              <Text style={styles.settingText}>Clear All Database</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => handleSettingPress("manageUsers")}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>👥</Text>
              </View>
              <Text style={styles.settingText}>Manage Users</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => handleSettingPress("eventAnalytics")}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>📊</Text>
              </View>
              <Text style={styles.settingText}>Event Analytics</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => handleSettingPress("populateEvents")}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>🔧</Text>
              </View>
              <Text style={styles.settingText}>Populate Events</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => handleSettingPress("populateDemoData")}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>🎲</Text>
              </View>
              <Text style={styles.settingText}>Populate Demo Data</Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => handleSettingPress("clearAllData")}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Text style={styles.settingIconText}>💥</Text>
              </View>
              <Text style={styles.settingText}>
                Clear All Data Except Users
              </Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </>
      )}
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
        {renderDeveloper()}
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

      {/* AR GPS Demo Modal */}
      <Modal
        visible={showARGPS}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowARGPS(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 20,
              paddingTop: 60,
              borderBottomWidth: 1,
              borderBottomColor: "#ddd",
              backgroundColor: "white",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "600" }}>
              🎯 AR GPS Testing
            </Text>
            <TouchableOpacity
              style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: "#f0f0f0",
              }}
              onPress={() => setShowARGPS(false)}
            >
              <Text style={{ fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
          {/* <ARGPSDemo /> */}
          <Text style={{ color: "white", padding: 20, textAlign: "center" }}>
            AR GPS Demo temporarily disabled
          </Text>
        </View>
      </Modal>

      {/* Create Event Modal */}
      <CreateEventModal
        isVisible={showCreateEventModal}
        onClose={() => setShowCreateEventModal(false)}
        onEventCreated={(eventId) => {
          console.log("Event created with ID:", eventId);
          setShowCreateEventModal(false);
          Alert.alert("Success", "Event created successfully!");
        }}
      />

      {/* Token Economy Settings Modal (Admin) */}
      <Modal
        visible={showTokenEconomyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTokenEconomyModal(false)}
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
              Token Economy Settings
            </Text>
            <TouchableOpacity
              onPress={() => setShowTokenEconomyModal(false)}
              style={{ padding: 8, borderRadius: 20, backgroundColor: "#333333" }}
            >
              <Text style={{ color: "#EDEDED", fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <TokenEconomySettings />
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;

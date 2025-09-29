import React from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableWithoutFeedback,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const events = [
  {
    id: "1",
    name: "Total Prize",
    balance: "Total Balance: €1200",
    subscribers: "532 subscribers",
    distance: "2 km",
    img: "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&w=600",
    coordinate: { latitude: 48.8566, longitude: 2.3522 },
  },
  {
    id: "2",
    name: "New York Central Park Hunt",
    balance: "Total Balance: €950",
    subscribers: "420 subscribers",
    distance: "5 km",
    img: "https://images.pexels.com/photos/462118/pexels-photo-462118.jpeg?auto=compress&w=600",
    coordinate: { latitude: 40.7829, longitude: -73.9654 },
  },
  {
    id: "3",
    name: "Tokyo Night Run",
    balance: "Total Balance: ¥150,000",
    subscribers: "300 subscribers",
    distance: "3.5 km",
    img: "https://images.pexels.com/photos/356830/pexels-photo-356830.jpeg",
    coordinate: { latitude: 35.6762, longitude: 139.6503 },
  },
  {
    id: "4",
    name: "Sydney Opera Adventure",
    balance: "Total Balance: AU$2,100",
    subscribers: "210 subscribers",
    distance: "4 km",
    img: "https://images.pexels.com/photos/2193300/pexels-photo-2193300.jpeg",
    coordinate: { latitude: -33.8568, longitude: 151.2153 },
  },
  {
    id: "5",
    name: "London Bridge Quest",
    balance: "Total Balance: £1,300",
    subscribers: "410 subscribers",
    distance: "2.8 km",
    img: "https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg",
    coordinate: { latitude: 51.5074, longitude: -0.1278 },
  },
];

const EventScreen: React.FC<{ 
  setActiveTab?: (location?: { latitude: number; longitude: number; title: string }) => void 
}> = ({ setActiveTab }) => {
  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Image source={{ uri: item.img }} style={styles.image} />
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.detail}>{item.balance}</Text>
      <Text style={styles.detail}>{item.subscribers}</Text>
      <Text style={styles.distance}>📍 {item.distance}</Text>
      
      {/* View on Map Button */}
      <TouchableOpacity 
        style={styles.mapButton}
        onPress={() => setActiveTab && setActiveTab({
          latitude: item.coordinate.latitude,
          longitude: item.coordinate.longitude,
          title: item.name
        })}
      >
        <Text style={styles.mapButtonText}>🗺️ View on Map</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#121212" }}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {/* Floating Map Button */}
      <TouchableWithoutFeedback onPress={() => setActiveTab && setActiveTab()}>
        <View style={styles.floatingButton}>
          <Text style={styles.floatingButtonText}>📍 Map</Text>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    margin: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  image: { width: "100%", height: 180, borderRadius: 10 },
  title: { color: "#fff", fontSize: 18, marginTop: 8, fontWeight: "bold" },
  detail: { color: "#aaa", fontSize: 14, marginTop: 2 },
  distance: { color: "#7B3FE4", fontSize: 14, marginTop: 4 },
  floatingButton: {
    position: "absolute",
    bottom: 80, // Lower position to match MapScreen
    alignSelf: "center",
    backgroundColor: "rgba(123, 63, 228, 0.8)", // More transparent
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 6,
    zIndex: 10,
  },
  floatingButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  // View on Map button
  mapButton: {
    backgroundColor: "#FF9500",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-end", // Move to right side
    marginTop: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  mapButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default EventScreen;

import React from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";

const events = [
  {
    id: "1",
    name: "Paris City Tour",
    balance: "Total Balance: €1200",
    subscribers: "532 subscribers",
    distance: "2 km",
    img: "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&w=600",
  },
  {
    id: "2",
    name: "New York Central Park Hunt",
    balance: "Total Balance: €950",
    subscribers: "420 subscribers",
    distance: "5 km",
    img: "https://images.pexels.com/photos/462118/pexels-photo-462118.jpeg?auto=compress&w=600",
  },
  {
    id: "3",
    name: "Tokyo Night Run",
    balance: "Total Balance: ¥150,000",
    subscribers: "300 subscribers",
    distance: "3.5 km",
    img: "https://images.pexels.com/photos/356830/pexels-photo-356830.jpeg",
  },
  {
    id: "4",
    name: "Sydney Opera Adventure",
    balance: "Total Balance: AU$2,100",
    subscribers: "210 subscribers",
    distance: "4 km",
    img: "https://images.pexels.com/photos/2193300/pexels-photo-2193300.jpeg",
  },
  {
    id: "5",
    name: "London Bridge Quest",
    balance: "Total Balance: £1,300",
    subscribers: "410 subscribers",
    distance: "2.8 km",
    img: "https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg",
  },
];

const EventScreen: React.FC<{ setActiveTab?: (tab: string) => void }> = ({ setActiveTab }) => {
  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <Image source={{ uri: item.img }} style={styles.image} />
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.detail}>{item.balance}</Text>
      <Text style={styles.detail}>{item.subscribers}</Text>
      <Text style={styles.distance}>📍 {item.distance}</Text>
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
      <TouchableWithoutFeedback onPress={() => setActiveTab && setActiveTab("Map")}>
        <View
          style={[
            styles.floatingButton,
            { opacity: 0.8, zIndex: 10, bottom: 95 },
          ]}
        >
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
    bottom: 70,
    alignSelf: "center",
    backgroundColor: "#7B3FE4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 6,
  },
  floatingButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default EventScreen;

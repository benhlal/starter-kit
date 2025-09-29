import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  content: { flex: 1 },
  map: { flex: 1, width: "100%", height: "100%" },

  // Floating Filter
  filterBar: {
    position: "absolute",
    top: 50,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 20,
  },
  filterBtn: {
    backgroundColor: "#1e1e1e",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  filterText: { color: "#fff", fontSize: 13, fontWeight: "600" },

  // Cards
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

  // Floating Button
  floatingButton: {
    position: "absolute",
    bottom: 35,
    alignSelf: "center",
    backgroundColor: "#7B3FE4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    opacity: 0.9,
    elevation: 6,
    zIndex: 10,
  },
  floatingButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

// Map custom style
export const getaroundMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#181a20" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#b0b0b0" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#181a20" }] },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#7B3FE4" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7B3FE4" }],
  },
];

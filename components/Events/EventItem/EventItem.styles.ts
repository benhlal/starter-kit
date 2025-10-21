import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
  cardPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  cardExpired: {
    backgroundColor: "#1a1a1a",
    opacity: 0.6,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 10,
  },
  imageExpired: {
    opacity: 0.5,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
  },
  expandIcon: {
    color: "#7B3FE4",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  statusRow: {
    flexDirection: "row",
    marginTop: 6,
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: "700",
    overflow: "hidden",
  },
  statusOngoing: {
    backgroundColor: "#234",
    color: "#7BDBFF",
  },
  statusExpired: {
    backgroundColor: "#3a0b0b",
    color: "#E53935",
  },
  statusUpcoming: {
    backgroundColor: "#1f3d2a",
    color: "#77e38a",
  },
  statusCompleted: {
    backgroundColor: "#1f3b1f",
    color: "#4CAF50",
  },
  statusRight: {
    marginLeft: "auto",
  },
  detail: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 2,
  },
  distance: {
    color: "#7B3FE4",
    fontSize: 14,
    marginTop: 4,
  },
  planned: {
    color: "#66BB6A",
    fontSize: 14,
    marginTop: 6,
  },
  ongoingText: {
    color: "#7BDBFF",
    fontSize: 14,
    marginTop: 6,
  },
  expiredText: {
    color: "#AAA",
    fontSize: 14,
    marginTop: 6,
  },
  startTime: {
    color: "#FFA726",
    fontSize: 14,
    marginTop: 4,
    fontWeight: "600",
  },
  ongoingStartTime: {
    color: "#7BDBFF",
    fontSize: 13,
    marginTop: 3,
    fontWeight: "500",
  },
  prizePool: {
    color: "#FFD700",
    fontSize: 14,
    marginTop: 3,
    fontWeight: "700",
  },
  countdown: {
    color: "#4ECDC4", // Turquoise blue
    fontSize: 14,
    marginTop: 3,
    fontWeight: "600",
  },
  remainingCoins: {
    color: "#FF4444", // Red color for remaining coins
    fontSize: 14,
    fontWeight: "700",
  },
  difficulty: {
    color: "#FF6B6B",
    fontSize: 14,
    marginTop: 2,
    fontWeight: "600",
  },
  terrain: {
    color: "#4ECDC4",
    fontSize: 14,
    marginTop: 2,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Evenly distribute buttons
    marginTop: 12,
    gap: 8, // Consistent spacing between all buttons
  },
  participateButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 8, // Reduced padding for more compact buttons
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flex: 1, // Equal width distribution
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2, // Small margin for visual separation
  },
  participateButtonText: {
    color: "#fff",
    fontSize: 13, // Slightly smaller to fit better
    fontWeight: "600",
    textAlign: "center",
  },
  participateButtonSubscribed: {
    backgroundColor: "#E53935",
  },
  mapButton: {
    backgroundColor: "#FF9500",
    paddingVertical: 8, // Reduced padding to match participate button
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flex: 1, // Equal width distribution
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2, // Small margin for visual separation
  },
  detailsButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 8, // Reduced padding to match other buttons
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flex: 1, // Equal width distribution
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2, // Small margin for visual separation
  },
  mapButtonText: {
    color: "#fff",
    fontSize: 13, // Consistent font size with participate button
    fontWeight: "600",
    textAlign: "center",
  },
  placeholderImage: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#FFD700", // Gold color for coin
    fontSize: 48, // Larger coin emoji
    textShadowColor: "#FFA500",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

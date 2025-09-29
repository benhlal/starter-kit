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
  title: {
    color: "#fff",
    fontSize: 18,
    marginTop: 8,
    fontWeight: "bold",
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
    backgroundColor: "#332",
    color: "#AAA",
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
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: 12,
  },
  participateButton: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginRight: 12,
  },
  participateButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  mapButton: {
    backgroundColor: "#FF9500",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    // In actions row, so no alignSelf; margin handled by container
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

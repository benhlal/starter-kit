import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 8,
    left: 12,
    right: 12,
    zIndex: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  visible: {
    opacity: 1,
  },
  hidden: {
    opacity: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#2a2a2a",
  },
  chip: {
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3A3A3A",
    marginHorizontal: 4,
  },
  chipText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

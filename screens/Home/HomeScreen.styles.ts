import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  content: {
    flex: 1,
  },
  mapOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  mapOverlayVisible: {
    opacity: 1,
    pointerEvents: "auto",
  },
  mapOverlayHidden: {
    opacity: 0,
    pointerEvents: "none",
  },
  closeButtonContainer: {
    position: "absolute",
    top: 50,
    right: 20,
  },
  closeButton: {
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 20,
  },
  closeButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  disabledText: {
    color: "white",
    padding: 20,
    textAlign: "center",
  },
});

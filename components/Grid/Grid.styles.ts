// src/components/Grid/GridStyles.ts
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  listItem: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    margin: 10,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  listItemText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: "center",
    fontWeight: "bold",
    color: "#333",
  },
  listItemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
});

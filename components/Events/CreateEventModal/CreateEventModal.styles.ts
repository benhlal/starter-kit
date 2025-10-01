import { StyleSheet } from "react-native";

export const createEventModalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#ffffff",
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelText: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "500",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  submitText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555555",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333333",
    backgroundColor: "#ffffff",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  advancedToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  toggleIcon: {
    fontSize: 20,
    color: "#007AFF",
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 50,
  },
  pickerText: {
    color: "#333333",
    fontSize: 16,
  },
  flexRowSpacing: {
    flex: 1,
    marginRight: 8,
  },
  flexRowSpacingLeft: {
    flex: 1,
    marginLeft: 8,
  },
  dateText: {
    color: "#333333",
    fontSize: 16,
  },
});

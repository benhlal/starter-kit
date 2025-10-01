import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    padding: 0,
    paddingBottom: 20,
  },

  // Event Details
  eventDetails: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#373737",
  },
  eventName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  eventCategory: {
    fontSize: 14,
    color: "#D946EF",
    fontWeight: "600",
  },

  // Prize Section
  prizeSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  prizeAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFD700",
    marginBottom: 4,
  },
  experienceBonus: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },

  // Participation Section
  participationSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 16,
    color: "#EDEDED",
    fontWeight: "500",
  },
  feeAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#D946EF",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },
  insufficientBalance: {
    color: "#EF4444",
  },
  warningText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
  participantInfo: {
    alignItems: "center",
    paddingVertical: 8,
  },
  participantText: {
    fontSize: 16,
    color: "#10B981",
    fontWeight: "600",
    marginBottom: 4,
  },
  participantSubtext: {
    fontSize: 14,
    color: "#9CA3AF",
  },

  // Timing-based fee styles
  lateFee: {
    color: "#EF4444",
  },
  totalFeeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#373737",
  },
  totalFeeLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  totalFeeAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#D946EF",
  },
  lateTotal: {
    color: "#EF4444",
  },
  timingWarning: {
    fontSize: 12,
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 8,
    fontStyle: "italic",
  },

  // Refund info styles
  refundInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  refundLabel: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  refundAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },
  noRefund: {
    color: "#EF4444",
  },
  refundExplanation: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 8,
    fontStyle: "italic",
  },
  penaltyWarning: {
    fontSize: 12,
    color: "#EF4444",
    textAlign: "center",
    fontWeight: "600",
  },

  // Hunt Details
  huntDetails: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  detailValue: {
    fontSize: 14,
    color: "#EDEDED",
    fontWeight: "600",
  },

  // Action Buttons
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  participateButton: {
    backgroundColor: "#D946EF",
  },
  unsubscribeButton: {
    backgroundColor: "#EF4444",
  },
  cancelButton: {
    backgroundColor: "#1C1C1C",
    borderWidth: 1,
    borderColor: "#373737",
  },
  disabledButton: {
    backgroundColor: "#374151",
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  disabledButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  coinsCollectedIndicator: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    padding: 8,
    borderRadius: 6,
    textAlign: "center",
    marginVertical: 8,
  },
  testButton: {
    backgroundColor: "#FF6B35",
    padding: 8,
    borderRadius: 6,
    marginVertical: 8,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  bonusRefundText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F59E0B",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    padding: 8,
    borderRadius: 6,
    textAlign: "center",
    marginTop: 8,
  },
});

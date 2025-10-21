import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Event } from "../../../types";
import { useRecoilValue } from "recoil";
import { coinsState } from "../../../state/recoil/atoms";
import BottomSheet from "../../Filters/Sheet/BottomSheet";
import { styles } from "./ParticipationModal.styles";
import { ParticipationService } from "../../../services/ParticipationService";

interface ParticipationModalProps {
  visible: boolean;
  event: Event | null;
  userCoins: number;
  userId?: string;
  onClose: () => void;
  onParticipate: (
    eventId: string,
    participationFee: number
  ) => Promise<boolean>;
  onUnsubscribe: (eventId: string) => Promise<boolean>;
  isParticipant: boolean;
}

export const ParticipationModal: React.FC<ParticipationModalProps> = ({
  visible,
  event,
  userCoins,
  userId,
  onClose,
  onParticipate,
  onUnsubscribe,
  isParticipant,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasCollectedCoins, setHasCollectedCoins] = useState(false);

  const participationService = ParticipationService.getInstance();

  // Calculate base participation fee (10% of total prize pool)
  const coins = useRecoilValue(coinsState);

  const availableCoinsCount = useMemo(() => {
    try {
      if (!event || !coins || coins.length === 0) {
        return event?.huntDetails?.coinsRemaining ?? event?.huntDetails?.coinsAvailable ?? 0;
      }
      return coins.filter((c) => c.eventId === event.id && !c.collected).length;
    } catch (e) {
      return event?.huntDetails?.coinsRemaining ?? event?.huntDetails?.coinsAvailable ?? 0;
    }
  }, [coins, event]);

  // Calculate total token value of remaining coins
  const totalTokenValueRemaining = useMemo(() => {
    try {
      if (!event || !coins || coins.length === 0) {
        return 0;
      }
      return coins
        .filter((c) => c.eventId === event.id && !c.collected)
        .reduce((sum, c) => sum + (c.value || 0), 0);
    } catch (e) {
      return 0;
    }
  }, [coins, event]);

  // Check if user has collected coins from this event when modal opens
  useEffect(() => {
    const checkCollectedCoins = async () => {
      if (isParticipant && userId && event) {
        try {
          const collected =
            await participationService.hasCollectedCoinsFromEvent(
              userId,
              event.id
            );
          setHasCollectedCoins(collected);
        } catch (error) {
          console.error("Error checking collected coins:", error);
          setHasCollectedCoins(false);
        }
      }
    };

    if (visible) {
      checkCollectedCoins();
    }
  }, [visible, isParticipant, userId, event, participationService]);

  if (!event) {
    return (
      <BottomSheet
        visible={visible}
        title="Loading..."
        onClose={onClose}
        maxHeightPercent={0.7}
      >
        <View style={styles.container}>
          <Text>Loading event details...</Text>
        </View>
      </BottomSheet>
    );
  }

  // Get entry fee from event data (minimum 10 tokens)
  const entryFee = event?.huntDetails?.tokensRequired || 10;

  // Calculate prize pool
  const prizePool = event?.huntDetails?.totalPrizePool || event?.rewards?.coins || 0;

  // Calculate actual fee with timing adjustments
  const getEventStartTime = (eventDate: any): number | null => {
    if (!eventDate) {
      return null;
    }
    try {
      if (typeof eventDate === "object" && eventDate !== null) {
        if (typeof eventDate.toDate === "function") {
          return eventDate.toDate().getTime();
        }
        if (typeof eventDate.seconds === "number") {
          return eventDate.seconds * 1000;
        }
      }
      const timestamp = Date.parse(eventDate);
      return Number.isNaN(timestamp) ? null : timestamp;
    } catch (error) {
      return null;
    }
  };

  const now = Date.now();
  const startTime = getEventStartTime(event.startDate);
  const isOngoing = startTime ? startTime <= now : false;

  // Calculate actual participation fee (use token entry fee)
  const participationFee = isOngoing ? entryFee + 10 : entryFee;

  // Calculate potential refund info for leaving
  const getRefundInfo = () => {
    if (!startTime) {
      return { refund: participationFee, explanation: "Full refund" };
    }

    if (hasCollectedCoins) {
      return {
        refund: participationFee,
        explanation: "Full refund + keep collected coins",
      };
    }

    if (isOngoing) {
      return { refund: 0, explanation: "No refund - event started" };
    } else {
      const hoursUntilStart = (startTime - now) / (1000 * 60 * 60);
      if (hoursUntilStart >= 5) {
        return { refund: participationFee, explanation: "Free cancellation" };
      } else {
        const penaltyHours = 5 - Math.max(0, hoursUntilStart);
        const penalty = Math.floor(penaltyHours * 2);
        const refund = Math.max(0, participationFee - penalty);
        return {
          refund,
          explanation: `${penalty} coins cancellation fee`,
        };
      }
    }
  };

  const refundInfo = getRefundInfo();

  const canAfford = userCoins >= participationFee;
  const isEventActive = event.status !== "completed";

  const handleParticipate = async () => {
    if (!canAfford) {
      Alert.alert(
        "Insufficient Tokens",
        `You need ${participationFee} tokens to participate in this event. You currently have ${userCoins} tokens.`,
        [{ text: "OK" }]
      );
      return;
    }

    setIsLoading(true);
    try {
      const success = await onParticipate(event.id, participationFee);
      if (success) {
        Alert.alert(
          "Success!",
          `You've successfully joined "${event.name}". Good luck hunting for AR coins!`,
          [{ text: "OK", onPress: onClose }]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to join the event. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    const currentRefundInfo = getRefundInfo();
    const eventName = event.name || event.title;

    // Enhanced confirmation with better formatting
    const confirmationTitle = "🚪 Leave Hunt";
    const confirmationMessage = [
      `Are you sure you want to leave "${eventName}"?`,
      "",
      "💰 REFUND DETAILS:",
      `• Amount: ${currentRefundInfo.refund} tokens`,
      `• Reason: ${currentRefundInfo.explanation}`,
      hasCollectedCoins ? "• Bonus: You keep all collected coins! 🪙" : "",
    ]
      .filter(Boolean)
      .join("\n");

    Alert.alert(confirmationTitle, confirmationMessage, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave Hunt",
        style: "destructive",
        onPress: async () => {
          setIsLoading(true);
          try {
            const success = await onUnsubscribe(event.id);
            if (success) {
              onClose();
              // The success message is now handled in EventScreen.tsx
            }
          } catch (error) {
            Alert.alert("Error", "Failed to leave the hunt. Please try again.");
          } finally {
            setIsLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <BottomSheet
      visible={visible}
      title={isParticipant ? "🎯 Hunt Participation" : "🚀 Join AR Coin Hunt"}
      onClose={onClose}
      maxHeightPercent={0.7}
    >
      <View style={styles.container}>
        {/* Event Details */}
        <View style={styles.eventDetails}>
          <Text style={styles.eventName}>{event.name}</Text>
          <Text style={styles.eventCategory}>AR Coin Hunt</Text>
        </View>

        {/* Entry Fee & Prize Pool */}
        <View style={styles.prizeSection}>
          <Text style={styles.sectionTitle}>💰 Entry Fee & Prize Pool</Text>
          <Text style={styles.prizeAmount}>
            Entry Fee: {entryFee} tokens
          </Text>
          <Text style={styles.prizeAmount}>
            Prize Pool: {prizePool} tokens
          </Text>
        </View>

        {/* AR Coins to Collect */}
        <View style={styles.participationSection}>
          <Text style={styles.sectionTitle}>🪙 AR Coins to Collect</Text>
          <Text style={styles.coinStat}>
            Coins Available: {availableCoinsCount}
          </Text>
          <Text style={styles.coinStat}>
            Total Token Value: {totalTokenValueRemaining} tokens
          </Text>
        </View>

        {/* Participation Details */}
        <View style={styles.participationSection}>
          <Text style={styles.sectionTitle}>
            {isParticipant ? "📋 Your Participation" : "🎯 Entry Requirements"}
          </Text>

          {!isParticipant ? (
            <>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Entry Fee:</Text>
                <Text style={styles.feeAmount}>{entryFee} tokens</Text>
              </View>
              {isOngoing && (
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>Late Join Fee:</Text>
                  <Text style={[styles.feeAmount, styles.lateFee]}>
                    +10 tokens
                  </Text>
                </View>
              )}
              <View style={styles.totalFeeRow}>
                <Text style={styles.totalFeeLabel}>Total Cost:</Text>
                <Text
                  style={[styles.totalFeeAmount, isOngoing && styles.lateTotal]}
                >
                  {participationFee} tokens
                </Text>
              </View>
              {isOngoing && (
                <Text style={styles.timingWarning}>
                  ⚠️ Event already started - late join penalty applies
                </Text>
              )}
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Your Token Balance:</Text>
                <Text
                  style={[
                    styles.balanceAmount,
                    !canAfford && styles.insufficientBalance,
                  ]}
                >
                  {userCoins} tokens
                </Text>
              </View>
              {!canAfford && (
                <Text style={styles.warningText}>
                  ⚠️ Insufficient tokens to participate
                </Text>
              )}
            </>
          ) : (
            <View style={styles.participantInfo}>
              <Text style={styles.participantText}>
                ✅ You're registered for this hunt!
              </Text>
              {hasCollectedCoins && (
                <Text style={styles.coinsCollectedIndicator}>
                  🪙 Coins collected - Full refund guaranteed!
                </Text>
              )}

              <View style={styles.refundInfoContainer}>
                <Text style={styles.refundLabel}>Leave Hunt Refund:</Text>
                <Text
                  style={[
                    styles.refundAmount,
                    refundInfo.refund === 0 && styles.noRefund,
                  ]}
                >
                  {refundInfo.refund} tokens
                </Text>
              </View>
              <Text style={styles.refundExplanation}>
                {refundInfo.explanation}
              </Text>
              {hasCollectedCoins && (
                <Text style={styles.bonusRefundText}>
                  💰 Bonus: You keep all collected coins!
                </Text>
              )}
              {refundInfo.refund < participationFee && !hasCollectedCoins && (
                <Text style={styles.penaltyWarning}>
                  ⚠️ Cancellation penalties apply
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Hunt Details */}
        <View style={styles.huntDetails}>
          <Text style={styles.sectionTitle}>🏞️ Hunt Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Difficulty:</Text>
            <Text style={styles.detailValue}>
              {(event as any).huntDetails?.difficulty || "Medium"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Terrain:</Text>
            <Text style={styles.detailValue}>
              {(event as any).huntDetails?.terrain || "Urban"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Range:</Text>
            <Text style={styles.detailValue}>
              {(event as any).huntDetails?.range || "2"}km radius
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!isEventActive ? (
            <View style={styles.disabledButton}>
              <Text style={styles.disabledButtonText}>Event Completed</Text>
            </View>
          ) : isParticipant ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.unsubscribeButton]}
              onPress={handleUnsubscribe}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionButtonText}>Leave Hunt</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.participateButton,
                !canAfford && styles.disabledButton,
              ]}
              onPress={handleParticipate}
              disabled={isLoading || !canAfford}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionButtonText}>
                  Join Hunt ({participationFee} tokens)
                </Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
};

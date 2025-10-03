import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  StyleSheet,
  Animated,
  Text,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Alert,
  Linking,
} from "react-native";

import { EventList } from "../../components/Events/EventList";

import { uiFiltersState, eventsState } from "../../state/recoil/atoms";
import {
  useLocationFilter,
  useTimeFilter,
  useEvents,
  useAuthUser,
  useUserProfile,
} from "../../state/recoil/hooks";
import {
  FloatingFilters,
  FilterChip,
} from "../../components/Filters/FloatingFilters/FloatingFilters";

import { PickupMethodModal } from "../../components/Filters/Modal/PickupMethodModal";
import { MoreFiltersModal } from "../../components/Filters/Modal/MoreFiltersModal";
import { LocationFilterModal } from "../../components/Filters/Modal/LocationFilterModal";
import { StatusFilterModal } from "../../components/Filters/Modal/StatusFilterModal";
import { TimeFilterModal } from "../../components/Filters/Modal/TimeFilterModal";
import { CreateEventModal } from "../../components/Events/CreateEventModal";
import { ParticipationModal } from "../../components/Events/ParticipationModal";
import BottomSheet from "../../components/Filters/Sheet/BottomSheet";
import TopSearch from "../../components/Filters/TopSearch/TopSearch";
import { useRecoilState } from "recoil";
import {
  mapCenterOnUserState,
  mapSelectLocationModeState,
} from "../../state/recoil/atoms";

import { participationService } from "../../services/ParticipationService";
// import { styles } from "./EventScreen.styles"; // TODO: Use when implementing styled components

interface EventScreenProps {
  setActiveTab?: (location?: {
    latitude: number;
    longitude: number;
    title: string;
  }) => void;
  onBack?: () => void;
  onOpenDetails?: (eventId: string) => void;
}

const EventScreen: React.FC<EventScreenProps> = ({
  setActiveTab,
  onBack,
  onOpenDetails,
}) => {
  const [filtersVisible, setFiltersVisible] = useState(true);
  const filtersOpacity = useRef(new Animated.Value(1)).current;
  const [filters, setFilters] = useRecoilState(uiFiltersState);
  const [_localEvents, setLocalEvents] = useRecoilState(eventsState);
  const { events, fetchEvents } = useEvents();
  const { fetchUserProfile } = useUserProfile();

  // Fetch events when component mounts
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const [pickupOpen, setPickupOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<null | {
    title: string;
    fee?: string;
  }>(null);
  // Top search pills state
  const [locationOpen, setLocationOpen] = useState(false);
  const [whenOpen, setWhenOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [createEventModalVisible, setCreateEventModalVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // const { userProfile } = useUserProfile(); // TODO: Use for user-specific features
  const { selectedLocation } = useLocationFilter();
  const { currentUser } = useAuthUser();
  const [participationModalVisible, setParticipationModalVisible] =
    useState(false);

  // Load user data when component mounts or user changes
  const loadUserData = useCallback(async () => {
    if (currentUser?.uid) {
      try {
        const userProfile = await participationService.getUserProfile(
          currentUser.uid
        );
        if (userProfile) {
          console.log("👤 Loading user profile:", {
            coins: userProfile.coins,
            joinedEvents: userProfile.joinedEvents,
          });
          setUserCoins(userProfile.coins);
          setUserParticipations(userProfile.joinedEvents);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [userCoins, setUserCoins] = useState(0);
  const [userParticipations, setUserParticipations] = useState<string[]>([]);
  const {
    timePreset,
    customDateRange,
    eventStatus,
    setTimePreset,
    setCustomDateRange,
    setEventStatus,
  } = useTimeFilter();

  // Generate when label based on current time filter
  const whenLabel = useMemo(() => {
    if (timePreset === "anytime") {
      return "When?";
    }
    if (timePreset === "today") {
      return "Today";
    }
    if (timePreset === "tomorrow") {
      return "Tomorrow";
    }
    if (timePreset === "this-week") {
      return "This week";
    }
    if (timePreset === "next-week") {
      return "Next week";
    }
    if (timePreset === "this-month") {
      return "This month";
    }
    if (timePreset === "custom" && customDateRange) {
      const start = new Date(customDateRange.startDate);
      const end = new Date(customDateRange.endDate);
      return `${start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })} - ${end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}`;
    }
    return "When?";
  }, [timePreset, customDateRange]);

  // Use the selected location from the filter, with "Anywhere" as fallback
  const locationLabel =
    selectedLocation === "anywhere" ? "Anywhere" : selectedLocation;
  const [, setCenterOnUser] = useRecoilState(mapCenterOnUserState);
  const [, setSelectMode] = useRecoilState(mapSelectLocationModeState);

  // Request location permission on Android; iOS dialog is handled by the system when accessing location
  const ensureLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS !== "android") {
      return true;
    }
    try {
      const fine = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (fine === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      }
      const coarse = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
      );
      if (coarse === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      }
      Alert.alert(
        "Location permission needed",
        "Please enable location permission in settings to use your current location.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    } catch (e) {
      console.warn("Location permission error", e);
      return false;
    }
  };

  const chips: FilterChip[] = useMemo(() => {
    const statusLabel =
      eventStatus === "any"
        ? "Status"
        : eventStatus === "ongoing"
        ? "Ongoing"
        : eventStatus === "upcoming"
        ? "Upcoming"
        : "Completed";

    const pickupLabel =
      filters.pickupMethod === "any"
        ? "Pickup method"
        : filters.pickupMethod === "meet-owner"
        ? "Meet owner"
        : "Connect";

    const moreCount =
      (filters.subscribedOnly ? 1 : 0) +
      (filters.newEventsOnly ? 1 : 0) +
      (filters.participantsMin > 0 ? 1 : 0) +
      (filters.cities?.length || 0);
    const moreLabel =
      moreCount > 0 ? `More filters (${moreCount})` : "More filters";

    const isStatusActive = eventStatus !== "any";
    const isPickupActive = filters.pickupMethod !== "any";
    const isMoreActive = moreCount > 0;

    return [
      {
        id: "status",
        label: statusLabel,
        onPress: () => setStatusOpen(true),
        active: isStatusActive,
      },
      {
        id: "pickup",
        label: pickupLabel,
        onPress: () => setPickupOpen(true),
        active: isPickupActive,
      },
      {
        id: "more",
        label: moreLabel,
        onPress: () => setMoreOpen(true),
        active: isMoreActive,
      },
    ];
  }, [eventStatus, filters]);

  const setVisible = (visible: boolean) => {
    setFiltersVisible(visible);
    Animated.timing(filtersOpacity, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const handleEventPress = (event: any) => {
    if (setActiveTab) {
      const coord = event.coordinate ?? event.location;
      if (
        coord &&
        coord.latitude !== undefined &&
        coord.longitude !== undefined
      ) {
        setActiveTab({
          latitude: coord.latitude,
          longitude: coord.longitude,
          title: event.name || event.title,
        });
      } else {
        console.warn(`Event ${event.id} has invalid location data:`, coord);
      }
    }
  };

  // Helper function to update participant count immediately for instant feedback
  const updateParticipantCount = (eventId: string, increment: number) => {
    setLocalEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === eventId
          ? {
              ...event,
              currentParticipants: Math.max(
                0,
                (event.currentParticipants || 0) + increment
              ),
            }
          : event
      )
    );
  };

  const handleParticipate = (event: any) => {
    console.log("🎯 Opening participation modal for event:", event.id);
    // Refresh user data to ensure accurate participation status
    loadUserData();
    setSelectedEvent(event);
    setParticipationModalVisible(true);
  };

  const handleParticipateConfirm = async (
    eventId: string,
    baseFee: number
  ): Promise<boolean> => {
    try {
      if (!selectedEvent) {
        throw new Error("No event selected");
      }

      const result = await participationService.participateInEvent(
        eventId,
        selectedEvent.name || "AR Coin Hunt",
        selectedEvent,
        baseFee
      );

      if (result.success) {
        // Update participant count immediately for instant feedback
        updateParticipantCount(eventId, 1);

        // Update local state with actual fee paid
        const newBalance = userCoins - result.fee;
        setUserCoins(newBalance);
        setUserParticipations([...userParticipations, eventId]);

        // Show success message
        Alert.alert(
          "Joined Hunt Successfully!",
          `${result.message}\nFee Paid: ${result.fee} coins\nNew Balance: ${newBalance} coins`
        );

        // Refresh user data from server to ensure sync
        if (currentUser?.uid) {
          const userProfile = await participationService.getUserProfile(
            currentUser.uid
          );
          if (userProfile) {
            setUserCoins(userProfile.coins);
            setUserParticipations(userProfile.joinedEvents);
          }
        }

        // Refresh events and profile to update participant count with small delay for database consistency
        setTimeout(() => {
          fetchEvents();
          if (currentUser?.uid) {
            fetchUserProfile(currentUser.uid);
          }
        }, 500);
      } else {
        // Show error message
        Alert.alert("Cannot Join", result.message);
      }

      return result.success;
    } catch (error) {
      console.error("Participation error:", error);
      Alert.alert("Error", "Failed to join event. Please try again.");
      return false;
    }
  };

  const handleUnsubscribe = async (eventId: string): Promise<boolean> => {
    try {
      if (!selectedEvent) {
        throw new Error("No event selected");
      }

      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      // Check if user has collected coins from this event
      const hasCollectedCoins =
        await participationService.hasCollectedCoinsFromEvent(
          currentUser.uid,
          eventId
        );

      const result = await participationService.leaveEvent(
        eventId,
        selectedEvent,
        hasCollectedCoins
      );

      if (result.success) {
        // Update participant count immediately for instant feedback
        updateParticipantCount(eventId, -1);

        // Update local state with actual refund
        const newBalance = userCoins + result.refund;
        setUserCoins(newBalance);
        setUserParticipations(
          userParticipations.filter((id) => id !== eventId)
        );

        // Show refund message
        Alert.alert(
          "Left Hunt Successfully!",
          `${result.message}\nRefund: ${result.refund} coins\nNew Balance: ${newBalance} coins`
        );

        // Refresh user data from server to ensure sync
        if (currentUser?.uid) {
          const userProfile = await participationService.getUserProfile(
            currentUser.uid
          );
          if (userProfile) {
            setUserCoins(userProfile.coins);
            setUserParticipations(userProfile.joinedEvents);
          }
        }

        // Refresh events and profile to update participant count with small delay for database consistency
        setTimeout(() => {
          fetchEvents();
          if (currentUser?.uid) {
            fetchUserProfile(currentUser.uid);
          }
        }, 500);
      } else {
        Alert.alert("Cannot Leave", result.message);
      }

      return result.success;
    } catch (error) {
      console.error("Unsubscribe error:", error);
      Alert.alert("Error", "Failed to leave event. Please try again.");
      return false;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchEvents();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Apply filters and sorting by start time (most recent first)
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) {
      return [];
    }

    // Helper function to get timestamp from event date
    const getTimestamp = (eventDate: any) => {
      if (!eventDate) {
        return 0;
      }

      // Handle Firebase Timestamp objects
      if (typeof eventDate === "object" && eventDate !== null) {
        if (typeof eventDate.toDate === "function") {
          return eventDate.toDate().getTime();
        }
        if (typeof eventDate.seconds === "number") {
          return eventDate.seconds * 1000;
        }
        if (eventDate.getTime) {
          return eventDate.getTime();
        }
      }

      // Handle ISO string dates
      const timestamp = Date.parse(eventDate);
      return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    // Helper function to determine event status
    const getEventStatus = (event: any) => {
      const now = Date.now();
      const startMs = getTimestamp(event.startDate);
      const endMs = getTimestamp(event.endDate);

      if (endMs && endMs < now) {
        return "completed";
      }
      if (startMs && startMs <= now && (!endMs || endMs >= now)) {
        return "ongoing";
      }
      if (startMs && startMs > now) {
        return "upcoming";
      }
      return "upcoming"; // Default fallback
    };

    // Start with all events
    let filtered = [...events];

    // Apply status filter
    if (eventStatus !== "any") {
      filtered = filtered.filter((event) => {
        const status = getEventStatus(event);
        return status === eventStatus;
      });
    }

    // Apply more filters
    // Filter by subscribed events only
    if (filters.subscribedOnly) {
      filtered = filtered.filter((event) =>
        userParticipations.includes(event.id)
      );
    }

    // Filter by minimum participants
    if (filters.participantsMin > 0) {
      filtered = filtered.filter((event) => {
        const participantCount = event.participants?.length || 0;
        return participantCount >= filters.participantsMin;
      });
    }

    // Filter by new events only (created within 7 days)
    if (filters.newEventsOnly) {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      filtered = filtered.filter((event) => {
        const createdAt = getTimestamp(event.createdAt);
        return createdAt >= sevenDaysAgo;
      });
    }

    // Filter by cities
    if (filters.cities.length > 0) {
      filtered = filtered.filter((event) => {
        const eventAddress =
          event.location?.address || event.location?.venue || "";
        return filters.cities.some((city) =>
          eventAddress.toLowerCase().includes(city.toLowerCase())
        );
      });
    }

    // Sort by start time descending (most recent first)
    return filtered.sort((a, b) => {
      const aTime = getTimestamp(a.startDate);
      const bTime = getTimestamp(b.startDate);
      return bTime - aTime;
    });
  }, [events, eventStatus, filters, userParticipations]);

  return (
    <View style={screenStyles.container}>
      {/* Floating Back Button */}
      {onBack && (
        <TouchableOpacity
          style={screenStyles.backButton}
          onPress={onBack}
          activeOpacity={0.8}
        >
          <Text style={screenStyles.backButtonText}>←</Text>
        </TouchableOpacity>
      )}

      {/* Admin buttons moved to Profile → Admin Operations section */}

      {/* Top search pills overlay */}
      <TopSearch
        locationLabel={locationLabel}
        whenLabel={whenLabel}
        onPressLocation={() => setLocationOpen(true)}
        onPressWhen={() => setWhenOpen(true)}
        visible={filtersVisible}
        animatedValue={filtersOpacity}
      />
      {/* Floating Filters overlay */}
      <FloatingFilters
        chips={chips}
        visible={filtersVisible}
        animatedValue={filtersOpacity}
      />

      {/* Status filter modal */}
      <StatusFilterModal
        visible={statusOpen}
        value={eventStatus}
        onClose={() => setStatusOpen(false)}
        onSelect={setEventStatus}
      />

      {/* Time filter modal */}
      <TimeFilterModal
        visible={whenOpen}
        timePreset={timePreset}
        customDateRange={customDateRange}
        onClose={() => setWhenOpen(false)}
        onSelectPreset={setTimePreset}
        onSelectDateRange={setCustomDateRange}
      />

      {/* Pickup method modal */}
      <PickupMethodModal
        visible={pickupOpen}
        value={filters.pickupMethod}
        onClose={() => setPickupOpen(false)}
        onSelect={(v) => {
          setFilters((prev) => ({ ...prev, pickupMethod: v }));
          setPickupOpen(false);
        }}
      />

      {/* More filters modal */}
      <MoreFiltersModal
        visible={moreOpen}
        subscribedOnly={filters.subscribedOnly}
        participantsMin={filters.participantsMin}
        newEventsOnly={filters.newEventsOnly}
        cities={filters.cities}
        onClose={() => setMoreOpen(false)}
        onChange={(changes) => setFilters((prev) => ({ ...prev, ...changes }))}
      />

      <EventList
        events={filteredEvents}
        onEventPress={handleEventPress}
        onScrollDirectionChange={(dir) => setVisible(dir === "up")}
        topInset={140}
        onParticipate={handleParticipate}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        userParticipations={userParticipations}
        onDetails={(id) => onOpenDetails?.(id)}
      />

      {/* Fancy BottomSheet confirm dialog */}
      <BottomSheet
        visible={!!confirmOpen}
        title={confirmOpen?.title}
        onClose={() => setConfirmOpen(null)}
        maxHeightPercent={0.35}
      >
        {confirmOpen?.fee ? (
          <Text style={confirmStyles.fee}>{confirmOpen.fee}</Text>
        ) : null}
        <Text style={confirmStyles.message}>
          Do you want to join this event?
        </Text>
        <View style={confirmStyles.row}>
          <TouchableOpacity
            style={[confirmStyles.btn, confirmStyles.btnCancel]}
            onPress={() => setConfirmOpen(null)}
          >
            <Text style={confirmStyles.btnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[confirmStyles.btn, confirmStyles.btnConfirm]}
            onPress={() => setConfirmOpen(null)}
          >
            <Text style={confirmStyles.btnText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* Participation Modal */}
      <ParticipationModal
        visible={participationModalVisible}
        event={selectedEvent}
        userCoins={userCoins}
        userId={currentUser?.uid}
        isParticipant={(() => {
          const isParticipant = selectedEvent
            ? userParticipations.includes(selectedEvent.id)
            : false;
          console.log("🎯 EventScreen isParticipant calculation:", {
            selectedEventId: selectedEvent?.id,
            userParticipations,
            isParticipant,
          });
          return isParticipant;
        })()}
        onClose={() => {
          console.log("🚪 Closing participation modal");
          // Refresh user data when modal closes to ensure UI is in sync
          loadUserData();
          setParticipationModalVisible(false);
        }}
        onParticipate={handleParticipateConfirm}
        onUnsubscribe={handleUnsubscribe}
      />

      {/* Location filter modal */}
      <LocationFilterModal
        visible={locationOpen}
        onClose={() => setLocationOpen(false)}
        onCurrentLocation={async () => {
          const hasPermission = await ensureLocationPermission();
          if (hasPermission) {
            setCenterOnUser(true);
            setActiveTab?.();
          }
        }}
        onChooseOnMap={() => {
          setSelectMode(true);
          setActiveTab?.();
        }}
      />

      {/* Create Event Modal */}
      <CreateEventModal
        isVisible={createEventModalVisible}
        onClose={() => setCreateEventModalVisible(false)}
        onEventCreated={(eventId) => {
          console.log("Event created with ID:", eventId);
          setCreateEventModalVisible(false);
          // TODO: Refresh events list or navigate to new event
        }}
      />
    </View>
  );
};

const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(28, 28, 28, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  backButtonText: {
    fontSize: 20,
    color: "#EDEDED",
    fontWeight: "600",
  },
  adminButtonsContainer: {
    position: "absolute",
    top: "50%",
    right: 20,
    transform: [{ translateY: -40 }],
    flexDirection: "column",
    gap: 8,
    zIndex: 1000,
  },
  populateButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#D946EF",
  },
  populateButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#EF4444",
  },
  clearButtonText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});

export default EventScreen;

const confirmStyles = StyleSheet.create({
  fee: { color: "#FFFFFF", fontWeight: "700", marginBottom: 6 },
  message: { color: "#EDEDED", marginBottom: 12 },
  row: { flexDirection: "row", gap: 12 },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancel: {
    backgroundColor: "#1C1C1C",
    borderWidth: 1,
    borderColor: "#373737",
  },
  btnConfirm: { backgroundColor: "#D946EF" },
  btnText: { color: "#FFFFFF", fontWeight: "700" },
});

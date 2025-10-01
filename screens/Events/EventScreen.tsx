import React, { useMemo, useRef, useState, useEffect } from "react";
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
import firestore from "@react-native-firebase/firestore";
import { EventList } from "../../components/Events/EventList";
import { FocusLocation } from "../../types";
import { uiFiltersState } from "../../state/recoil/atoms";
import {
  useLocationFilter,
  useTimeFilter,
  useEvents,
  useAuthUser,
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
import BottomSheet from "../../components/Filters/Sheet/BottomSheet";
import TopSearch from "../../components/Filters/TopSearch/TopSearch";
import { useRecoilState } from "recoil";
import {
  mapCenterOnUserState,
  mapSelectLocationModeState,
} from "../../state/recoil/atoms";
import { populateMoreEvents } from "../../utils/populateEvents";
import { isAdmin } from "../../utils/userRoles";
// import { styles } from "./EventScreen.styles"; // TODO: Use when implementing styled components

interface EventScreenProps {
  setActiveTab?: (location?: FocusLocation) => void;
  onBack?: () => void;
}

const EventScreen: React.FC<EventScreenProps> = ({ setActiveTab, onBack }) => {
  const [filtersVisible, setFiltersVisible] = useState(true);
  const filtersOpacity = useRef(new Animated.Value(1)).current;
  const [filters, setFilters] = useRecoilState(uiFiltersState);
  const { events, fetchEvents } = useEvents();

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
  // const { userProfile } = useUserProfile(); // TODO: Use for user-specific features
  const { selectedLocation } = useLocationFilter();
  const { currentUser } = useAuthUser();
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

  const handleParticipate = (event: any) => {
    const fee = event?.rewards?.coins
      ? `Participation fee: ${Math.max(
          1,
          Math.floor(event.rewards.coins / 100)
        )} coins`
      : undefined;
    setConfirmOpen({ title: "Participate", fee });
  };

  // Apply filters including time status and when preset
  const filteredEvents = useMemo(() => {
    // For now, return all events to avoid mutation errors
    // TODO: Implement proper filtering later
    return events || [];
  }, [events]);

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

      {/* Admin Only: Populate Events Button */}
      {isAdmin(currentUser?.email || null) && (
        <View style={screenStyles.adminButtonsContainer}>
          <TouchableOpacity
            style={screenStyles.populateButton}
            onPress={async () => {
              try {
                await populateMoreEvents();
                Alert.alert("Success", "25 new AR coin hunt events added!");
                fetchEvents(); // Refresh the events list
              } catch (error) {
                Alert.alert("Error", "Failed to populate events");
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={screenStyles.populateButtonText}>
              🔧 Admin: Add Events
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={screenStyles.clearButton}
            onPress={() => {
              Alert.alert(
                "Clear All Events",
                "Are you sure you want to delete ALL events? This action cannot be undone.",
                [
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                  {
                    text: "Clear All",
                    style: "destructive",
                    onPress: async () => {
                      try {
                        const eventsSnapshot = await firestore()
                          .collection("events")
                          .get();
                        const batch = firestore().batch();

                        eventsSnapshot.docs.forEach((doc) => {
                          batch.delete(doc.ref);
                        });

                        await batch.commit();
                        Alert.alert(
                          "Success",
                          `Deleted ${eventsSnapshot.docs.length} events`
                        );
                        fetchEvents(); // Refresh the events list
                      } catch (error) {
                        Alert.alert("Error", "Failed to clear events");
                      }
                    },
                  },
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <Text style={screenStyles.clearButtonText}>
              🗑️ Admin: Clear Events
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
    top: 60,
    right: 20,
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

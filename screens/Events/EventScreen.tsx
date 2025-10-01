import React, { useMemo, useRef, useState } from "react";
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
import { FloatingButton } from "../../components/Home/FloatingButton";
import { events } from "../../utils/constants";

import { FocusLocation } from "../../types";
import { uiFiltersState } from "../../state/recoil/atoms";
import {
  useUserProfile,
  useLocationFilter,
  useTimeFilter,
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
// import { styles } from "./EventScreen.styles"; // TODO: Use when implementing styled components

interface EventScreenProps {
  setActiveTab?: (location?: FocusLocation) => void;
}

const EventScreen: React.FC<EventScreenProps> = ({ setActiveTab }) => {
  const [filtersVisible, setFiltersVisible] = useState(true);
  const filtersOpacity = useRef(new Animated.Value(1)).current;
  const [filters, setFilters] = useRecoilState(uiFiltersState);

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
  const { userProfile } = useUserProfile();
  const { selectedLocation } = useLocationFilter();
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
      setActiveTab({
        latitude: event.coordinate.latitude,
        longitude: event.coordinate.longitude,
        title: event.name,
      });
    }
  };

  const handleFloatingButtonPress = () => {
    if (setActiveTab) {
      setActiveTab();
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
    let result = events;

    // Filter by event status
    if (eventStatus !== "any") {
      const now = new Date();
      result = result.filter((e) => {
        const startTime = new Date(e.startDate);
        const endTime = new Date(e.endDate);

        switch (eventStatus) {
          case "completed":
            return endTime < now;
          case "ongoing":
            return startTime <= now && now <= endTime;
          case "upcoming":
            return startTime > now;
          default:
            return true;
        }
      });
    }

    // Filter by time preset
    if (timePreset !== "anytime") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter((e) => {
        const eventStart = new Date(e.startDate);
        const eventDate = new Date(
          eventStart.getFullYear(),
          eventStart.getMonth(),
          eventStart.getDate()
        );

        switch (timePreset) {
          case "today":
            return eventDate.getTime() === today.getTime();
          case "tomorrow":
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return eventDate.getTime() === tomorrow.getTime();
          case "this-week":
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            return eventDate >= startOfWeek && eventDate < endOfWeek;
          case "next-week":
            const nextWeekStart = new Date(today);
            nextWeekStart.setDate(today.getDate() + (7 - today.getDay()));
            const nextWeekEnd = new Date(nextWeekStart);
            nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
            return eventDate >= nextWeekStart && eventDate < nextWeekEnd;
          case "this-month":
            const startOfMonth = new Date(
              today.getFullYear(),
              today.getMonth(),
              1
            );
            const endOfMonth = new Date(
              today.getFullYear(),
              today.getMonth() + 1,
              1
            );
            return eventDate >= startOfMonth && eventDate < endOfMonth;
          case "custom":
            if (customDateRange) {
              const rangeStart = new Date(customDateRange.startDate);
              const rangeEnd = new Date(customDateRange.endDate);
              rangeEnd.setDate(rangeEnd.getDate() + 1); // Include end date
              return eventDate >= rangeStart && eventDate < rangeEnd;
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Subscribed only
    if (filters.subscribedOnly) {
      const joined = new Set<string>(userProfile?.joinedEvents || []);
      result = result.filter((e) => joined.has(e.id));
    }

    // Participants minimum
    if (filters.participantsMin && filters.participantsMin > 0) {
      result = result.filter(
        (e) => (e.currentParticipants || 0) >= filters.participantsMin
      );
    }

    // New events only (created within 7 days)
    if (filters.newEventsOnly) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      result = result.filter((e) => {
        const created = Date.parse(e.createdAt);
        return !Number.isNaN(created) && now - created <= sevenDays;
      });
    }

    // Cities
    if (filters.cities && filters.cities.length > 0) {
      const citySet = new Set(filters.cities.map((c) => c.toLowerCase()));
      result = result.filter((e) => {
        const addr = e.location?.address || e.name || e.title || "";
        const lower = addr.toLowerCase();
        for (const c of citySet) {
          if (lower.includes(c)) {
            return true;
          }
        }
        return false;
      });
    }

    // Filter by selected location (if not "anywhere")
    if (selectedLocation && selectedLocation !== "anywhere") {
      result = result.filter(
        (e) =>
          e.location?.address?.includes(selectedLocation) ||
          e.name?.includes(selectedLocation) ||
          e.title?.includes(selectedLocation)
      );
    }

    return result;
  }, [
    eventStatus,
    timePreset,
    customDateRange,
    filters,
    userProfile?.joinedEvents,
    selectedLocation,
  ]);

  return (
    <View style={screenStyles.container}>
      {/* Top search pills overlay */}
      <TopSearch
        locationLabel={locationLabel}
        whenLabel={whenLabel}
        onPressLocation={() => setLocationOpen(true)}
        onPressWhen={() => setWhenOpen(true)}
        onPressCreate={() => setCreateEventModalVisible(true)}
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
      <FloatingButton text="📍 Map" onPress={handleFloatingButtonPress} />

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

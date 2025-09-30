import React, { useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Text,
  TouchableOpacity,
} from "react-native";
import { EventList } from "../../components/Events/EventList";
import { FloatingButton } from "../../components/Home/FloatingButton";
import { events } from "../../utils/constants";
import type { TimeStatus } from "../../types";
import { FocusLocation } from "../../types";
import { useRecoilState } from "recoil";
import { uiFiltersState } from "../../state/recoil/atoms";
import { useUserProfile } from "../../state/recoil/hooks";
import {
  FloatingFilters,
  FilterChip,
} from "../../components/Filters/FloatingFilters/FloatingFilters";
import { VehicleTypeModal } from "../../components/Filters/Modal/VehicleTypeModal";
import { PickupMethodModal } from "../../components/Filters/Modal/PickupMethodModal";
import { MoreFiltersModal } from "../../components/Filters/Modal/MoreFiltersModal";
import BottomSheet from "../../components/Filters/Sheet/BottomSheet";
import TopSearch from "../../components/Filters/TopSearch/TopSearch";
// import { styles } from "./EventScreen.styles"; // TODO: Use when implementing styled components

interface EventScreenProps {
  setActiveTab?: (location?: FocusLocation) => void;
}

const EventScreen: React.FC<EventScreenProps> = ({ setActiveTab }) => {
  const [filtersVisible, setFiltersVisible] = useState(true);
  const filtersOpacity = useRef(new Animated.Value(1)).current;
  const [filters, setFilters] = useRecoilState(uiFiltersState);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<null | {
    title: string;
    fee?: string;
  }>(null);
  // Top search pills state
  const [locationOpen, setLocationOpen] = useState(false);
  const [whenOpen, setWhenOpen] = useState(false);
  const [locationLabel, setLocationLabel] = useState("Current location");
  const [whenLabel, setWhenLabel] = useState("When?");
  const { userProfile } = useUserProfile();

  const chips: FilterChip[] = useMemo(() => {
    const vehicleLabel =
      !filters.timeStatus || filters.timeStatus === "any"
        ? "Time"
        : `Time: ${filters.timeStatus}`;
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

    const isVehicleActive =
      !!filters.timeStatus && filters.timeStatus !== "any";
    const isPickupActive = filters.pickupMethod !== "any";
    const isMoreActive = moreCount > 0;

    return [
      {
        id: "vehicle",
        label: vehicleLabel,
        onPress: () => setVehicleOpen(true),
        active: isVehicleActive,
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
  }, [filters]);

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

  // Apply time status filter if any
  const filteredEvents = useMemo(() => {
    // Start with all
    let list = events.slice();

    // Time status filter
    const ts = (filters.timeStatus || "any") as TimeStatus;
    if (ts !== "any") {
      const now = Date.now();
      list = list.filter((e) => {
        const start = Date.parse(e.startDate);
        const end = Date.parse(e.endDate);
        const hasStart = !Number.isNaN(start);
        const hasEnd = !Number.isNaN(end);
        const isExpired = hasEnd ? end < now : false;
        const isOngoing =
          !isExpired &&
          hasStart &&
          (hasEnd ? start <= now && now <= end : start <= now);
        if (ts === "expired") {
          return isExpired;
        }
        if (ts === "ongoing") {
          return isOngoing;
        }
        // upcoming
        return !isExpired && !isOngoing;
      });
    }

    // Subscribed only
    if (filters.subscribedOnly) {
      const joined = new Set<string>(userProfile?.joinedEvents || []);
      list = list.filter((e) => joined.has(e.id));
    }

    // Participants minimum
    if (filters.participantsMin && filters.participantsMin > 0) {
      list = list.filter(
        (e) => (e.currentParticipants || 0) >= filters.participantsMin
      );
    }

    // New events only (created within 7 days)
    if (filters.newEventsOnly) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      list = list.filter((e) => {
        const created = Date.parse(e.createdAt);
        return !Number.isNaN(created) && now - created <= sevenDays;
      });
    }

    // Cities
    if (filters.cities && filters.cities.length > 0) {
      const citySet = new Set(filters.cities.map((c) => c.toLowerCase()));
      list = list.filter((e) => {
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

    return list;
  }, [filters, userProfile]);

  return (
    <View style={screenStyles.container}>
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

      {/* Vehicle type modal */}
      <VehicleTypeModal
        visible={vehicleOpen}
        timeValue={filters.timeStatus}
        onClose={() => setVehicleOpen(false)}
        onSelectTime={(t) => {
          setFilters((prev) => ({ ...prev, timeStatus: t }));
        }}
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

      {/* Location picker sheet */}
      <BottomSheet
        visible={locationOpen}
        title="Location"
        onClose={() => setLocationOpen(false)}
        maxHeightPercent={0.45}
      >
        <View style={sheetStyles.list}>
          <TouchableOpacity
            style={sheetStyles.item}
            onPress={() => {
              setLocationLabel("Current location");
              setLocationOpen(false);
            }}
          >
            <Text style={sheetStyles.itemIcon}>📍</Text>
            <Text style={sheetStyles.itemText}>Current location</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={sheetStyles.item}
            onPress={() => {
              setLocationLabel("Paris, France");
              setLocationOpen(false);
            }}
          >
            <Text style={sheetStyles.itemIcon}>🌆</Text>
            <Text style={sheetStyles.itemText}>Paris, France</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={sheetStyles.item}
            onPress={() => {
              setLocationLabel("Choose on map…");
              setLocationOpen(false);
            }}
          >
            <Text style={sheetStyles.itemIcon}>🗺️</Text>
            <Text style={sheetStyles.itemText}>Choose on map…</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>

      {/* When picker sheet */}
      <BottomSheet
        visible={whenOpen}
        title="When"
        onClose={() => setWhenOpen(false)}
        maxHeightPercent={0.5}
      >
        <View style={sheetStyles.list}>
          <TouchableOpacity
            style={sheetStyles.item}
            onPress={() => {
              setWhenLabel("Today");
              setWhenOpen(false);
            }}
          >
            <Text style={sheetStyles.itemIcon}>📅</Text>
            <Text style={sheetStyles.itemText}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={sheetStyles.item}
            onPress={() => {
              setWhenLabel("Tomorrow");
              setWhenOpen(false);
            }}
          >
            <Text style={sheetStyles.itemIcon}>📅</Text>
            <Text style={sheetStyles.itemText}>Tomorrow</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={sheetStyles.item}
            onPress={() => {
              setWhenLabel("This weekend");
              setWhenOpen(false);
            }}
          >
            <Text style={sheetStyles.itemIcon}>🎉</Text>
            <Text style={sheetStyles.itemText}>This weekend</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={sheetStyles.item}
            onPress={() => {
              setWhenLabel("Next week");
              setWhenOpen(false);
            }}
          >
            <Text style={sheetStyles.itemIcon}>🗓️</Text>
            <Text style={sheetStyles.itemText}>Next week</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
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

const sheetStyles = StyleSheet.create({
  list: { gap: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1C",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  itemIcon: { width: 22, marginRight: 8, color: "#D946EF" },
  itemText: { color: "#EDEDED", fontWeight: "700" },
});

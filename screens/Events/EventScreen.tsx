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
import { FocusLocation } from "../../types";
import { useRecoilState } from "recoil";
import { uiFiltersState } from "../../state/recoil/atoms";
import {
  FloatingFilters,
  FilterChip,
} from "../../components/Filters/FloatingFilters/FloatingFilters";
import { VehicleTypeModal } from "../../components/Filters/Modal/VehicleTypeModal";
import { PickupMethodModal } from "../../components/Filters/Modal/PickupMethodModal";
import { MoreFiltersModal } from "../../components/Filters/Modal/MoreFiltersModal";
import BottomSheet from "../../components/Filters/Sheet/BottomSheet";
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

  const chips: FilterChip[] = useMemo(() => {
    const vehicleLabel =
      filters.vehicleType === "any"
        ? "Vehicle type"
        : `${filters.vehicleType}`.replace("-", " ");
    const pickupLabel =
      filters.pickupMethod === "any"
        ? "Pickup method"
        : filters.pickupMethod === "meet-owner"
        ? "Meet owner"
        : "Connect";
    const moreCount =
      (filters.instantBooking ? 1 : 0) +
      (filters.newCarsOnly ? 1 : 0) +
      (filters.seatsMin > 2 ? 1 : 0) +
      (filters.features?.length || 0);
    const moreLabel =
      moreCount > 0 ? `More filters (${moreCount})` : "More filters";

    const isVehicleActive = filters.vehicleType !== "any";
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

  return (
    <View style={screenStyles.container}>
      {/* Floating Filters overlay */}
      <FloatingFilters
        chips={chips}
        visible={filtersVisible}
        animatedValue={filtersOpacity}
      />

      {/* Vehicle type modal */}
      <VehicleTypeModal
        visible={vehicleOpen}
        value={filters.vehicleType}
        onClose={() => setVehicleOpen(false)}
        onSelect={(v) => {
          setFilters((prev) => ({ ...prev, vehicleType: v }));
          setVehicleOpen(false);
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
        instantBooking={filters.instantBooking}
        seatsMin={filters.seatsMin}
        newCarsOnly={filters.newCarsOnly}
        features={filters.features}
        onClose={() => setMoreOpen(false)}
        onChange={(changes) => setFilters((prev) => ({ ...prev, ...changes }))}
      />

      <EventList
        events={events}
        onEventPress={handleEventPress}
        onScrollDirectionChange={(dir) => setVisible(dir === "up")}
        topInset={64}
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

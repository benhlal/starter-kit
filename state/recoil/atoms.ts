import { atom } from "recoil";
import { UiFilters } from "../../types";
import { Event, EventLocation, Coin } from "../../types";

// User profile state
export const userProfileState = atom({
  key: "userProfileState",
  default: {
    id: "",
    email: "",
    displayName: "",
    photoURL: "",
    createdAt: "",
    updatedAt: "",
    totalCoins: 0,
    level: 1,
    eventsJoined: 0,
    joinedEvents: [],
    achievements: [],
  },
});

// Events state
export const eventsState = atom<Event[]>({
  key: "eventsState",
  default: [],
});

// Event locations state
export const eventLocationsState = atom<EventLocation[]>({
  key: "eventLocationsState",
  default: [],
});

// Coins state
export const coinsState = atom<Coin[]>({
  key: "coinsState",
  default: [],
});

// Selected coin for AR
export const selectedCoinIdState = atom<string | null>({
  key: "selectedCoinIdState",
  default: null,
});

// Loading states
export const loadingState = atom({
  key: "loadingState",
  default: {
    events: false,
    profile: false,
    coins: false,
    eventLocations: false,
  },
});

// Error states
export const errorState = atom<{
  events: Error | null;
  profile: Error | null;
  coins: Error | null;
  eventLocations: Error | null;
}>({
  key: "errorState",
  default: {
    events: null,
    profile: null,
    coins: null,
    eventLocations: null,
  },
});

// App state
export const appState = atom({
  key: "appState",
  default: {
    isOffline: false,
    lastSync: null,
    useMockData: false, // Use real Firebase by default; toggle in dev if needed
  },
});

// Selected event state
export const selectedEventState = atom<Event | null>({
  key: "selectedEventState",
  default: null,
});

// Map focus location state
export const mapFocusLocationState = atom({
  key: "mapFocusLocationState",
  default: null,
});

// Center map on user's current GPS location on next user location update
export const mapCenterOnUserState = atom<boolean>({
  key: "mapCenterOnUserState",
  default: false,
});

// Enable a mode where tapping the map selects a custom location
export const mapSelectLocationModeState = atom<boolean>({
  key: "mapSelectLocationModeState",
  default: false,
});

// Holds a custom, user-chosen location on the map (not necessarily an event)
export const mapCustomLocationState = atom<null | {
  latitude: number;
  longitude: number;
  title?: string;
}>({
  key: "mapCustomLocationState",
  default: null,
});

export const uiFiltersState = atom<UiFilters>({
  key: "uiFiltersState",
  default: {
    pickupAt: undefined,
    returnAt: undefined,
    vehicleType: "any",
    pickupMethod: "any",
    // New time/status filters
    eventStatus: "any",
    timePreset: "anytime",
    customDateRange: undefined,
    // New defaults
    subscribedOnly: false,
    participantsMin: 0,
    newEventsOnly: false,
    cities: [],
  },
});

// Location filter state
export const locationFilterState = atom<{
  selectedLocation: string;
  availableLocations: string[];
}>({
  key: "locationFilterState",
  default: {
    selectedLocation: "anywhere",
    availableLocations: [
      "anywhere",
      "Current Location",
      "Choose on Map",
      "Paris, France",
      "London, UK",
      "New York, USA",
      "Tokyo, Japan",
      "Berlin, Germany",
      "Madrid, Spain",
      "Rome, Italy",
      "Amsterdam, Netherlands",
    ],
  },
});

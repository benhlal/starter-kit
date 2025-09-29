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
    joinedEvents: ["1", "5"],
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
    useMockData: true, // Toggle for using mock data vs real Firebase
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

export const uiFiltersState = atom<UiFilters>({
  key: "uiFiltersState",
  default: {
    pickupAt: undefined,
    returnAt: undefined,
    vehicleType: "any",
    pickupMethod: "any",
    instantBooking: false,
    seatsMin: 2,
    newCarsOnly: false,
    features: [],
  },
});

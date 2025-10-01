import { selector } from "recoil";
import {
  eventsState,
  // userProfileState, // TODO: Use when implementing user-specific filtering
  coinsState,
  loadingState,
  errorState,
} from "./atoms";

// Get events near user location
export const nearbyEventsSelector = selector({
  key: "nearbyEventsSelector",
  get: ({ get }) => {
    const events = get(eventsState);
    // const userProfile = get(userProfileState); // TODO: Use for location-based filtering

    // TODO: Implement geolocation filtering
    // For now, return all events sorted by distance (mock)
    // Create a copy to avoid mutating the original array
    return [...events].sort((_a, _b) => {
      // Mock distance calculation
      return Math.random() - 0.5;
    });
  },
});

// Get user's joined events
export const joinedEventsSelector = selector({
  key: "joinedEventsSelector",
  get: ({ get }) => {
    const events = get(eventsState);
    // const userProfile = get(userProfileState); // TODO: Use for filtering joined events

    // TODO: Implement joined events filtering from user profile
    return events.filter((event) => {
      // Mock: return first 2 events as joined
      return event.id === "1" || event.id === "2";
    });
  },
});

// Get collected coins count
export const collectedCoinsSelector = selector({
  key: "collectedCoinsSelector",
  get: ({ get }) => {
    const coins = get(coinsState);
    return coins.filter((coin) => coin.collected === true).length;
  },
});

// Get user level based on coins
export const userLevelSelector = selector({
  key: "userLevelSelector",
  get: ({ get }) => {
    const collectedCoins = get(collectedCoinsSelector);
    return Math.floor(collectedCoins / 10) + 1; // Level up every 10 coins
  },
});

// Get loading status
export const isLoadingSelector = selector({
  key: "isLoadingSelector",
  get: ({ get }) => {
    const loading = get(loadingState);
    return (
      loading.events ||
      loading.profile ||
      loading.coins ||
      loading.eventLocations
    );
  },
});

// Get any error status
export const hasErrorSelector = selector({
  key: "hasErrorSelector",
  get: ({ get }) => {
    const errors = get(errorState);
    return !!(
      errors.events ||
      errors.profile ||
      errors.coins ||
      errors.eventLocations
    );
  },
});

// Get event statistics
export const eventStatsSelector = selector({
  key: "eventStatsSelector",
  get: ({ get }) => {
    const events = get(eventsState);
    const joinedEvents = get(joinedEventsSelector);

    return {
      totalEvents: events.length,
      joinedEvents: joinedEvents.length,
      availableEvents: events.length - joinedEvents.length,
    };
  },
});

// Get coins by region/area
export const coinsByRegionSelector = selector({
  key: "coinsByRegionSelector",
  get: ({ get }) => {
    const coins = get(coinsState);

    // Group coins by region (mock regions)
    return coins.reduce((acc, coin) => {
      const region = coin.region || "unknown";
      if (!acc[region]) {
        acc[region] = [];
      }
      acc[region].push(coin);
      return acc;
    }, {} as Record<string, typeof coins>);
  },
});

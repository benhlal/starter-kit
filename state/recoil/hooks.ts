import { useRecoilState, useRecoilValue } from "recoil";
import { useCallback } from "react";
import {
  eventsState,
  userProfileState,
  coinsState,
  eventLocationsState,
  loadingState,
  errorState,
  appState,
  selectedEventState,
  mapFocusLocationState,
} from "./atoms";
import {
  nearbyEventsSelector,
  joinedEventsSelector,
  collectedCoinsSelector,
  userLevelSelector,
  isLoadingSelector,
  hasErrorSelector,
  eventStatsSelector,
} from "./selectors";
import { FirebaseService } from "../../services/firebase/FirebaseService";
import { MockService } from "../../mocks/MockService";

// Hook for managing events
export const useEvents = () => {
  const [events, setEvents] = useRecoilState(eventsState);
  const [loading, setLoading] = useRecoilState(loadingState);
  const [error, setError] = useRecoilState(errorState);
  const appConfig = useRecoilValue(appState);
  const nearbyEvents = useRecoilValue(nearbyEventsSelector);
  const joinedEvents = useRecoilValue(joinedEventsSelector);
  const eventStats = useRecoilValue(eventStatsSelector);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, events: true }));
      setError((prev) => ({ ...prev, events: null }));

      const eventsData = appConfig.useMockData
        ? await MockService.getEvents()
        : await FirebaseService.getEvents();

      setEvents(eventsData);
    } catch (err) {
      setError((prev) => ({ ...prev, events: err as Error }));
      console.error("Error fetching events:", err);
    } finally {
      setLoading((prev) => ({ ...prev, events: false }));
    }
  }, [appConfig.useMockData, setEvents, setLoading, setError]);

  const joinEvent = useCallback(
    async (eventId: string, userId: string) => {
      try {
        if (appConfig.useMockData) {
          await MockService.joinEvent(eventId, userId);
        } else {
          // TODO: Implement Firebase join event
          console.log(`Joining event ${eventId} for user ${userId}`);
        }

        // Refresh events after joining
        await fetchEvents();
      } catch (err) {
        console.error("Error joining event:", err);
        throw err;
      }
    },
    [appConfig.useMockData, fetchEvents]
  );

  return {
    events,
    nearbyEvents,
    joinedEvents,
    eventStats,
    loading: loading.events,
    error: error.events,
    fetchEvents,
    joinEvent,
  };
};

// Hook for managing user profile
export const useUserProfile = () => {
  const [userProfile, setUserProfile] = useRecoilState(userProfileState);
  const [loading, setLoading] = useRecoilState(loadingState);
  const [error, setError] = useRecoilState(errorState);
  const appConfig = useRecoilValue(appState);
  const userLevel = useRecoilValue(userLevelSelector);

  const fetchUserProfile = useCallback(
    async (userId: string) => {
      try {
        setLoading((prev) => ({ ...prev, profile: true }));
        setError((prev) => ({ ...prev, profile: null }));

        const profileData = appConfig.useMockData
          ? await MockService.getUserProfile(userId)
          : await FirebaseService.getUserProfile(userId);

        if (profileData) {
          setUserProfile(profileData);
        }
      } catch (err) {
        setError((prev) => ({ ...prev, profile: err as Error }));
        console.error("Error fetching user profile:", err);
      } finally {
        setLoading((prev) => ({ ...prev, profile: false }));
      }
    },
    [appConfig.useMockData, setUserProfile, setLoading, setError]
  );

  const updateUserProfile = useCallback(
    async (userId: string, updates: any) => {
      try {
        const updatedProfile = appConfig.useMockData
          ? await MockService.updateUserProfile(userId, updates)
          : await FirebaseService.updateUserProfile(userId, updates);

        setUserProfile((prev) => ({ ...prev, ...updates }));
        return updatedProfile;
      } catch (err) {
        console.error("Error updating user profile:", err);
        throw err;
      }
    },
    [appConfig.useMockData, setUserProfile]
  );

  return {
    userProfile,
    userLevel,
    loading: loading.profile,
    error: error.profile,
    fetchUserProfile,
    updateUserProfile,
  };
};

// Hook for managing coins
export const useCoins = () => {
  const [coins, setCoins] = useRecoilState(coinsState);
  const [loading, setLoading] = useRecoilState(loadingState);
  const [error, setError] = useRecoilState(errorState);
  const appConfig = useRecoilValue(appState);
  const collectedCoinsCount = useRecoilValue(collectedCoinsSelector);

  const fetchCoins = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, coins: true }));
      setError((prev) => ({ ...prev, coins: null }));

      const coinsData = appConfig.useMockData
        ? await MockService.getCoins()
        : await FirebaseService.getCoins();

      setCoins(coinsData);
    } catch (err) {
      setError((prev) => ({ ...prev, coins: err as Error }));
      console.error("Error fetching coins:", err);
    } finally {
      setLoading((prev) => ({ ...prev, coins: false }));
    }
  }, [appConfig.useMockData, setCoins, setLoading, setError]);

  const collectCoin = useCallback(
    async (coinId: string, userId: string) => {
      try {
        if (appConfig.useMockData) {
          await MockService.collectCoin(coinId, userId);
        } else {
          await FirebaseService.collectCoin(coinId, userId);
        }

        // Update local state
        setCoins((prev) =>
          prev.map((coin) =>
            coin.id === coinId
              ? {
                  ...coin,
                  collected: true,
                  collectedBy: userId,
                  collectedAt: new Date().toISOString(),
                }
              : coin
          )
        );

        return true;
      } catch (err) {
        console.error("Error collecting coin:", err);
        throw err;
      }
    },
    [appConfig.useMockData, setCoins]
  );

  const getCoinsByRegion = useCallback(
    async (region: string) => {
      try {
        const coinsData = appConfig.useMockData
          ? await MockService.getCoinsByRegion(region)
          : await FirebaseService.getCoinsByRegion(region);

        return coinsData;
      } catch (err) {
        console.error("Error fetching coins by region:", err);
        throw err;
      }
    },
    [appConfig.useMockData]
  );

  return {
    coins,
    collectedCoinsCount,
    loading: loading.coins,
    error: error.coins,
    fetchCoins,
    collectCoin,
    getCoinsByRegion,
  };
};

// Hook for managing event locations
export const useEventLocations = () => {
  const [eventLocations, setEventLocations] =
    useRecoilState(eventLocationsState);
  const [loading, setLoading] = useRecoilState(loadingState);
  const [error, setError] = useRecoilState(errorState);
  const appConfig = useRecoilValue(appState);

  const fetchEventLocations = useCallback(async () => {
    try {
      setLoading((prev) => ({ ...prev, eventLocations: true }));
      setError((prev) => ({ ...prev, eventLocations: null }));

      const locationsData = appConfig.useMockData
        ? await MockService.getEventLocations()
        : await FirebaseService.getEventLocations();

      setEventLocations(locationsData);
    } catch (err) {
      setError((prev) => ({ ...prev, eventLocations: err as Error }));
      console.error("Error fetching event locations:", err);
    } finally {
      setLoading((prev) => ({ ...prev, eventLocations: false }));
    }
  }, [appConfig.useMockData, setEventLocations, setLoading, setError]);

  return {
    eventLocations,
    loading: loading.eventLocations,
    error: error.eventLocations,
    fetchEventLocations,
  };
};

// Hook for app-wide state
export const useAppState = () => {
  const [appConfig, setAppConfig] = useRecoilState(appState);
  const isLoading = useRecoilValue(isLoadingSelector);
  const hasError = useRecoilValue(hasErrorSelector);

  const toggleMockMode = useCallback(() => {
    setAppConfig((prev) => ({ ...prev, useMockData: !prev.useMockData }));
  }, [setAppConfig]);

  const setOfflineMode = useCallback(
    (offline: boolean) => {
      setAppConfig((prev) => ({ ...prev, isOffline: offline }));
      MockService.setOfflineMode(offline);
    },
    [setAppConfig]
  );

  return {
    appConfig,
    isLoading,
    hasError,
    toggleMockMode,
    setOfflineMode,
  };
};

// Hook for managing selected event and map focus
export const useMapState = () => {
  const [selectedEvent, setSelectedEvent] = useRecoilState(selectedEventState);
  const [focusLocation, setFocusLocation] = useRecoilState(
    mapFocusLocationState
  );

  return {
    selectedEvent,
    focusLocation,
    setSelectedEvent,
    setFocusLocation,
  };
};

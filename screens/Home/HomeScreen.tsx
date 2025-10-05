import React, { useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import ProfileScreen from "../Profile/ProfileScreen";
import EventScreen from "../Events/EventScreen";
import MapScreen from "../Map/MapScreen";
import ARScreen from "../AR/ARScreen";
import ARHuntScreen from "../AR/ARHuntScreen";
// import ARGPSDemo from "../../components/ARGPSDemo"; // Temporarily disabled
import EventDetailsScreen from "../Events/EventDetailsScreen";
import BottomNav from "../../components/Home/BottomNav/BottomNav";
import { styles } from "./HomeScreen.styles";
import LoginScreen from "../Auth/LoginScreen";
import { useAuthUser } from "../../state/recoil/hooks";
import { CreateEventModal } from "../../components/Events/CreateEventModal";

const HomeScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"Home" | "Account">("Home");
  const [showMap, setShowMap] = useState(false);
  const [shouldRenderMap, setShouldRenderMap] = useState(false);
  const [showAR, setShowAR] = useState(false);
  const [shouldRenderAR, setShouldRenderAR] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [detailsEventId, setDetailsEventId] = useState<string | null>(null);
  const [showARHunt, setShowARHunt] = useState(false);
  const [huntingEventId, setHuntingEventId] = useState<string | null>(null);
  const [showARGPS, setShowARGPS] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [focusLocation, setFocusLocation] = useState<
    { latitude: number; longitude: number; title: string } | undefined
  >();
  const { currentUser } = useAuthUser();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "Home" | "Account");
    // Hide map when switching tabs
    if (showMap) {
      setShowMap(false);
      setShouldRenderMap(false);
    }
    // Hide AR when switching tabs
    if (shouldRenderAR || showAR) {
      setShowAR(false);
      setShouldRenderAR(false);
    }
  };

  const handleBack = () => {
    if (showMap) {
      // If map is showing, go back to events list
      setShowMap(false);
      setShouldRenderMap(false);
      setFocusLocation(undefined);
    }
    // If no map is showing, the back button shouldn't appear
  };

  const handleMapToggle = (location?: {
    latitude: number;
    longitude: number;
    title: string;
  }) => {
    if (!showMap) {
      // Set focus location if provided
      if (location) {
        setFocusLocation(location);
      }
      // Pre-render map off-screen first, then show instantly
      setShouldRenderMap(true);
      setTimeout(() => {
        setShowMap(true);
      }, 100); // Small delay to let map render off-screen
    } else {
      // Hide map instantly, then unmount
      setShowMap(false);
      setTimeout(() => {
        setShouldRenderMap(false);
        setFocusLocation(undefined); // Clear focus location
      }, 50);
    }
  };

  const closeEventDetails = () => {
    setShowEventDetails(false);
    setDetailsEventId(null);
  };

  const startHuntForEvent = (eventId: string) => {
    setHuntingEventId(eventId); // Store the event ID for AR hunting
    setShowEventDetails(false);
    setTimeout(() => {
      setShowARHunt(true);
    }, 50);
  };

  const handleARToggle = () => {
    if (!showAR) {
      setShouldRenderAR(true);
      setTimeout(() => setShowAR(true), 100);
    } else {
      setShowAR(false);
      setTimeout(() => setShouldRenderAR(false), 50);
    }
  };

  const renderCurrentScreen = () => {
    if (!currentUser) {
      return <LoginScreen />;
    }
    switch (activeTab) {
      case "Account":
        return <ProfileScreen />;
      case "Home":
      default:
        return (
          <View style={styles.content}>
            <EventScreen
              setActiveTab={handleMapToggle}
              onBack={showMap ? handleBack : undefined}
              onOpenDetails={(id) => {
                setDetailsEventId(id);
                setShowEventDetails(true);
              }}
            />
            {showEventDetails && detailsEventId && (
              <View style={[styles.mapOverlay, styles.mapOverlayVisible]}>
                <EventDetailsScreen
                  eventId={detailsEventId}
                  onClose={closeEventDetails}
                  onStartHunt={startHuntForEvent}
                />
              </View>
            )}
            {/* Pre-render off-screen, then show instantly without animation */}
            {shouldRenderMap && (
              <View
                style={[
                  styles.mapOverlay,
                  showMap ? styles.mapOverlayVisible : styles.mapOverlayHidden,
                ]}
              >
                <MapScreen
                  setActiveTab={handleMapToggle}
                  focusLocation={focusLocation}
                  createOpen={createOpen}
                  setCreateOpen={setCreateOpen}
                />
              </View>
            )}
            {/* AR overlay */}
            {shouldRenderAR && (
              <View
                style={[
                  styles.mapOverlay,
                  showAR ? styles.mapOverlayVisible : styles.mapOverlayHidden,
                ]}
              >
                {/* Placeholder AR screen. Implement AR logic inside this component later. */}
                <ARScreen onClose={handleARToggle} />
              </View>
            )}
            {showARHunt && huntingEventId && (
              <View style={[styles.mapOverlay, styles.mapOverlayVisible]}>
                <ARHuntScreen
                  eventId={huntingEventId}
                  onClose={() => {
                    setShowARHunt(false);
                    setHuntingEventId(null); // Clear hunting event when closing
                  }}
                />
              </View>
            )}

            {showARGPS && (
              <View style={[styles.mapOverlay, styles.mapOverlayVisible]}>
                {/* <ARGPSDemo /> */}
                <Text style={styles.disabledText}>
                  AR GPS Demo temporarily disabled
                </Text>
                <View style={styles.closeButtonContainer}>
                  <TouchableOpacity
                    onPress={() => setShowARGPS(false)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>{renderCurrentScreen()}</View>
      {currentUser && (
        <>
          {/** Only admins see the center create button */}
          <BottomNav
            active={activeTab}
            setActiveTab={handleTabChange}
            onCollect={() => {}} // Disabled for now
          />
          <CreateEventModal
            isVisible={createOpen}
            onClose={() => setCreateOpen(false)}
            onEventCreated={(eventId) => {
              console.log("Event created with ID:", eventId);
              setCreateOpen(false);
              // TODO: Refresh events list or navigate to new event
            }}
          />
        </>
      )}
    </View>
  );
};

export default HomeScreen;

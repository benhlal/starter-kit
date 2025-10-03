import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  Vibration,
  TextInput,
  Alert,
} from "react-native";
import Geolocation from "@react-native-community/geolocation";
import { FirebaseService } from "../../services/firebase/FirebaseService";
import {
  useSelectedCoin,
  useMapState,
  useCoins,
} from "../../state/recoil/hooks";
import {
  ViroARSceneNavigator,
  ViroARScene,
  ViroAmbientLight,
  ViroNode,
  ViroMaterials,
  ViroAnimations,
  ViroBox,
  ViroText,
} from "@reactvision/react-viro";

// Simple 2D Kalman filter for lat/lon smoothing with measurement noise derived from accuracy
class Kalman2D {
  private lat: number;
  private lon: number;
  private pLat: number;
  private pLon: number;
  private lastT: number;
  // Process noise (meters^2 per second) — tune for walking pace
  private qMeters2PerSec = 0.8; // lower -> more smoothing

  constructor(lat: number, lon: number, t: number) {
    this.lat = lat;
    this.lon = lon;
    // Initial covariance large to trust first updates gradually
    this.pLat = 1;
    this.pLon = 1;
    this.lastT = t;
  }

  private metersPerDegLat(): number {
    return 111320;
  }
  private metersPerDegLon(latDeg: number): number {
    return this.metersPerDegLat() * Math.cos((latDeg * Math.PI) / 180);
  }

  update(t: number, measLat: number, measLon: number, accuracyMeters?: number) {
    const dt = Math.max(0.001, (t - this.lastT) / 1000);
    this.lastT = t;
    const mPerDegLat = this.metersPerDegLat();
    const mPerDegLon = this.metersPerDegLon(this.lat || measLat);

    // Process noise in degrees^2 scaled by dt
    const qLat = (this.qMeters2PerSec * dt) / (mPerDegLat * mPerDegLat);
    const qLon = (this.qMeters2PerSec * dt) / (mPerDegLon * mPerDegLon);

    // Predict (constant position model)
    this.pLat += qLat;
    this.pLon += qLon;

    // Measurement noise from accuracy (68% radius). Use a floor to avoid over-trust
    const acc = Math.max(5, Math.min(accuracyMeters ?? 30, 60));
    const rLat = (acc * acc) / (mPerDegLat * mPerDegLat);
    const rLon = (acc * acc) / (mPerDegLon * mPerDegLon);

    // Kalman gain
    const kLat = this.pLat / (this.pLat + rLat);
    const kLon = this.pLon / (this.pLon + rLon);

    // Update state
    this.lat = this.lat + kLat * (measLat - this.lat);
    this.lon = this.lon + kLon * (measLon - this.lon);

    // Update covariance
    this.pLat = (1 - kLat) * this.pLat;
    this.pLon = (1 - kLon) * this.pLon;

    return { latitude: this.lat, longitude: this.lon };
  }
}
interface ARScreenProps {
  onClose?: () => void;
  // If provided, scope AR to a specific event and enable Hunt mode
  eventId?: string;
}

// Materials and animations for the coin
ViroMaterials.createMaterials({
  coinGold: {
    lightingModel: "Blinn",
    diffuseColor: "#FFD166",
    shininess: 2.0,
  },
  coinCommon: {
    lightingModel: "Blinn",
    diffuseColor: "#FFD166", // gold-ish
    shininess: 2.0,
  },
  coinUncommon: {
    lightingModel: "Blinn",
    diffuseColor: "#4CAF50", // green
    shininess: 2.0,
  },
  coinRare: {
    lightingModel: "Blinn",
    diffuseColor: "#2196F3", // blue
    shininess: 2.0,
  },
  coinEpic: {
    lightingModel: "Blinn",
    diffuseColor: "#9C27B0", // purple
    shininess: 2.0,
  },
  coinLegendary: {
    lightingModel: "Blinn",
    diffuseColor: "#FFC107", // amber
    shininess: 2.0,
  },
  coinCollected: {
    lightingModel: "Blinn",
    diffuseColor: "#00C853",
    shininess: 2.0,
  },
  coinText: {
    lightingModel: "Blinn",
    diffuseColor: "#FFFFFF",
    shininess: 2.0,
  },
});

ViroAnimations.registerAnimations({
  rotateY: { properties: { rotateY: "+=90" }, duration: 250, easing: "Linear" },
});

// AR Scene - spawns coins at their exact GPS locations, stays fixed once placed
function ARCoinScene(props: any) {
  const sceneRef = React.useRef<any>(null);
  const [collectedIds, setCollectedIds] = useState<Record<string, boolean>>({});
  // Fixed placements for coins: coinId -> { pos, distance, material, name }
  const [placedCoins, setPlacedCoins] = useState<
    Record<
      string,
      {
        pos: [number, number, number];
        distance: number;
        material: string;
        name: string;
      }
    >
  >({});

  // Place coins at their exact GPS positions when coinData is provided
  useEffect(() => {
    const coinData = props?.sceneNavigator?.viroAppProps?.coinData || [];
    if (!coinData || coinData.length === 0) {
      return;
    }

    setPlacedCoins((prev) => {
      const next = { ...prev };
      for (const coin of coinData) {
        if (next[coin.id]) {
          continue; // already placed; don't move it
        }

        // Place coin at its exact AR position (calculated from GPS difference)
        const distance = Math.sqrt(
          coin.pos[0] * coin.pos[0] + coin.pos[2] * coin.pos[2]
        );
        next[coin.id] = {
          pos: coin.pos,
          distance: distance,
          material: coin.material || "coinCommon",
          name: coin.name || coin.id,
        };
      }
      return next;
    });
  }, [props?.sceneNavigator?.viroAppProps?.coinData]);

  // Check for collection by proximity
  useEffect(() => {
    let id: any;
    const tick = async () => {
      try {
        if (!sceneRef.current) {
          return;
        }
        const { position } = await sceneRef.current.getCameraOrientationAsync();

        Object.entries(placedCoins).forEach(([coinId, coinInfo]) => {
          if (collectedIds[coinId]) {
            return;
          }

          const pos = coinInfo.pos;
          const dx = position[0] - pos[0];
          const dy = position[1] - pos[1];
          const dz = position[2] - pos[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // Log distance for debugging (only occasionally to avoid spam)
          if (Math.random() < 0.01) {
            console.log(
              `[AR] Distance to coin ${coinId}:`,
              dist.toFixed(2),
              "meters"
            );
          }

          // Much closer selection distance - need to almost touch the coin
          if (dist < 0.3) {
            console.log(`[AR] Collecting coin ${coinId} at distance:`, dist);
            setCollectedIds((prev) => ({ ...prev, [coinId]: true }));
            props?.sceneNavigator?.viroAppProps?.onCollected?.(coinId);
          }
        });
      } catch (e) {
        // ignore polling errors
      }
    };
    id = setInterval(tick, 300);
    return () => clearInterval(id);
  }, [collectedIds, placedCoins, props]);

  console.log("[ARScene] Rendering with:", {
    coinPositions:
      props?.sceneNavigator?.viroAppProps?.coinPositions?.length || 0,
    coinData: props?.sceneNavigator?.viroAppProps?.coinData?.length || 0,
    placedCoins: Object.keys(placedCoins).length,
    coinPositionsData: props?.sceneNavigator?.viroAppProps?.coinPositions,
    coinDataArray: props?.sceneNavigator?.viroAppProps?.coinData,
    placedCoinsData: placedCoins,
  });

  return (
    <ViroARScene
      ref={sceneRef}
      onAnchorFound={() => console.log("Anchor found")}
      onAnchorRemoved={() => console.log("Anchor removed")}
    >
      <ViroAmbientLight color="#FFFFFF" intensity={400} />
      {/* Render coins provided with explicit positions (legacy flow) */}
      {(props?.sceneNavigator?.viroAppProps?.coinPositions || []).map(
        (it: any, idx: number) => (
          <ViroNode
            key={it.id || String(idx)}
            position={it.pos ?? [0, 0, -1]}
            rotation={[0, 0, 0]}
            transformBehaviors={["billboardY"]}
          >
            {/* Use simple box instead of heart object */}
            <ViroBox
              width={0.3}
              height={0.8}
              length={0.3}
              materials={[
                collectedIds[it.id || String(idx)]
                  ? "coinCollected"
                  : "coinGold",
              ]}
              opacity={collectedIds[it.id || String(idx)] ? 0.4 : 1.0}
              animation={{
                name: "rotateY",
                run: !collectedIds[it.id || String(idx)],
                loop: true,
              }}
              onClick={() => {
                const coinKey = it.id || String(idx);
                if (!collectedIds[coinKey]) {
                  setCollectedIds((prev) => ({ ...prev, [coinKey]: true }));
                  props?.sceneNavigator?.viroAppProps?.onCollected?.(coinKey);
                }
              }}
            />
          </ViroNode>
        )
      )}
      {/* Render proximity-spawned coins at fixed positions (don’t update after placement) */}
      {Object.entries(placedCoins).map(([id, coinInfo]) => {
        // Size based on distance - coins stay at exact GPS locations, size adapts
        // Scale formula: closer coins are bigger, distant coins are smaller but still visible
        const baseScale = Math.max(
          0.2,
          Math.min(1.5, 3 / (coinInfo.distance + 0.5))
        );
        const height = 0.8 * baseScale;
        const width = 0.3 * baseScale;

        return (
          <ViroNode
            key={`coin_${id}`}
            position={coinInfo.pos}
            transformBehaviors={["billboardY"]}
          >
            <ViroBox
              width={width}
              height={height}
              length={width}
              materials={[
                collectedIds[id] ? "coinCollected" : coinInfo.material,
              ]}
              opacity={collectedIds[id] ? 0.4 : 1.0}
              onClick={() => {
                if (!collectedIds[id]) {
                  setCollectedIds((prev) => ({ ...prev, [id]: true }));
                  props?.sceneNavigator?.viroAppProps?.onCollected?.(id);
                }
              }}
            />
            <ViroText
              text={coinInfo.name}
              scale={[0.5, 0.5, 0.5]}
              position={[0, height / 2 + 0.2, 0]}
              width={2}
              height={0.5}
              extrusionDepth={0}
              materials={["coinText"]}
            />
          </ViroNode>
        );
      })}
    </ViroARScene>
  );
}

const ARScreen: React.FC<ARScreenProps> = ({ onClose, eventId }) => {
  const { selectedCoinId } = useSelectedCoin();
  const { selectedEvent } = useMapState();
  const { clearCoins, collectCoin } = useCoins();
  const effectiveEventId = eventId ?? selectedEvent?.id;

  // Debug logging
  console.log("[AR] ARScreen initialized with:", {
    eventId,
    selectedEventId: selectedEvent?.id,
    effectiveEventId,
    selectedCoinId,
  });

  const [hasPermission, setHasPermission] = useState(Platform.OS === "ios");
  const [requesting, setRequesting] = useState(false);
  const [collectedBanner, setCollectedBanner] = useState(false);
  const [spawnLocation, setSpawnLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [sessionSpawns, setSessionSpawns] = useState<
    Array<{ id: string; latitude: number; longitude: number }>
  >([]);
  const [_locRequesting, setLocRequesting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);
  const [refBias] = useState<{ dLat: number; dLon: number } | null>(null);
  // Fixed origin for AR mapping: captured once per AR session so objects don't follow live GPS
  const [mapReference, setMapReference] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [eventCoins, setEventCoins] = useState<
    Array<import("../../types").Coin>
  >([]);
  const kalmanRef = React.useRef<Kalman2D | null>(null);
  const [showEventCoins] = useState(true);
  const [showPlaceDialog, setShowPlaceDialog] = useState(false);
  const [placeDistance, setPlaceDistance] = useState("2");
  const [sessionActive, setSessionActive] = useState(false);
  const [_showCoinCount, _setShowCoinCount] = useState(false);
  const [totalCoinCount, setTotalCoinCount] = useState(0);
  // Use real GPS location instead of mock location
  const useMockLocation = false; // Use real GPS location for actual placement
  // Limit too-far objects to a reasonable AR range to reduce perceived drift
  const MAX_AR_DISTANCE = 4; // meters (clamp spawn distance)
  // Removed lastCoinPosition; Save now pins spawn to your current GPS fix.

  const requestCameraPermission = useCallback(async () => {
    if (Platform.OS !== "android") {
      return;
    }
    try {
      setRequesting(true);
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: "Camera Permission",
          message: "We need camera access to enable AR coin collection.",
          buttonPositive: "Allow",
          buttonNegative: "Deny",
          buttonNeutral: "Ask Me Later",
        }
      );
      setHasPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
    } catch (e) {
      setHasPermission(false);
    } finally {
      setRequesting(false);
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === "android") {
      requestCameraPermission();
    }
  }, [requestCameraPermission]);

  // Load and live-sync coins for selected event (or override via props.eventId)
  useEffect(() => {
    let unsub: any;
    (async () => {
      try {
        setEventCoins([]);
        if (!effectiveEventId) {
          console.log("[AR] No effectiveEventId, cannot load coins");
          return;
        }
        console.log(`[AR] Loading coins for event: ${effectiveEventId}`);
        unsub = FirebaseService.subscribeToEventCoins(
          effectiveEventId,
          (coins) => {
            console.log(
              `[AR] Received ${
                coins?.length || 0
              } coins from Firebase for event ${effectiveEventId}`
            );
            // Only keep collectible, uncollected coins for AR
            const filtered = (coins || []).filter(
              (c) =>
                c.collectible &&
                !c.collected &&
                c.location?.latitude &&
                c.location?.longitude
            );
            console.log(`[AR] Filtered to ${filtered.length} valid coins`);
            setEventCoins(filtered);
          }
        );
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      try {
        unsub && unsub();
      } catch {}
      setEventCoins([]);
    };
  }, [effectiveEventId]);

  // Auto-start session when hunting (eventId provided)
  useEffect(() => {
    if (eventId && currentLocation && !sessionActive) {
      // Automatically capture AR world reference when starting hunt mode
      const autoStartSession = async () => {
        try {
          setMapReference({
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          });
          setSessionActive(true);
          console.log("[AR] Auto-started hunting session");
        } catch (error) {
          console.error("[AR] Failed to auto-start session:", error);
        }
      };
      autoStartSession();
    }
  }, [eventId, currentLocation, sessionActive]);

  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS !== "android") {
      return true;
    }
    try {
      setLocRequesting(true);
      console.log("[AR] Requesting location permission...");

      // Check if we already have permission
      const alreadyHasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (alreadyHasPermission) {
        console.log("[AR] Location permission already granted");
        return true;
      }

      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission Required",
          message:
            "This app needs location access to place AR coins at GPS coordinates. Without this permission, AR features will use a default location.",
          buttonPositive: "Allow",
          buttonNegative: "Deny",
          buttonNeutral: "Ask Me Later",
        }
      );

      const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
      console.log("[AR] Location permission result:", granted, "->", isGranted);
      return isGranted;
    } catch (error) {
      console.error("[AR] Error requesting location permission:", error);
      return false;
    } finally {
      setLocRequesting(false);
    }
  }, []);

  const ensureSpawnLocation = useCallback(async () => {
    try {
      // If a coin is selected, use its GPS as spawn for this AR session
      if (selectedCoinId) {
        const coin = await FirebaseService.getCoinById(selectedCoinId);
        if (coin?.location?.latitude && coin?.location?.longitude) {
          setSpawnLocation({
            latitude: coin.location.latitude,
            longitude: coin.location.longitude,
          });
          console.log(
            "[AR] Using selected coin spawn",
            coin.location.latitude,
            coin.location.longitude
          );
          return;
        }
      }

      const user = FirebaseService.getCurrentUser?.();
      const userId = user?.uid;
      if (userId) {
        // Try load latest saved AR spawn object first
        try {
          const spawnObj = await FirebaseService.getLatestUserARObject(
            userId,
            "spawn"
          );
          if (spawnObj?.location?.latitude && spawnObj?.location?.longitude) {
            setSpawnLocation({
              latitude: spawnObj.location.latitude,
              longitude: spawnObj.location.longitude,
            });
            console.log(
              "[AR] Using saved AR spawn object",
              spawnObj.location.latitude,
              spawnObj.location.longitude
            );
            return;
          }
        } catch (e) {
          // fallback to profile field below
        }
        // Try load saved location
        const profile: any = await FirebaseService.getUserProfile(userId);
        const saved = profile?.ar?.coinSpawnLocation;
        if (saved?.latitude && saved?.longitude) {
          setSpawnLocation({
            latitude: saved.latitude,
            longitude: saved.longitude,
          });
          return;
        }
      }

      // Request permission and get current location
      const ok = await requestLocationPermission();
      if (!ok) {
        return;
      }
      await new Promise<void>((resolve) => {
        Geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setSpawnLocation({ latitude, longitude });
            console.log("[AR] Coin spawn initialized at", latitude, longitude);
            if (userId) {
              // Upsert as AR spawn object and keep profile field for backward compatibility
              try {
                FirebaseService.upsertUserSpawnARObject({
                  userId,
                  latitude,
                  longitude,
                  metadata: { source: "auto-init" },
                }).catch(() => {});
              } catch {}
              try {
                FirebaseService.updateUserProfile(userId, {
                  ar: {
                    coinSpawnLocation: {
                      latitude,
                      longitude,
                      createdAt: new Date().toISOString(),
                    },
                  },
                });
              } catch {}
            }
            resolve();
          },
          (_err) => resolve(),
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 }
        );
      });
    } catch (_) {
      // ignore
    }
  }, [requestLocationPermission, selectedCoinId]);

  useEffect(() => {
    // Initialize coin spawn location (first time saves to profile)
    ensureSpawnLocation();
  }, [ensureSpawnLocation]);

  // Initialize GPS location tracking on component mount
  useEffect(() => {
    const initializeGPS = async () => {
      try {
        const hasLocationPermission = await requestLocationPermission();
        if (!hasLocationPermission) {
          console.log(
            "[AR] Location permission denied, using default location"
          );
          // Set a default location so AR can still work
          setCurrentLocation({
            latitude: 48.8566, // Paris default
            longitude: 2.3522,
            accuracy: 100,
          });
          return;
        }

        // Get initial location with very relaxed settings first
        const tryGetLocation = (options: any, label: string) => {
          return new Promise<void>((resolve) => {
            Geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude, accuracy } =
                  position.coords as any;
                setCurrentLocation({ latitude, longitude, accuracy });
                console.log(
                  `[AR] ${label} GPS location acquired:`,
                  latitude,
                  longitude
                );
                resolve();
              },
              (error) => {
                console.error(`[AR] ${label} failed:`, {
                  code: error.code,
                  message: error.message,
                  PERMISSION_DENIED: error.PERMISSION_DENIED,
                  POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
                  TIMEOUT: error.TIMEOUT,
                });
                resolve(); // Always resolve to try next fallback
              },
              options
            );
          });
        };

        // Try multiple fallback strategies
        console.log("[AR] Attempting high accuracy GPS...");
        await tryGetLocation(
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 10000,
          },
          "High accuracy"
        );

        // If that didn't work, try medium accuracy
        if (!currentLocation) {
          console.log("[AR] Attempting medium accuracy GPS...");
          await tryGetLocation(
            {
              enableHighAccuracy: false,
              timeout: 8000,
              maximumAge: 30000,
            },
            "Medium accuracy"
          );
        }

        // If still no location, try very relaxed settings
        if (!currentLocation) {
          console.log("[AR] Attempting low accuracy GPS...");
          await tryGetLocation(
            {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 120000,
            },
            "Low accuracy"
          );
        }

        // Final fallback to default location if GPS completely fails
        if (!currentLocation) {
          console.log(
            "[AR] All GPS attempts failed, using default Paris location"
          );
          setCurrentLocation({
            latitude: 48.8566, // Paris default
            longitude: 2.3522,
            accuracy: 1000, // Mark as very inaccurate
          });
        }
      } catch (error) {
        console.error("[AR] GPS initialization exception:", error);
        // Emergency fallback
        setCurrentLocation({
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 1000,
        });
      }
    };

    initializeGPS();
  }, [requestLocationPermission]);

  // DISABLED: Loading persisted AR objects to avoid showing unwanted default coins
  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const user = FirebaseService.getCurrentUser?.();
  //       const userId = user?.uid;
  //       if (!userId) {
  //         return;
  //       }
  //       const arObjects = await FirebaseService.getUserARObjects(userId, {
  //         activeOnly: true,
  //         limit: 10,
  //       });
  //       const coins = arObjects.filter(
  //         (o: any) => o.type === "coin" && o.location
  //       );
  //       if (coins.length) {
  //         setSessionSpawns((prev) => {
  //           const seen = new Set(prev.map((p) => p.id));
  //           const next = [...prev];
  //           for (const c of coins) {
  //             const targetId = c.coinId || c.id;
  //             if (!targetId) {
  //               continue;
  //             }
  //             if (!seen.has(targetId)) {
  //               next.push({
  //                 id: targetId,
  //                 latitude: c.location.latitude,
  //                 longitude: c.location.longitude,
  //               });
  //               seen.add(targetId);
  //             }
  //           }
  //           return next;
  //         });
  //       }
  //     } catch (_) {}
  //   })();
  // }, []);

  // When switching events, clear session spawns to avoid confusion/duplicates
  useEffect(() => {
    setSessionSpawns([]);
  }, [effectiveEventId]);

  const getPreciseLocation = useCallback(() => {
    return new Promise<{
      latitude: number;
      longitude: number;
      accuracy?: number;
    }>((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: (pos.coords as any).accuracy,
          });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }, []);

  // Sample multiple GPS fixes and compute a stable weighted-average position with outlier rejection
  const getStableLocation = useCallback(
    async (samples: number = 7, maxMs: number = 4000) => {
      const fixes: Array<{
        latitude: number;
        longitude: number;
        accuracy: number;
      }> = [];
      const deadline = Date.now() + maxMs;
      while (fixes.length < samples && Date.now() < deadline) {
        try {
          const fix = await getPreciseLocation();
          const acc = Math.max(
            5,
            Math.min(60, Math.round((fix.accuracy as number) ?? 30))
          );
          fixes.push({
            latitude: fix.latitude,
            longitude: fix.longitude,
            accuracy: acc,
          });
        } catch {}
      }
      if (fixes.length === 0) {
        const f = await getPreciseLocation();
        return {
          latitude: f.latitude,
          longitude: f.longitude,
          accuracy: f.accuracy,
        };
      }
      const toRad = (d: number) => (d * Math.PI) / 180;
      const R = 6371000;
      const distM = (a: any, b: any) => {
        const dLat = toRad(b.latitude - a.latitude);
        const dLon = toRad(b.longitude - a.longitude);
        const la1 = toRad(a.latitude);
        const la2 = toRad(b.latitude);
        const k =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(k), Math.sqrt(1 - k));
      };
      const medLat = fixes.map((f) => f.latitude).sort((a, b) => a - b)[
        Math.floor(fixes.length / 2)
      ];
      const medLon = fixes.map((f) => f.longitude).sort((a, b) => a - b)[
        Math.floor(fixes.length / 2)
      ];
      const median = { latitude: medLat, longitude: medLon };
      const dists = fixes.map((f) => distM(f, median));
      const sorted = [...dists].sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
      const q3 =
        sorted[Math.floor(sorted.length * 0.75)] ?? sorted[sorted.length - 1];
      const iqr = Math.max(1, q3 - q1);
      const thresh = q3 + 1.5 * iqr;
      const filtered = fixes.filter((_, i) => dists[i] <= thresh);
      const list = filtered.length >= 3 ? filtered : fixes;
      let sumW = 0;
      let sumLat = 0;
      let sumLon = 0;
      for (const f of list) {
        const w = 1 / (f.accuracy * f.accuracy);
        sumW += w;
        sumLat += f.latitude * w;
        sumLon += f.longitude * w;
      }
      const lat = sumLat / sumW;
      const lon = sumLon / sumW;
      const avgAcc = list.reduce((a, b) => a + b.accuracy, 0) / list.length;
      return { latitude: lat, longitude: lon, accuracy: avgAcc };
    },
    [getPreciseLocation]
  );

  // Track current location continuously with Kalman smoothing and basic jitter rejection
  useEffect(() => {
    if (useMockLocation) {
      // Use mock location immediately instead of GPS
      const mockLocation = {
        latitude: 48.834667,
        longitude: 2.492917,
        accuracy: 5,
      };
      setCurrentLocation(mockLocation);
      return;
    }

    let lastFix: { latitude: number; longitude: number; t: number } | null =
      null;
    const ACC_MAX = 30; // meters, ignore worse
    const BIG_JUMP = 15; // meters within short time -> likely jitter
    const SHORT_MS = 5000;

    const distMeters = (
      a: { latitude: number; longitude: number },
      b: { latitude: number; longitude: number }
    ) => {
      const R = 6371000;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(b.latitude - a.latitude);
      const dLon = toRad(b.longitude - a.longitude);
      const la1 = toRad(a.latitude);
      const la2 = toRad(b.latitude);
      const k =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(k), Math.sqrt(1 - k));
    };

    const watchId = Geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const accuracy = (pos.coords as any).accuracy as number | undefined;
        const now = Date.now();

        // Filter by accuracy
        if (typeof accuracy === "number" && accuracy > ACC_MAX) {
          return; // too inaccurate, ignore
        }
        const candidate = { latitude, longitude };
        if (lastFix) {
          const jump = distMeters(lastFix, candidate);
          const dt = now - lastFix.t;
          if (jump > BIG_JUMP && dt < SHORT_MS && (accuracy ?? ACC_MAX) > 15) {
            // Likely a jittery spike, ignore
            return;
          }
        }
        if (!kalmanRef.current) {
          kalmanRef.current = new Kalman2D(latitude, longitude, now);
        }
        const filtered = kalmanRef.current.update(
          now,
          latitude,
          longitude,
          accuracy
        );
        // Deadband: if movement < ~5m from last filtered point in short time, keep steady
        if (lastFix) {
          const jumpF = distMeters(lastFix, filtered);
          if (jumpF < 5) {
            // ignore tiny movement; keep last filtered
            setCurrentLocation({
              latitude: lastFix.latitude,
              longitude: lastFix.longitude,
              accuracy,
            });
            return;
          }
        }
        setCurrentLocation({
          latitude: filtered.latitude,
          longitude: filtered.longitude,
          accuracy,
        });
        lastFix = {
          latitude: filtered.latitude,
          longitude: filtered.longitude,
          t: now,
        };
      },
      () => {},
      {
        enableHighAccuracy: true,
        distanceFilter: 1,
        interval: 2000,
        fastestInterval: 1000,
      }
    );
    return () => Geolocation.clearWatch(watchId);
  }, [useMockLocation]);

  // Periodically refine filter with a stable multi-sample fix
  useEffect(() => {
    if (useMockLocation) {
      return; // Skip GPS refinement in mock mode
    }

    let id: any;
    const tick = async () => {
      try {
        const stable = await getStableLocation(5, 3000);
        if (!stable) {
          return;
        }
        const now = Date.now();
        if (!kalmanRef.current) {
          kalmanRef.current = new Kalman2D(
            stable.latitude,
            stable.longitude,
            now
          );
        }
        const filtered = kalmanRef.current.update(
          now,
          stable.latitude,
          stable.longitude,
          stable.accuracy
        );
        setCurrentLocation({
          latitude: filtered.latitude,
          longitude: filtered.longitude,
          accuracy: stable.accuracy,
        });
      } catch {}
    };
    id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, [getStableLocation, useMockLocation]);

  // Capture a fixed AR mapping reference using a stable multi-sample GPS fix
  useEffect(() => {
    (async () => {
      try {
        if (!mapReference && currentLocation) {
          const stable = await getStableLocation(7, 4000);
          setMapReference({
            latitude: stable.latitude,
            longitude: stable.longitude,
          });
        }
      } catch {}
    })();
  }, [mapReference, currentLocation, getStableLocation]);

  const distanceMeters = useMemo(() => {
    if (!spawnLocation || !currentLocation) {
      return null;
    }
    const R = 6371000; // meters
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(currentLocation.latitude - spawnLocation.latitude);
    const dLon = toRad(currentLocation.longitude - spawnLocation.longitude);
    const lat1 = toRad(spawnLocation.latitude);
    const lat2 = toRad(currentLocation.latitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }, [spawnLocation, currentLocation]);

  // Compute coin AR positions from GPS (ENU approx) for profile/selected coin
  const primaryCoinPosition = useMemo<[number, number, number]>(() => {
    // Default 1m forward
    let pos: [number, number, number] = [0, 0, -1];
    const reference = mapReference
      ? {
          latitude: mapReference.latitude + (refBias?.dLat ?? 0),
          longitude: mapReference.longitude + (refBias?.dLon ?? 0),
        }
      : null;
    if (spawnLocation && reference) {
      const metersPerDegLat = 111320;
      const metersPerDegLon =
        metersPerDegLat * Math.cos((reference.latitude * Math.PI) / 180);
      const dLat = spawnLocation.latitude - reference.latitude; // north
      const dLon = spawnLocation.longitude - reference.longitude; // east
      const east = dLon * metersPerDegLon;
      const north = dLat * metersPerDegLat;
      pos = [east, 0, -north];
      // Clamp to a nearby distance if too far (project along bearing)
      const len = Math.hypot(pos[0], pos[2]);
      if (len > MAX_AR_DISTANCE) {
        const scale = MAX_AR_DISTANCE / len;
        pos = [pos[0] * scale, 0, pos[2] * scale];
      }
      // No clamping: keep exact placement relative to anchor
    }
    return pos;
  }, [spawnLocation, mapReference, refBias]);

  // Compute AR positions for session-created spawns (multiple)
  const sessionCoinPositions = useMemo(() => {
    const reference = mapReference
      ? {
          latitude: mapReference.latitude + (refBias?.dLat ?? 0),
          longitude: mapReference.longitude + (refBias?.dLon ?? 0),
        }
      : null;
    if (!reference) {
      return [] as Array<{ id: string; pos: [number, number, number] }>;
    }
    const metersPerDegLat = 111320;
    const metersPerDegLon =
      metersPerDegLat * Math.cos((reference.latitude * Math.PI) / 180);
    return sessionSpawns.map((s) => {
      const dLat = s.latitude - reference.latitude; // north
      const dLon = s.longitude - reference.longitude; // east
      const east = dLon * metersPerDegLon;
      const north = dLat * metersPerDegLat;
      let pos: [number, number, number] = [east, 0, -north];
      const len = Math.hypot(pos[0], pos[2]);
      if (len > MAX_AR_DISTANCE) {
        const scale = MAX_AR_DISTANCE / len;
        pos = [pos[0] * scale, 0, pos[2] * scale];
      }
      return { id: s.id, pos };
    });
  }, [sessionSpawns, mapReference, refBias]);

  // Map rarity -> material name
  const rarityToMaterial = useCallback((rarity?: string) => {
    const r = (rarity || "common").toLowerCase();
    if (r === "uncommon") {
      return "coinUncommon";
    }
    if (r === "rare") {
      return "coinRare";
    }
    if (r === "epic") {
      return "coinEpic";
    }
    if (r === "legendary" || r === "mythic") {
      return "coinLegendary";
    }
    return "coinCommon";
  }, []);

  // Get coin count for current event
  const getCoinCount = useCallback(async () => {
    if (!effectiveEventId) {
      Alert.alert("Error", "No event selected");
      return;
    }

    try {
      // Get all coins for this event
      const allCoins = await FirebaseService.getCoinsForEvent(effectiveEventId);
      const count = allCoins?.length || 0;
      setTotalCoinCount(count);
      _setShowCoinCount(true);

      Alert.alert(
        "Coin Count",
        `Total coins in this event: ${count}\n\nCollectible: ${
          allCoins?.filter((c) => c.collectible && !c.collected).length || 0
        }\nCollected: ${allCoins?.filter((c) => c.collected).length || 0}`,
        [{ text: "OK", onPress: () => _setShowCoinCount(false) }]
      );
    } catch (error) {
      console.error("Error getting coin count:", error);
      Alert.alert("Error", "Failed to get coin count");
    }
  }, [effectiveEventId]);

  // Remove all coins from current event
  const removeAllCoins = useCallback(async () => {
    if (!effectiveEventId) {
      Alert.alert("Error", "No event selected");
      return;
    }

    Alert.alert(
      "Remove All Coins",
      "Are you sure you want to remove ALL coins from this event? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove All",
          style: "destructive",
          onPress: async () => {
            try {
              // Get all coins for this event
              const allCoins = await FirebaseService.getCoinsForEvent(
                effectiveEventId
              );

              if (!allCoins || allCoins.length === 0) {
                Alert.alert("Info", "No coins found to remove");
                return;
              }

              // Delete each coin
              const deletePromises = allCoins.map((coin) =>
                FirebaseService.deleteCoin(coin.id)
              );

              await Promise.all(deletePromises);

              // Clear local state
              setEventCoins([]);
              setSessionSpawns([]);

              // Clear Recoil state
              clearCoins();

              Alert.alert(
                "Success",
                `Removed ${allCoins.length} coins from the event`
              );
            } catch (error) {
              console.error("Error removing coins:", error);
              Alert.alert("Error", "Failed to remove coins");
            }
          },
        },
      ]
    );
  }, [effectiveEventId, clearCoins]);

  // Place object at custom distance
  const placeObjectAtDistance = useCallback(async () => {
    if (!currentLocation) {
      Alert.alert(
        "GPS Required",
        "Please wait for GPS location to be acquired before placing objects"
      );
      return;
    }

    const distance = parseFloat(placeDistance);
    if (isNaN(distance) || distance <= 0 || distance > 100) {
      Alert.alert(
        "Error",
        "Please enter a valid distance between 1-100 meters"
      );
      return;
    }

    try {
      const user = FirebaseService.getCurrentUser?.();
      const userId = user?.uid;
      if (!userId) {
        Alert.alert("Error", "Please log in to place objects");
        return;
      }

      // Calculate GPS position at specified distance (North direction)
      const metersPerDegLat = 111320;
      const offsetLat = distance / metersPerDegLat;
      const newLat = currentLocation.latitude + offsetLat;
      const newLon = currentLocation.longitude;

      // Add to session spawns
      const objectId = `custom_${Date.now()}`;
      setSessionSpawns((prev) => [
        ...prev,
        {
          id: objectId,
          latitude: newLat,
          longitude: newLon,
        },
      ]);

      // Save to Firebase
      await FirebaseService.createARObject({
        userId,
        type: "coin",
        model: "coin",
        coinId: objectId,
        location: {
          latitude: newLat,
          longitude: newLon,
        },
        active: true,
        metadata: {
          source: "manual-placement",
          distance: distance,
          direction: "north",
        },
      } as any);

      setShowPlaceDialog(false);
      Alert.alert(
        "Success",
        `Object placed ${distance}m north of your position`
      );
    } catch (error) {
      console.error("Error placing object:", error);
      Alert.alert("Error", "Failed to place object");
    }
  }, [currentLocation, placeDistance]);

  const createRandomCoins = useCallback(async () => {
    if (!currentLocation || !effectiveEventId) {
      Alert.alert(
        "Requirements Missing",
        "GPS location and active event required to create test coins"
      );
      return;
    }

    console.log("[AR] Creating test coins:", {
      currentLocation,
      effectiveEventId,
      existingEventCoins: eventCoins.length,
    });

    try {
      const user = FirebaseService.getCurrentUser?.();
      const userId = user?.uid;
      if (!userId) {
        Alert.alert("Error", "Please log in to create coins");
        return;
      }

      const metersPerDegLat = 111320;
      const metersPerDegLon =
        111320 * Math.cos((currentLocation.latitude * Math.PI) / 180);

      // Create 6 coins at random positions 1-6 meters from current location
      const coinPromises = [];
      for (let i = 0; i < 6; i++) {
        const distance = Math.random() * 5 + 1; // 1-6 meters
        const angle = Math.random() * 2 * Math.PI; // Random direction

        const offsetLat = (distance * Math.cos(angle)) / metersPerDegLat;
        const offsetLon = (distance * Math.sin(angle)) / metersPerDegLon;

        const coinLat = currentLocation.latitude + offsetLat;
        const coinLon = currentLocation.longitude + offsetLon;

        const coinData = {
          eventId: effectiveEventId,
          location: {
            latitude: coinLat,
            longitude: coinLon,
          },
          collectible: true,
          collected: false,
          value: Math.floor(Math.random() * 100) + 10, // 10-109 points
          material: ["coinCommon", "coinRare", "coinEpic"][
            Math.floor(Math.random() * 3)
          ],
          name: `Test Coin ${i + 1}`,
          metadata: {
            source: "random-generation",
            distance: distance.toFixed(1),
            angle: ((angle * 180) / Math.PI).toFixed(1),
          },
        };

        console.log(`[AR] Creating test coin ${i + 1}:`, coinData);
        coinPromises.push(FirebaseService.createCoin(coinData));
      }

      console.log(`[AR] Creating ${coinPromises.length} test coins`);
      await Promise.all(coinPromises);

      console.log("[AR] Test coins created successfully");
      Alert.alert(
        "Success",
        "Created 6 random test coins around your location for this event"
      );
    } catch (error) {
      console.error("Error creating random coins:", error);
      Alert.alert("Error", "Failed to create random coins");
    }
  }, [currentLocation, effectiveEventId]);

  // Compute AR positions for event coins - DIRECT GPS TO AR CONVERSION
  const eventCoinPositions = useMemo(() => {
    if (!currentLocation || !eventCoins?.length) {
      return [] as Array<{
        id: string;
        pos: [number, number, number];
        material?: string;
        name?: string;
      }>;
    }

    // Use current GPS as AR world origin (0,0,0)
    const metersPerDegLat = 111320;
    const metersPerDegLon =
      metersPerDegLat * Math.cos((currentLocation.latitude * Math.PI) / 180);

    const computed = eventCoins
      .filter(
        (c) =>
          c.location?.latitude &&
          c.location?.longitude &&
          c.collectible &&
          !c.collected
      )
      .map((c) => {
        // Calculate offset from current location to coin location in meters
        const dLat = c.location.latitude - currentLocation.latitude;
        const dLon = c.location.longitude - currentLocation.longitude;

        // Convert to meters using proper world coordinates
        const deltaX = dLon * metersPerDegLon; // East-West (positive = East)
        const deltaZ = dLat * metersPerDegLat; // North-South (positive = North)

        console.log(
          `Coin ${c.name}: GPS(${c.location.latitude.toFixed(
            6
          )}, ${c.location.longitude.toFixed(6)}) -> Offset(${deltaX.toFixed(
            2
          )}m E, ${deltaZ.toFixed(2)}m N)`
        );

        // Use exact GPS coordinates - no distance clamping
        // Coins stay at their real-world positions, size adapts to distance
        const finalX = deltaX;
        const finalZ = deltaZ;

        // AR coordinates: X=East, Z=North, Y=height (keep at ground level)
        const pos: [number, number, number] = [finalX, 0, finalZ];
        console.log(
          `[AR_DEBUG] Final AR position for ${c.name}: [${finalX.toFixed(
            2
          )}, 0, ${finalZ.toFixed(2)}]`
        );
        return {
          id: c.id,
          pos,
          material: rarityToMaterial(c.rarity as any),
          name: c.name || c.id,
        };
      });

    console.log(
      `[AR_DEBUG] Total computed positions: ${computed.length} coins`
    );
    return computed;
  }, [currentLocation, eventCoins, rarityToMaterial]);

  // Removed proximity gating; we always compute directed placement and clamp to MAX_AR_DISTANCE.

  const content = useMemo(() => {
    if (!hasPermission) {
      return (
        <View style={styles.permissionWrap}>
          <Text style={styles.permissionTitle}>Camera permission required</Text>
          <Text style={styles.permissionDesc}>
            Please allow camera access to use AR and collect coins.
          </Text>
          <TouchableOpacity
            style={[styles.btn, requesting && styles.btnDisabled]}
            onPress={requestCameraPermission}
            disabled={requesting}
          >
            <Text style={styles.btnText}>
              {requesting ? "Requesting…" : "Grant Permission"}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    // Wait until we have GPS location to place coins at their map positions
    if (!currentLocation) {
      return (
        <View style={styles.permissionWrap}>
          <Text style={styles.permissionTitle}>Getting your location…</Text>
          <Text style={styles.permissionDesc}>
            Need GPS to place coins at their map positions. If this takes too
            long, we'll use a default location.
          </Text>
        </View>
      );
    }

    // If not in Hunt mode and far from saved spawn, guide the user; in Hunt mode we always render
    const nearSaved = distanceMeters == null || distanceMeters <= 60;
    if (!eventId && !nearSaved) {
      return (
        <View style={styles.permissionWrap}>
          <Text style={styles.permissionTitle}>Go to saved coin location</Text>
          <Text style={styles.permissionDesc}>
            You're about {distanceMeters}m away from the saved spawn. Move
            closer to see the coin.
          </Text>
        </View>
      );
    }

    console.log("[AR] Passing to AR Scene:", {
      eventCoinPositions: eventCoinPositions.length,
      eventCoins: eventCoins.length,
      sessionCoinPositions: sessionCoinPositions.length,
      eventCoinPositionsData: eventCoinPositions.map((c) => ({
        id: c.id,
        name: c.name,
        material: c.material,
      })),
    });

    return (
      <ViroARSceneNavigator
        autofocus={true}
        worldAlignment={"GravityAndHeading"}
        // Cast needed because Viro accepts props on scene via runtime
        initialScene={{ scene: ARCoinScene as any }}
        viroAppProps={{
          // Only show coins from the current event - no default/mock/session coins
          coinData: eventCoinPositions,
          coinPositions: [], // Don't use this - it duplicates coins without labels
          oldCoinPositions: (() => {
            // In Hunt mode (eventId provided), render both event coins and session coins
            if (eventId) {
              const allCoins = new Map<
                string,
                { id: string; pos: [number, number, number]; material?: string }
              >();

              // Add event coins if enabled
              if (showEventCoins) {
                for (const coin of eventCoinPositions) {
                  allCoins.set(coin.id, coin);
                }
              }

              // Add manually placed coins (sessionSpawns)
              for (const coin of sessionCoinPositions) {
                if (!allCoins.has(coin.id)) {
                  allCoins.set(coin.id, coin);
                }
              }

              return Array.from(allCoins.values());
            }
            // In general AR: if event coins are available, prefer showing only them
            if (eventCoinPositions.length > 0) {
              const list = [...eventCoinPositions];
              if (list.length <= 1 || !currentLocation) {
                return list;
              }
              let bestIdx = 0;
              let best = Infinity;
              for (let i = 0; i < list.length; i++) {
                const pos = list[i].pos;
                const meters = Math.sqrt(pos[0] * pos[0] + pos[2] * pos[2]);
                if (meters < best) {
                  best = meters;
                  bestIdx = i;
                }
              }
              return [list[bestIdx]];
            }
            const map = new Map<
              string,
              { id: string; pos: [number, number, number]; material?: string }
            >();
            // Event coins first (so session duplicates of same id don’t add twice)
            for (const it of eventCoinPositions) {
              map.set(it.id, it);
            }
            for (const it of sessionCoinPositions) {
              if (!map.has(it.id)) {
                map.set(it.id, it);
              }
            }
            // Keep primary as separate fixed id (only in non-event mode)
            if (currentLocation && primaryCoinPosition) {
              map.set("primary", { id: "primary", pos: primaryCoinPosition });
            }
            return Array.from(map.values());
          })(), // Old complex logic - now disabled
          onCollected: async (coinId?: string) => {
            setCollectedBanner(true);
            setTimeout(() => setCollectedBanner(false), 1500);
            // Haptic feedback as an immediate cue
            try {
              Vibration.vibrate(50);
            } catch {}
            // If collected corresponds to an event coin, mark it collected in Firestore and Recoil
            try {
              if (coinId && eventCoins.some((c) => c.id === coinId)) {
                const user = FirebaseService.getCurrentUser?.();
                const userId = user?.uid;
                if (userId) {
                  await collectCoin(coinId, userId);
                  setEventCoins((prev) =>
                    prev.map((c) =>
                      c.id === coinId ? { ...c, collected: true } : c
                    )
                  );
                }
              }
            } catch {}
          },
        }}
        style={styles.flex}
      />
    );
  }, [
    hasPermission,
    requesting,
    requestCameraPermission,
    distanceMeters,
    eventCoinPositions,
    eventCoins,
    currentLocation,
    eventId,
    collectCoin,
    primaryCoinPosition,
    sessionCoinPositions,
    showEventCoins,
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AR Collect</Text>
        {onClose && (
          <TouchableOpacity accessibilityRole="button" onPress={onClose}>
            <Text style={styles.close}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.body}>
        {content}

        {collectedBanner && (
          <View style={styles.collectedBanner}>
            <Text style={styles.collectedText}>Coin collected!</Text>
          </View>
        )}

        {/* GPS Warning Overlay */}
        {currentLocation &&
          currentLocation.accuracy &&
          currentLocation.accuracy > 500 && (
            <View style={styles.gpsWarning}>
              <Text style={styles.gpsWarningTitle}>
                ⚠️ Using Default Location
              </Text>
              <Text style={styles.gpsWarningText}>
                GPS failed to get your real location. AR coins will be placed
                around Paris, France as a fallback.
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setCurrentLocation(null);
                  // This will trigger GPS initialization again
                }}
              >
                <Text style={styles.retryButtonText}>🔄 Retry GPS</Text>
              </TouchableOpacity>
            </View>
          )}

        {/* Place Object Button */}
        <TouchableOpacity
          style={styles.placeButton}
          onPress={() => setShowPlaceDialog(true)}
          accessibilityLabel="Place object at custom distance"
        >
          <Text style={styles.placeButtonText}>📍 Place Object</Text>
        </TouchableOpacity>

        {/* Create Random Coins Button - only show if we have an event */}
        {effectiveEventId && (
          <TouchableOpacity
            style={[styles.placeButton, styles.createCoinsButton]}
            onPress={createRandomCoins}
            accessibilityLabel="Create 6 random test coins for this event"
          >
            <Text style={styles.placeButtonText}>🪙 Create Test Coins</Text>
          </TouchableOpacity>
        )}

        {/* Coin Count Button - only show if we have an event */}
        {effectiveEventId && (
          <TouchableOpacity
            style={[styles.placeButton, styles.coinCountButton]}
            onPress={getCoinCount}
            accessibilityLabel="Show coin count for this event"
          >
            <Text style={styles.placeButtonText}>📊 Coin Count</Text>
          </TouchableOpacity>
        )}

        {/* Remove Coins Button - only show if we have an event */}
        {effectiveEventId && (
          <TouchableOpacity
            style={[styles.placeButton, styles.removeCoinsButton]}
            onPress={removeAllCoins}
            accessibilityLabel="Remove all coins from this event"
          >
            <Text style={styles.placeButtonText}>🗑️ Remove Coins</Text>
          </TouchableOpacity>
        )}

        {/* Session Status Indicator */}
        <View style={styles.sessionIndicator}>
          <Text style={styles.sessionText}>
            📍 GPS:{" "}
            {currentLocation
              ? currentLocation.accuracy && currentLocation.accuracy > 500
                ? "🟡 Default Location"
                : "🟢 Active"
              : "🔴 Searching..."}
          </Text>
          {eventId && (
            <Text style={styles.sessionText}>
              🎯 Hunt: {sessionActive ? "🟢 Active" : "🔴 Starting..."}
            </Text>
          )}
          {currentLocation && currentLocation.accuracy && (
            <Text style={styles.sessionText}>
              📡 Accuracy: ±{Math.round(currentLocation.accuracy)}m
            </Text>
          )}
        </View>

        {/* Refresh Button Overlay */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={() => {
            // Reset current location to trigger GPS re-initialization
            setCurrentLocation(null);
            // Reset session active state
            setSessionActive(false);
            // Reset map reference to get fresh GPS fix
            setMapReference(null);
            // Clear any existing event coins to force reload
            setEventCoins([]);
            console.log(
              "[AR] Manual refresh triggered - reloading GPS and coins"
            );
          }}
          accessibilityLabel="Refresh GPS location and reload coins"
        >
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>

        {/* Place Object Dialog */}
        {showPlaceDialog && (
          <View style={styles.dialogOverlay}>
            <View style={styles.dialog}>
              <Text style={styles.dialogTitle}>Place Object</Text>
              <Text style={styles.dialogLabel}>Distance (meters):</Text>
              <TextInput
                style={styles.dialogInput}
                value={placeDistance}
                onChangeText={setPlaceDistance}
                keyboardType="numeric"
                placeholder="2"
                placeholderTextColor="#999"
              />
              <View style={styles.dialogButtons}>
                <TouchableOpacity
                  style={[styles.dialogButton, styles.cancelButton]}
                  onPress={() => setShowPlaceDialog(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dialogButton, styles.confirmButton]}
                  onPress={placeObjectAtDistance}
                >
                  <Text style={styles.confirmButtonText}>Place</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#000" },
  header: {
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: "#fff", fontSize: 18, fontWeight: "600" },
  close: { color: "#4da3ff", fontSize: 16, fontWeight: "600" },
  body: { flex: 1 },
  collectedBanner: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  collectedText: { color: "#fff", fontWeight: "700" },

  permissionWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  permissionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  permissionDesc: {
    color: "#ccc",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  btn: {
    backgroundColor: "#7B3FE4",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700" },

  // Place Object Button
  placeButton: {
    position: "absolute",
    left: 16,
    bottom: 24,
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  placeButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  createCoinsButton: {
    left: 16,
    bottom: 80, // Position above Place Object button
    backgroundColor: "#F59E0B", // Orange color to distinguish from Place Object
  },
  coinCountButton: {
    left: 16,
    bottom: 136, // Position above Create Test Coins button
    backgroundColor: "#3B82F6", // Blue color for info
  },
  removeCoinsButton: {
    left: 16,
    bottom: 192, // Position above Coin Count button
    backgroundColor: "#EF4444", // Red color for destructive action
  },

  // Session Indicator
  sessionIndicator: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  sessionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  // Dialog styles
  dialogOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    backgroundColor: "#fff",
    margin: 20,
    padding: 20,
    borderRadius: 12,
    width: 280,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  dialogLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: "#333",
  },
  dialogInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 20,
  },
  dialogButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  cancelButtonText: {
    textAlign: "center",
    color: "#6b7280",
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#10B981",
  },
  confirmButtonText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
  },

  // GPS Warning styles
  gpsWarning: {
    position: "absolute",
    top: 100,
    left: 16,
    right: 16,
    backgroundColor: "rgba(255, 152, 0, 0.95)",
    padding: 16,
    borderRadius: 12,
    zIndex: 1000,
  },
  gpsWarningTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  gpsWarningText: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  retryButtonText: {
    color: "#FF9800",
    fontWeight: "600",
  },

  // Refresh Button Overlay
  refreshButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.8)",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  refreshButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
});

export default ARScreen;

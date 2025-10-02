/* eslint-disable prettier/prettier */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, PermissionsAndroid, Platform, Vibration, ScrollView, Alert } from "react-native";
import Geolocation from "@react-native-community/geolocation";
import { FirebaseService } from "../../services/firebase/FirebaseService";
import { useSelectedCoin, useMapState } from "../../state/recoil/hooks";
import {
  ViroARSceneNavigator,
  ViroARScene,
  ViroAmbientLight,
  ViroNode,
  ViroMaterials,
  ViroAnimations,
  Viro3DObject,
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
  // When true, show a developer debug overlay with GPS and per-coin deltas
  debugOverlay?: boolean;
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
  const [placedCoins, setPlacedCoins] = useState<Record<string, { pos: [number, number, number]; distance: number; material: string; name: string }>>({});

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
        const distance = Math.sqrt(coin.pos[0] * coin.pos[0] + coin.pos[2] * coin.pos[2]);
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
          
          if (dist < 1.5) {
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
    coinPositions: props?.sceneNavigator?.viroAppProps?.coinPositions?.length || 0,
    coinData: props?.sceneNavigator?.viroAppProps?.coinData?.length || 0,
    placedCoins: Object.keys(placedCoins).length
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
            {/* 3D object for better visibility. Single model used. */}
            <Viro3DObject
              source={require("../../assets/heart/12190_Heart_v1_L3.obj")}
              resources={[
                require("../../assets/heart/12190_Heart_v1_L3.mtl"),
              ]}
              type="OBJ"
              position={[0, 0.15, 0]}
              scale={[0.05, 0.05, 0.05]}
              rotation={[0, 0, 0]}
              animation={{
                name: "rotateY",
                run: !collectedIds[it.id || String(idx)],
                loop: true,
              }}
              opacity={collectedIds[it.id || String(idx)] ? 0.35 : 1}
              lightReceivingBitMask={3}
              shadowCastingBitMask={2}
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
        const baseScale = Math.max(0.2, Math.min(1.5, 3 / (coinInfo.distance + 0.5)));
        const height = 0.8 * baseScale;
        const width = 0.3 * baseScale;
        
        // Log current spawn coordinates for debugging
        console.log(`[AR_SPAWN] Coin ${id} (${coinInfo.name}) spawning at coordinates:`, {
          x: coinInfo.pos[0],
          y: coinInfo.pos[1],
          z: coinInfo.pos[2],
          distance: coinInfo.distance.toFixed(2) + "m",
        });
        
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
              materials={[collectedIds[id] ? "coinCollected" : coinInfo.material]}
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
      
      {/* Debug: Show test objects at different positions to verify coordinate system */}
      {Object.keys(placedCoins).length === 0 && (props?.sceneNavigator?.viroAppProps?.coinPositions || []).length === 0 && (
        <>
          {(() => {
            console.log("[AR_SPAWN] Test object 1 spawning at coordinates: x=0, y=0, z=2 (2m North)");
            return null;
          })()}
          {/* Test object 1: 2m North */}
          <ViroNode position={[0, 0, 2]} transformBehaviors={["billboardY"]}>
            <ViroBox width={0.2} height={0.2} length={0.2} materials={["coinCommon"]} />
            <ViroText text="2m N" scale={[0.3, 0.3, 0.3]} position={[0, 0.3, 0]} width={1} height={0.3} extrusionDepth={0} materials={["coinText"]} />
          </ViroNode>
          
          {(() => {
            console.log("[AR_SPAWN] Test object 2 spawning at coordinates: x=2, y=0, z=0 (2m East)");
            return null;
          })()}
          {/* Test object 2: 2m East */}
          <ViroNode position={[2, 0, 0]} transformBehaviors={["billboardY"]}>
            <ViroBox width={0.2} height={0.2} length={0.2} materials={["coinUncommon"]} />
            <ViroText text="2m E" scale={[0.3, 0.3, 0.3]} position={[0, 0.3, 0]} width={1} height={0.3} extrusionDepth={0} materials={["coinText"]} />
          </ViroNode>
          
          {(() => {
            console.log("[AR_SPAWN] Test object 3 spawning at coordinates: x=-1, y=0, z=-1 (1m SW)");
            return null;
          })()}
          {/* Test object 3: 1m South-West */}
          <ViroNode position={[-1, 0, -1]} transformBehaviors={["billboardY"]}>
            <ViroBox width={0.2} height={0.2} length={0.2} materials={["coinRare"]} />
            <ViroText text="1m SW" scale={[0.3, 0.3, 0.3]} position={[0, 0.3, 0]} width={1} height={0.3} extrusionDepth={0} materials={["coinText"]} />
          </ViroNode>
        </>
      )}
    </ViroARScene>
  );
}

const ARScreen: React.FC<ARScreenProps> = ({ onClose, eventId, debugOverlay }) => {
  const { selectedCoinId } = useSelectedCoin();
  const { selectedEvent } = useMapState();
  const effectiveEventId = eventId ?? selectedEvent?.id;
  const [hasPermission, setHasPermission] = useState(Platform.OS === "ios");
  const [requesting, setRequesting] = useState(false);
  const [collectedBanner, setCollectedBanner] = useState(false);
  const [spawnLocation, setSpawnLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [sessionSpawns, setSessionSpawns] = useState<
    Array<{ id: string; latitude: number; longitude: number }>
  >([]);
  const [_locRequesting, setLocRequesting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [refBias, setRefBias] = useState<{ dLat: number; dLon: number } | null>(null);
  // Fixed origin for AR mapping: captured once per AR session so objects don't follow live GPS
  const [mapReference, setMapReference] = useState<{ latitude: number; longitude: number } | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [eventCoins, setEventCoins] = useState<Array<import("../../types").Coin>>([]);
  const kalmanRef = React.useRef<Kalman2D | null>(null);
  const [showEventCoins, setShowEventCoins] = useState(true);
  // Mock mode: use fixed position instead of GPS to test without fluctuation
  const useMockLocation = true; // Always use mock location for testing
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
          return;
        }
        unsub = FirebaseService.subscribeToEventCoins(
          effectiveEventId,
          (coins) => {
            console.log(`[AR] Received ${coins?.length || 0} coins from Firebase`);
            // Only keep collectible, uncollected coins for AR
            const filtered = (coins || []).filter(
              (c) => c.collectible && !c.collected && c.location?.latitude && c.location?.longitude
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
      try { unsub && unsub(); } catch {}
      setEventCoins([]);
    };
  }, [effectiveEventId]);

  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS !== "android") {
      return true;
    }
    try {
      setLocRequesting(true);
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "We need your location to remember where your AR coin spawns.",
          buttonPositive: "Allow",
          buttonNegative: "Deny",
          buttonNeutral: "Ask Me Later",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (_) {
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
          setSpawnLocation({ latitude: saved.latitude, longitude: saved.longitude });
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

  // Load user's persisted coin AR objects into session on open
  useEffect(() => {
    (async () => {
      try {
        const user = FirebaseService.getCurrentUser?.();
        const userId = user?.uid;
        if (!userId) {
          return;
        }
        const arObjects = await FirebaseService.getUserARObjects(userId, {
          activeOnly: true,
          limit: 10,
        });
        const coins = arObjects.filter((o: any) => o.type === "coin" && o.location);
        if (coins.length) {
          setSessionSpawns((prev) => {
            const seen = new Set(prev.map((p) => p.id));
            const next = [...prev];
            for (const c of coins) {
              const targetId = c.coinId || c.id;
              if (!targetId) {
                continue;
              }
              if (!seen.has(targetId)) {
                next.push({
                  id: targetId,
                  latitude: c.location.latitude,
                  longitude: c.location.longitude,
                });
                seen.add(targetId);
              }
            }
            return next;
          });
        }
      } catch (_) {}
    })();
  }, []);

  // When switching events, clear session spawns to avoid confusion/duplicates
  useEffect(() => {
    setSessionSpawns([]);
  }, [effectiveEventId]);

  const showInfo = useCallback((text: string) => {
    setInfoBanner(text);
    setTimeout(() => setInfoBanner(null), 1500);
  }, []);

  const getPreciseLocation = useCallback(() => {
    return new Promise<{ latitude: number; longitude: number; accuracy?: number }>((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (pos) => {
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: (pos.coords as any).accuracy });
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }, []);

  // Sample multiple GPS fixes and compute a stable weighted-average position with outlier rejection
  const getStableLocation = useCallback(async (samples: number = 7, maxMs: number = 4000) => {
    const fixes: Array<{ latitude: number; longitude: number; accuracy: number }> = [];
    const deadline = Date.now() + maxMs;
    while (fixes.length < samples && Date.now() < deadline) {
      try {
        const fix = await getPreciseLocation();
        const acc = Math.max(5, Math.min(60, Math.round(((fix.accuracy as number) ?? 30))));
        fixes.push({ latitude: fix.latitude, longitude: fix.longitude, accuracy: acc });
      } catch {}
    }
    if (fixes.length === 0) {
      const f = await getPreciseLocation();
      return { latitude: f.latitude, longitude: f.longitude, accuracy: f.accuracy };
    }
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371000;
    const distM = (a: any, b: any) => {
      const dLat = toRad(b.latitude - a.latitude);
      const dLon = toRad(b.longitude - a.longitude);
      const la1 = toRad(a.latitude);
      const la2 = toRad(b.latitude);
      const k = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(k), Math.sqrt(1 - k));
    };
    const medLat = fixes.map((f) => f.latitude).sort((a, b) => a - b)[Math.floor(fixes.length / 2)];
    const medLon = fixes.map((f) => f.longitude).sort((a, b) => a - b)[Math.floor(fixes.length / 2)];
    const median = { latitude: medLat, longitude: medLon };
    const dists = fixes.map((f) => distM(f, median));
    const sorted = [...dists].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)] ?? 0;
    const q3 = sorted[Math.floor(sorted.length * 0.75)] ?? sorted[sorted.length - 1];
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
  }, [getPreciseLocation]);

  const refreshGPSNow = useCallback(async () => {
    const ok = await requestLocationPermission();
    if (!ok) {
      showInfo("Location permission denied");
      return;
    }
    await new Promise<void>((resolve) => {
      Geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords as any;
          setCurrentLocation({ latitude, longitude, accuracy });
          showInfo(`GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}${accuracy ? ` (±${Math.round(accuracy)}m)` : ""}`);
          resolve();
        },
        () => {
          showInfo("Failed to get location");
          resolve();
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
      );
    });
  }, [requestLocationPermission, showInfo]);

  // Calibrate a reference bias between current filtered location and a stable sampled fix
  const calibrateReference = useCallback(async () => {
    try {
      const ok = await requestLocationPermission();
      if (!ok) {
        showInfo("Location permission denied");
        return;
      }
      const stable = await getStableLocation();
      if (!currentLocation) {
        setCurrentLocation({ latitude: stable.latitude, longitude: stable.longitude, accuracy: stable.accuracy });
        setRefBias({ dLat: 0, dLon: 0 });
        showInfo("Calibrated (init)");
        return;
      }
      const dLat = stable.latitude - currentLocation.latitude;
      const dLon = stable.longitude - currentLocation.longitude;
      setRefBias({ dLat, dLon });
      showInfo("Calibration set");
    } catch (_) {
      showInfo("Calibration failed");
    }
  }, [requestLocationPermission, getStableLocation, currentLocation, showInfo]);

  // Re-anchor AR world near the user's current location by capturing a new stable reference
  const reanchor = useCallback(async () => {
    try {
      const ok = await requestLocationPermission();
      if (!ok) {
        showInfo("Location permission denied");
        return;
      }
      const stable = await getStableLocation(5, 3000);
      setMapReference({ latitude: stable.latitude, longitude: stable.longitude });
      setRefBias(null);
      showInfo("Re-anchored near you");
    } catch (_) {
      showInfo("Re-anchor failed");
    }
  }, [requestLocationPermission, getStableLocation, showInfo]);

  const setSpawnFromCurrent = useCallback(async () => {
    try {
      if (busy) {
        return;
      }
      setBusy(true);
      const ok = await requestLocationPermission();
      if (!ok) {
        showInfo("Location permission denied");
        return;
      }
      const fix = await getStableLocation();
      setCurrentLocation({ latitude: fix.latitude, longitude: fix.longitude, accuracy: fix.accuracy });
      const user = FirebaseService.getCurrentUser?.();
      const userId = user?.uid;
      setSpawnLocation({ latitude: fix.latitude, longitude: fix.longitude });
      if (userId) {
        try {
          await FirebaseService.upsertUserSpawnARObject({
            userId,
            latitude: fix.latitude,
            longitude: fix.longitude,
            metadata: { source: "manual-set" },
          });
        } catch {}
        try {
          await FirebaseService.updateUserProfile(userId, {
            ar: {
              coinSpawnLocation: {
                latitude: fix.latitude,
                longitude: fix.longitude,
                updatedAt: new Date().toISOString(),
              },
            },
          });
        } catch {}
      }
      showInfo("Spawn updated");
    } catch (_) {
      showInfo("Failed to update spawn");
    } finally {
      setBusy(false);
    }
  }, [busy, requestLocationPermission, getStableLocation, showInfo]);

  // Track current location continuously with Kalman smoothing and basic jitter rejection
  useEffect(() => {
    if (useMockLocation) {
      // Use mock location immediately instead of GPS
      const mockLocation = { latitude: 48.834667, longitude: 2.492917, accuracy: 5 };
      setCurrentLocation(mockLocation);
      return;
    }
    
    let lastFix: { latitude: number; longitude: number; t: number } | null = null;
    const ACC_MAX = 30; // meters, ignore worse
    const BIG_JUMP = 15; // meters within short time -> likely jitter
    const SHORT_MS = 5000;

    const distMeters = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) => {
      const R = 6371000;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dLat = toRad(b.latitude - a.latitude);
      const dLon = toRad(b.longitude - a.longitude);
      const la1 = toRad(a.latitude);
      const la2 = toRad(b.latitude);
      const k = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
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
        const filtered = kalmanRef.current.update(now, latitude, longitude, accuracy);
        // Deadband: if movement < ~5m from last filtered point in short time, keep steady
        if (lastFix) {
          const jumpF = distMeters(lastFix, filtered);
          if (jumpF < 5) {
            // ignore tiny movement; keep last filtered
            setCurrentLocation({ latitude: lastFix.latitude, longitude: lastFix.longitude, accuracy });
            return;
          }
        }
        setCurrentLocation({ latitude: filtered.latitude, longitude: filtered.longitude, accuracy });
        lastFix = { latitude: filtered.latitude, longitude: filtered.longitude, t: now };
      },
      () => {},
      { enableHighAccuracy: true, distanceFilter: 1, interval: 2000, fastestInterval: 1000 }
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
          kalmanRef.current = new Kalman2D(stable.latitude, stable.longitude, now);
        }
        const filtered = kalmanRef.current.update(now, stable.latitude, stable.longitude, stable.accuracy);
        setCurrentLocation({ latitude: filtered.latitude, longitude: filtered.longitude, accuracy: stable.accuracy });
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
          setMapReference({ latitude: stable.latitude, longitude: stable.longitude });
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

  // Live distance to nearest event coin (map distance), for on-screen overlay only
  const nearestCoinDistance = useMemo(() => {
    try {
      if (!eventId || !currentLocation || !eventCoins?.length) {
        return null;
      }
      const R = 6371000;
      const toRad = (d: number) => (d * Math.PI) / 180;
      const dist = (a: any, b: any) => {
        const dLat = toRad(b.latitude - a.latitude);
        const dLon = toRad(b.longitude - a.longitude);
        const la1 = toRad(a.latitude);
        const la2 = toRad(b.latitude);
        const k = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(k), Math.sqrt(1 - k));
      };
      const me = { latitude: currentLocation.latitude, longitude: currentLocation.longitude };
      let best = Infinity;
      for (const c of eventCoins) {
        if (!c.location?.latitude || !c.location?.longitude) {
          continue;
        }
        const d = dist(me, c.location);
        if (d < best) {
          best = d;
        }
      }
      if (!Number.isFinite(best)) {
        return null;
      }
      return Math.round(best);
    } catch {
      return null;
    }
  }, [eventId, currentLocation, eventCoins]);

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
      const metersPerDegLon = metersPerDegLat * Math.cos((reference.latitude * Math.PI) / 180);
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

  // Compute AR positions for event coins - DIRECT GPS TO AR CONVERSION
  const eventCoinPositions = useMemo(() => {
    if (!currentLocation || !eventCoins?.length) {
      return [] as Array<{ id: string; pos: [number, number, number]; material?: string }>;
    }
    
    // Use current GPS as AR world origin (0,0,0)
    const metersPerDegLat = 111320;
    const metersPerDegLon = metersPerDegLat * Math.cos((currentLocation.latitude * Math.PI) / 180);
    
    const computed = eventCoins
      .filter((c) => c.location?.latitude && c.location?.longitude && c.collectible && !c.collected)
      .map((c) => {
        // Calculate offset from current location to coin location in meters
        const dLat = c.location.latitude - currentLocation.latitude;
        const dLon = c.location.longitude - currentLocation.longitude;
        
        // Convert to meters using proper world coordinates
        const deltaX = dLon * metersPerDegLon;  // East-West (positive = East)
        const deltaZ = dLat * metersPerDegLat;  // North-South (positive = North)
        
        console.log(`Coin ${c.name}: GPS(${c.location.latitude.toFixed(6)}, ${c.location.longitude.toFixed(6)}) -> Offset(${deltaX.toFixed(2)}m E, ${deltaZ.toFixed(2)}m N)`);
        
        // Use exact GPS coordinates - no distance clamping
        // Coins stay at their real-world positions, size adapts to distance
        const finalX = deltaX;
        const finalZ = deltaZ;
        
        // AR coordinates: X=East, Z=North, Y=height (keep at ground level)
        const pos: [number, number, number] = [finalX, 0, finalZ];
        console.log(`[AR_DEBUG] Final AR position for ${c.name}: [${finalX.toFixed(2)}, 0, ${finalZ.toFixed(2)}]`);
        return { id: c.id, pos, material: rarityToMaterial(c.rarity as any), name: c.name || c.id };
      });
    
    console.log(`[AR_DEBUG] Total computed positions: ${computed.length} coins`);
    return computed;
  }, [currentLocation, eventCoins, rarityToMaterial]);

  // Removed proximity gating; we always compute directed placement and clamp to MAX_AR_DISTANCE.

  // Save (pin) the spawn to your current precise GPS location
  const saveObjectCoordinate = useCallback(async () => {
    try {
      if (busy) {
        return;
      }
      setBusy(true);
      const ok = await requestLocationPermission();
      if (!ok) {
        showInfo("Location permission denied");
        return;
    }
    const fix = await getStableLocation();
      const lat = fix.latitude;
      const lon = fix.longitude;

      // Only persist to profile when not anchored to a specific coin
      const user = FirebaseService.getCurrentUser?.();
      const userId = user?.uid;
      if (userId && !selectedCoinId) {
        try {
          await FirebaseService.upsertUserSpawnARObject({
            userId,
            latitude: lat,
            longitude: lon,
            metadata: { source: "save-button" },
          });
        } catch {}
        try {
          await FirebaseService.updateUserProfile(userId, {
            ar: {
              coinSpawnLocation: {
                latitude: lat,
                longitude: lon,
                updatedAt: new Date().toISOString(),
              },
            },
          });
        } catch {}
      }
      setSpawnLocation({ latitude: lat, longitude: lon });
      setCurrentLocation({ latitude: fix.latitude, longitude: fix.longitude });
      showInfo(
        `${selectedCoinId ? "Using" : "Saved"}: ${lat.toFixed(5)}, ${lon.toFixed(5)}`
      );
    } catch (_) {
      showInfo("Failed to save");
    } finally {
      setBusy(false);
    }
  }, [busy, requestLocationPermission, getStableLocation, showInfo, selectedCoinId]);

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
            <Text style={styles.btnText}>{requesting ? "Requesting…" : "Grant Permission"}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    // Wait until we have GPS location to place coins at their map positions
    if (!currentLocation) {
      return (
        <View style={styles.permissionWrap}>
          <Text style={styles.permissionTitle}>Getting your location…</Text>
          <Text style={styles.permissionDesc}>Need GPS to place coins at their map positions.</Text>
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
            You're about {distanceMeters}m away from the saved spawn. Move closer to see the coin.
          </Text>
        </View>
      );
    }

    return (
      <ViroARSceneNavigator
        autofocus={true}
        worldAlignment={"GravityAndHeading"}
        // Cast needed because Viro accepts props on scene via runtime
        initialScene={{ scene: ARCoinScene as any }}
        viroAppProps={{
          // Pass coin data for GPS-positioned spawning (like mocked screen concept)
          coinData: (() => {
            if (eventId) {
              // In Hunt mode: use event coins at their exact GPS positions
              return showEventCoins ? eventCoinPositions : [];
            } else {
              // General AR: use legacy positioned coins
              const map = new Map<string, { id: string; pos: [number, number, number]; material?: string }>();
              // Event coins first (so session duplicates of same id don't add twice)
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
            }
          })(),
          coinPositions: (() => {
            // In Hunt mode (eventId provided), we only render coins from that event
            if (eventId) {
              const list = showEventCoins ? [...eventCoinPositions] : [];
              // Keep only the nearest one if multiple
              if (list.length <= 1) {
                return list;
              }
              // Choose nearest by AR distance from origin (x/z length)
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
            const map = new Map<string, { id: string; pos: [number, number, number]; material?: string }>();
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
          })(),
          onCollected: async (coinId?: string) => {
            setCollectedBanner(true);
            setTimeout(() => setCollectedBanner(false), 1500);
            // Haptic feedback as an immediate cue
            try { Vibration.vibrate(50); } catch {}
            // If collected corresponds to an event coin, mark it collected in Firestore
            try {
              if (coinId && eventCoins.some((c) => c.id === coinId)) {
                const user = FirebaseService.getCurrentUser?.();
                const userId = user?.uid;
                if (userId) {
                  await FirebaseService.collectCoin(coinId, userId);
                  setEventCoins((prev) => prev.map((c) => (c.id === coinId ? { ...c, collected: true } : c)));
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
    primaryCoinPosition,
    sessionCoinPositions,
    eventCoinPositions,
    eventCoins,
    showEventCoins,
    currentLocation,
    eventId,
  ]);

  const createMockCoins = useCallback(async () => {
    if (!effectiveEventId) {
      showInfo("No event selected to create mock coins");
      return;
    }
    
    console.log(`[AR] Creating mock coins for event: ${effectiveEventId}`);
    setBusy(true);
    try {
      const coinIds = await FirebaseService.createMockCoins(effectiveEventId);
      console.log(`[AR] Created ${coinIds.length} mock coins:`, coinIds);
      showInfo(`Mock coins created! ${coinIds.length} coins added.`);
    } catch (error) {
      console.error("Error creating mock coins:", error);
      showInfo("Failed to create mock coins");
    } finally {
      setBusy(false);
    }
  }, [effectiveEventId, showInfo]);

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
        {debugOverlay && (
          <View style={styles.debugWrap}>
            <Text style={styles.debugTitle}>AR Hunt Debug</Text>
            <ScrollView style={styles.debugScroll}>
              {currentLocation ? (
                <Text style={styles.debugText}>
                  You: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
              ) : (
                <Text style={styles.debugText}>You: (no GPS)</Text>
              )}
              {spawnLocation ? (
                <Text style={styles.debugText}>
                  Saved spawn (your saved position): {spawnLocation.latitude.toFixed(6)}, {spawnLocation.longitude.toFixed(6)}
                </Text>
              ) : null}
              {(() => {
                const reference = currentLocation
                  ? {
                      latitude: currentLocation.latitude + (refBias?.dLat ?? 0),
                      longitude: currentLocation.longitude + (refBias?.dLon ?? 0),
                    }
                  : null;
                if (!reference || !eventCoins?.length) {
                  return <Text style={styles.debugText}>No event coins</Text>;
                }
                const metersPerDegLat = 111320;
                const metersPerDegLon = metersPerDegLat * Math.cos((reference.latitude * Math.PI) / 180);
                const usedById = new Map(eventCoinPositions.map((e) => [e.id, e.pos] as const));
                // Helpers
                const toRad = (d: number) => (d * Math.PI) / 180;
                const haversine = (a: any, b: any) => {
                  const R = 6371000;
                  const dLat = toRad(b.latitude - a.latitude);
                  const dLon = toRad(b.longitude - a.longitude);
                  const la1 = toRad(a.latitude);
                  const la2 = toRad(b.latitude);
                  const k = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
                  return R * 2 * Math.atan2(Math.sqrt(k), Math.sqrt(1 - k));
                };
                const bearingDeg = (a: any, b: any) => {
                  const la1 = toRad(a.latitude);
                  const la2 = toRad(b.latitude);
                  const dLon = toRad(b.longitude - a.longitude);
                  const y = Math.sin(dLon) * Math.cos(la2);
                  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLon);
                  const brng = (Math.atan2(y, x) * 180) / Math.PI; // -180..+180
                  return (brng + 360) % 360; // 0..360 (from North)
                };
                const toCardinal = (deg: number) => {
                  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
                  return dirs[Math.round(deg / 45)];
                };
                // Choose a target coin: nearest to you
                const candidates = eventCoins.filter((c) => c.location?.latitude && c.location?.longitude);
                if (!candidates.length) {
                  return <Text style={styles.debugText}>No event coins</Text>;
                }
                let target = candidates[0];
                let best = haversine(reference, candidates[0].location);
                for (let i = 1; i < candidates.length; i++) {
                  const d = haversine(reference, candidates[i].location);
                  if (d < best) {
                    best = d;
                    target = candidates[i];
                  }
                }
                const dLat = target.location.latitude - reference.latitude;
                const dLon = target.location.longitude - reference.longitude;
                const rawEast = dLon * metersPerDegLon;
                const rawNorth = dLat * metersPerDegLat;
                const used = usedById.get(target.id) ?? [0, 0, -1];
                const diffX = used[0] - rawEast;
                const diffZ = used[2] - -rawNorth; // z uses -north
                const mapDist = haversine(reference, target.location);
                const arDist = Math.sqrt(used[0] * used[0] + used[2] * used[2]);
                const errDist = Math.sqrt(diffX * diffX + diffZ * diffZ);
                const brng = bearingDeg(reference, target.location);
                const dir = toCardinal(brng);

                return (
                  <>
                    <Text style={styles.debugText}>Nearest coin: {target.id.slice(0, 6)}…</Text>
                    <Text style={styles.debugText}>Coin (map): {target.location.latitude.toFixed(6)}, {target.location.longitude.toFixed(6)}</Text>
                    <Text style={styles.debugText}>Coin (AR): x {used[0].toFixed(2)}m, z {used[2].toFixed(2)}m</Text>
                    <Text style={styles.debugText}>Offsets (map ENU): E {rawEast.toFixed(2)}m, N {rawNorth.toFixed(2)}m</Text>
                    <Text style={styles.debugText}>Δ (AR - map): Δx {diffX.toFixed(2)}m, Δz {diffZ.toFixed(2)}m, |Δ| {errDist.toFixed(2)}m</Text>
                    <Text style={styles.debugText}>Distance: you→map {mapDist.toFixed(1)}m, you→AR {arDist.toFixed(1)}m</Text>
                    {spawnLocation ? (
                      <Text style={styles.debugText}>
                        Distance: you→spawn {haversine(reference, spawnLocation).toFixed(1)}m
                      </Text>
                    ) : null}
                    <Text style={styles.debugText}>Bearing to coin: {dir} {brng.toFixed(0)}° (from North)</Text>
                  </>
                );
              })()}
            </ScrollView>
          </View>
        )}
        {collectedBanner && (
          <View style={styles.collectedBanner}>
            <Text style={styles.collectedText}>Coin collected!</Text>
          </View>
        )}
        {spawnLocation && (
          <View style={styles.locationBadge}>
            <Text style={styles.locationText}>
              Saved spawn: {spawnLocation.latitude.toFixed(5)}, {spawnLocation.longitude.toFixed(5)}
            </Text>
          </View>
        )}
        {currentLocation && (
          <View style={styles.currentBadge}>
            <Text style={styles.locationText}>
              You: {currentLocation.latitude.toFixed(5)}, {currentLocation.longitude.toFixed(5)}{currentLocation.accuracy ? ` (±${Math.round(currentLocation.accuracy)}m)` : ""}
            </Text>
            {typeof distanceMeters === "number" && (
              <Text style={styles.locationText}>~{distanceMeters}m to spawn</Text>
            )}
            {eventId && typeof nearestCoinDistance === "number" && (
              <Text style={styles.locationText}>~{nearestCoinDistance}m to coin</Text>
            )}
          </View>
        )}
        {infoBanner && (
          <View style={styles.collectedBanner}>
            <Text style={styles.collectedText}>{infoBanner}</Text>
          </View>
        )}
        {/* Simple info overlay */}
        {eventCoins.length > 0 && (
          <View style={styles.infoOverlay}>
            <Text style={styles.infoText}>Coins: {eventCoins.filter(c => !c.collected).length} active</Text>
            <Text style={styles.infoText}>Position: {currentLocation ? "Fixed" : "Loading..."}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.gpsFab}
          onPress={refreshGPSNow}
          onLongPress={setSpawnFromCurrent}
          accessibilityLabel="Refresh GPS (long-press to set spawn)"
          disabled={busy}
        >
          <Text style={styles.gpsFabText}>📍 GPS</Text>
        </TouchableOpacity>
        {eventId && (
          <TouchableOpacity
            style={styles.clearFab}
            onPress={() => {
              setShowEventCoins((prev) => {
                const next = !prev;
                showInfo(next ? "Event coins restored" : "Event coins cleared");
                return next;
              });
            }}
            accessibilityLabel="Clear or restore event coins from AR view"
            disabled={busy}
          >
            <Text style={styles.gpsFabText}>{showEventCoins ? "🧹 Clear Coins" : "↩ Restore Coins"}</Text>
          </TouchableOpacity>
        )}
        {eventId && (
          <TouchableOpacity
            style={styles.reanchorFab}
            onPress={reanchor}
            accessibilityLabel="Re-anchor AR near current location"
            disabled={busy}
          >
            <Text style={styles.gpsFabText}>📐 Re-anchor</Text>
          </TouchableOpacity>
        )}
        {eventId && (
          <TouchableOpacity
            style={styles.reanchorFab}
            onPress={createMockCoins}
            accessibilityLabel="Create mock coins around your exact position"
            disabled={busy}
          >
            <Text style={styles.gpsFabText}>🪙 Create Mock Coins</Text>
          </TouchableOpacity>
        )}
        {eventId && (
          <TouchableOpacity
            style={styles.deleteFab}
            onPress={async () => {
              try {
                Alert.alert(
                  "Delete all event coins?",
                  "This will permanently delete all coins for this event from the database.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          setBusy(true);
                          const count = await FirebaseService.deleteCoinsForEvent(eventId);
                          showInfo(`Deleted ${count} coins`);
                          // Refresh local list
                          const coins = await FirebaseService.getCoinsForEvent(eventId);
                          setEventCoins(coins || []);
                        } catch (e) {
                          showInfo("Delete failed");
                        } finally {
                          setBusy(false);
                        }
                      },
                    },
                  ]
                );
              } catch {}
            }}
            accessibilityLabel="Delete all coins of this event from database"
            disabled={busy}
          >
            <Text style={styles.gpsFabText}>🗑️ Delete Coins (DB)</Text>
          </TouchableOpacity>
        )}
        {!eventId && (
        <>
        <TouchableOpacity
          style={styles.calibrateFab}
          onPress={calibrateReference}
          accessibilityLabel="Calibrate AR reference from stable GPS"
          disabled={busy}
        >
          <Text style={styles.gpsFabText}>🎯 Calibrate</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.resetCalFab}
          onPress={() => {
            setRefBias(null);
            showInfo("Calibration reset");
          }}
          accessibilityLabel="Reset calibration"
          disabled={busy}
        >
          <Text style={styles.gpsFabText}>↺ Reset Cal</Text>
        </TouchableOpacity>
        </>
        )}
        {!eventId && (
        <TouchableOpacity
          style={styles.createFab}
          onPress={async () => {
            try {
              if (busy) {
                return;
              }
              setBusy(true);
              // Get latest coin from Firestore and spawn AR object at that GPS
              const coins = await FirebaseService.getLatestCoins(1);
              const latest = coins[0];
              if (!latest) {
                showInfo("No coins in database yet");
                return;
              }
              // Append to session spawns (allows multiple AR objects) but dedupe by id
              setSessionSpawns((prev) => {
                if (prev.some((p) => p.id === latest.id)) {
                  return prev; // already present
                }
                return [
                  ...prev,
                  {
                    id: latest.id,
                    latitude: latest.location.latitude,
                    longitude: latest.location.longitude,
                  },
                ];
              });
              setSpawnLocation({
                latitude: latest.location.latitude,
                longitude: latest.location.longitude,
              });
              console.log(
                "[AR] Session spawn from latest coin:",
                latest.location.latitude,
                latest.location.longitude
              );
              // Persist as AR object for this user
              try {
                const user = FirebaseService.getCurrentUser?.();
                const userId = user?.uid;
                if (userId) {
                  await FirebaseService.createARObject({
                    userId,
                    type: "coin",
                    model: "coin",
                    coinId: latest.id,
                    eventId: latest.eventId || undefined,
                    location: {
                      latitude: latest.location.latitude,
                      longitude: latest.location.longitude,
                    },
                    active: true,
                    metadata: { source: "create-button" },
                  } as any);
                }
              } catch {}
              showInfo("AR object created from latest coin");
            } catch (_) {
              showInfo("Create failed");
            } finally {
              setBusy(false);
            }
          }}
          accessibilityLabel="Create object at last coin position"
          disabled={busy}
        >
          <Text style={styles.gpsFabText}>➕ Create Here</Text>
        </TouchableOpacity>
        )}
        {!eventId && (
          <TouchableOpacity
            style={styles.saveFab}
            onPress={saveObjectCoordinate}
            accessibilityLabel="Save object coordinate"
            disabled={busy}
          >
            <Text style={styles.gpsFabText}>💾 Save Here</Text>
          </TouchableOpacity>
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
  locationBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  currentBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "flex-end",
  },
  locationText: { color: "#fff", fontSize: 12 },
  gpsFab: {
    position: "absolute",
    right: 16,
    bottom: 24,
    backgroundColor: "#7B3FE4",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  saveFab: {
    position: "absolute",
    right: 16,
    bottom: 80,
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
  clearFab: {
    position: "absolute",
    right: 16,
    bottom: 80,
    backgroundColor: "#EF4444",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  createFab: {
    position: "absolute",
    right: 16,
    bottom: 136,
    backgroundColor: "#2563EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  calibrateFab: {
    position: "absolute",
    right: 16,
    bottom: 192,
    backgroundColor: "#6B7280",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  resetCalFab: {
    position: "absolute",
    right: 16,
    bottom: 248,
    backgroundColor: "#374151",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  deleteFab: {
    position: "absolute",
    right: 16,
    bottom: 136,
    backgroundColor: "#B91C1C",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  reanchorFab: {
    position: "absolute",
    right: 16,
    bottom: 192,
    backgroundColor: "#0EA5E9",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  gpsFabText: { color: "#fff", fontWeight: "800" },
  debugWrap: {
    position: "absolute",
    top: 72,
    left: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 8,
    borderRadius: 8,
  },
  debugTitle: { color: "#fff", fontWeight: "800", marginBottom: 4 },
  debugText: { color: "#eee", fontSize: 11, fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }) },
  debugScroll: { maxHeight: 220 },
  permissionWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  permissionTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12 },
  permissionDesc: { color: "#ccc", fontSize: 14, textAlign: "center", marginBottom: 16 },
  btn: {
    backgroundColor: "#7B3FE4",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontWeight: "700" },
  infoOverlay: {
    position: "absolute",
    top: 80,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: 200,
  },
  infoText: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 2,
  },
});

export default ARScreen;

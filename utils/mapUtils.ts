import { Coin } from "../types";

export const generateRandomCoins = (
  centerLat: number,
  centerLng: number,
  count: number = 25,
  prefix: string
): Coin[] => {
  const coins: Coin[] = [];
  for (let i = 0; i < count; i++) {
    // Generate random offset within ~5km radius
    const latOffset = (Math.random() - 0.5) * 0.09; // ~5km (0.045 degrees ≈ 5km)
    const lngOffset = (Math.random() - 0.5) * 0.09; // ~5km
    coins.push({
      id: `${prefix}-coin-${i}`, // Use prefix to make IDs unique
      coordinate: {
        latitude: centerLat + latOffset,
        longitude: centerLng + lngOffset,
      },
      value: Math.floor(Math.random() * 50) + 10, // 10-60 coins
    });
  }
  return coins;
};

export const getMapStyle = () => [
  { elementType: "geometry", stylers: [{ color: "#181a20" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#b0b0b0" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#181a20" }] },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#7B3FE4" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#7B3FE4" }],
  },
  // Buildings styling
  {
    featureType: "landscape.man_made",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }], // Dark gray for buildings
  },
  {
    featureType: "poi.business",
    elementType: "geometry",
    stylers: [{ color: "#333333" }], // Slightly lighter for POI buildings
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "simplified" }], // Show some POI labels
  },
];

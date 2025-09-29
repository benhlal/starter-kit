import { Coin } from "../types";

export const generateRandomCoins = (
  centerLat: number,
  centerLng: number,
  count: number = 25,
  prefix: string
): Coin[] => {
  const coins: Coin[] = [];
  const coinTypes: Array<"standard" | "premium" | "rare"> = [
    "standard",
    "premium",
    "rare",
  ];
  const coinRarities: Array<"common" | "uncommon" | "rare"> = [
    "common",
    "uncommon",
    "rare",
  ];

  for (let i = 0; i < count; i++) {
    // Generate random offset within ~5km radius
    const latOffset = (Math.random() - 0.5) * 0.09; // ~5km (0.045 degrees ≈ 5km)
    const lngOffset = (Math.random() - 0.5) * 0.09; // ~5km
    const latitude = centerLat + latOffset;
    const longitude = centerLng + lngOffset;

    coins.push({
      id: `${prefix}-coin-${i}`, // Use prefix to make IDs unique
      name: `${prefix} Coin ${i + 1}`,
      description: `A randomly placed coin in ${prefix}`,
      value: Math.floor(Math.random() * 50) + 10, // 10-60 coins
      type: coinTypes[Math.floor(Math.random() * coinTypes.length)],
      rarity: coinRarities[Math.floor(Math.random() * coinRarities.length)],
      location: {
        latitude,
        longitude,
      },
      coordinate: {
        // Legacy support
        latitude,
        longitude,
      },
      region: prefix,
      collectible: true,
      collected: Math.random() < 0.2, // 20% already collected
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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

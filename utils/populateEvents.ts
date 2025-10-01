import firestore from "@react-native-firebase/firestore";

// AR coin hunting themed images - real city locations
const sampleImages = [
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400", // NYC streets
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400", // Mountain landscape
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400", // City downtown
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400", // City skyline
  "https://images.unsplash.com/photo-1516483638261-f4dbbd436418?w=400", // Forest path
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400", // Desert sunset
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400", // Waterfront city
  "https://images.unsplash.com/photo-1554223090-74785ad8b2c3?w=400", // Marina/harbor
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400", // Urban bridge
  "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400", // City park
];

// AR Coin Hunting event templates
const eventTemplates = [
  {
    name: "Downtown Los Angeles AR Treasure Hunt",
    description:
      "Hunt for hidden AR coins scattered throughout the bustling downtown LA district. Use your phone's AR camera to spot rare golden coins worth 100+ points each! Navigate between skyscrapers and find digital treasures.",
    category: "Urban Hunt",
    region: "California",
  },
  {
    name: "Manhattan Skyline AR Hunt",
    description:
      "Scale the heights of NYC and hunt for AR coins positioned on rooftops and high vantage points. Premium coins await in Times Square, Central Park, and Brooklyn Bridge!",
    category: "High-Rise Hunt",
    region: "New York",
  },
  {
    name: "Rocky Mountains AR Expedition",
    description:
      "Trek through scenic Denver mountain trails to discover rare AR coins hidden in nature. Each coin found rewards you with bonus XP and mountain badges!",
    category: "Nature Hunt",
    region: "Colorado",
  },
  {
    name: "Seattle Harbor AR Treasure Hunt",
    description:
      "Explore Pike Place Market and the waterfront where special AR coins spawn near boats, piers, and the famous fish market. Maritime-themed coins offer unique rewards!",
    category: "Waterfront Hunt",
    region: "Seattle",
  },
  {
    name: "Phoenix Desert Night Safari",
    description:
      "Join the nocturnal hunt for glowing AR coins that only appear after sunset in the Sonoran Desert landscape. Night vision coins are worth double points!",
    category: "Night Hunt",
    region: "Arizona",
  },
  {
    name: "Portland Forest Park AR Quest",
    description:
      "Navigate through Forest Park's dense trails to uncover AR coins hidden among ancient trees and waterfalls. Woodland coins unlock exclusive nature-themed rewards!",
    category: "Forest Hunt",
    region: "Oregon",
  },
  {
    name: "New Orleans French Quarter Hunt",
    description:
      "Dance through the historic French Quarter while hunting for musical AR coins that play jazz melodies when collected. Rhythm-based bonus challenges included!",
    category: "Music Hunt",
    region: "Louisiana",
  },
  {
    name: "Tech Campus Coin Circuit",
    description:
      "Explore innovation hubs and tech campuses where digital AR coins spawn with programming challenges. Code-cracking coins offer tech gear rewards!",
    category: "Tech Hunt",
    region: "Washington",
  },
  {
    name: "Beachfront Coin Treasure Hunt",
    description:
      "Comb the sandy beaches and boardwalks for shimmering AR coins buried in the digital sand. Surf-themed coins unlock beach equipment!",
    category: "Beach Hunt",
    region: "Florida",
  },
  {
    name: "Stadium Coin Championship",
    description:
      "Compete in the ultimate AR coin collecting competition around sports venues. Athletic coins boost your player stats and unlock team gear!",
    category: "Sports Hunt",
    region: "Texas",
  },
  {
    name: "Canyon Adventure Coin Quest",
    description:
      "Rappel down canyon walls and explore hidden caves where rare AR coins are embedded in rock formations. Geological coins offer mining bonuses!",
    category: "Adventure Hunt",
    region: "Utah",
  },
  {
    name: "Historic District Coin Walk",
    description:
      "Stroll through cobblestone streets and historic landmarks to discover vintage AR coins that tell stories of the past. History coins unlock cultural rewards!",
    category: "Historic Hunt",
    region: "Massachusetts",
  },
  {
    name: "University Campus Coin Rally",
    description:
      "Race across college campuses to collect scholarly AR coins hidden in libraries, labs, and lecture halls. Knowledge coins boost your learning XP!",
    category: "Academic Hunt",
    region: "Massachusetts",
  },
  {
    name: "Riverside Coin Expedition",
    description:
      "Follow winding river paths to discover AR coins floating above the water surface. Aquatic coins unlock fishing gear and water sports equipment!",
    category: "River Hunt",
    region: "Oregon",
  },
  {
    name: "Sunset Boulevard Coin Chase",
    description:
      "Hunt for glamorous AR coins along the famous entertainment district. Hollywood-themed coins unlock exclusive celebrity costumes and props!",
    category: "Entertainment Hunt",
    region: "California",
  },
];

// Location coordinates for different regions
const locationCoords = {
  California: { latitude: 34.0522, longitude: -118.2437 },
  "New York": { latitude: 40.7128, longitude: -74.006 },
  Colorado: { latitude: 39.7392, longitude: -104.9903 },
  Seattle: { latitude: 47.6062, longitude: -122.3321 },
  Arizona: { latitude: 33.4484, longitude: -112.074 },
  Oregon: { latitude: 45.5152, longitude: -122.6784 },
  Louisiana: { latitude: 29.9511, longitude: -90.0715 },
  Washington: { latitude: 47.7511, longitude: -120.7401 },
  Florida: { latitude: 27.7663, longitude: -82.6404 },
  Texas: { latitude: 31.9686, longitude: -99.9018 },
  Utah: { latitude: 39.32, longitude: -111.0937 },
  Massachusetts: { latitude: 42.2352, longitude: -71.0275 },
};

function getRandomElement(array: any[]) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomEvent(index: number) {
  const template = getRandomElement(eventTemplates);
  const coords = locationCoords[template.region as keyof typeof locationCoords];

  // Add some random variation to coordinates
  const latitude = coords.latitude + (Math.random() - 0.5) * 0.1;
  const longitude = coords.longitude + (Math.random() - 0.5) * 0.1;

  // Generate dates
  const now = new Date();
  const pastDate = new Date(
    now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000
  ); // Up to 30 days ago
  const futureDate = new Date(
    now.getTime() + Math.random() * 60 * 24 * 60 * 60 * 1000
  ); // Up to 60 days from now

  // Randomly assign status based on dates
  let status: "completed" | "upcoming" | "ongoing";
  let startDate: Date;
  let endDate: Date;

  const statusRandom = Math.random();

  if (statusRandom < 0.3) {
    // Completed event (30%)
    status = "completed";
    startDate = pastDate;
    endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
  } else if (statusRandom < 0.6) {
    // Upcoming event (30%)
    status = "upcoming";
    startDate = futureDate;
    endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000); // 3 hours later
  } else {
    // Ongoing event (40%)
    status = "ongoing";
    startDate = new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000); // Started up to 2 hours ago
    endDate = new Date(now.getTime() + Math.random() * 4 * 60 * 60 * 1000); // Ends up to 4 hours from now
  }

  return {
    name: template.name,
    description: template.description,
    location: {
      latitude,
      longitude,
      address: `${template.region}, USA`,
    },
    coordinate: {
      latitude,
      longitude,
    },
    startDate: firestore.Timestamp.fromDate(startDate),
    endDate: firestore.Timestamp.fromDate(endDate),
    status: status,
    category: template.category,
    type: "AR Coin Hunt", // Set type for AR coin hunting
    maxParticipants: Math.floor(Math.random() * 50) + 10, // 10-60 participants (more for coin hunts)
    currentParticipants: Math.floor(Math.random() * 30) + 1, // 1-30 current
    isActive: status !== "completed",
    image: getRandomElement(sampleImages),
    rewards: {
      coins: Math.floor(Math.random() * 1000) + 200, // 200-1200 coins for AR hunts
      xp: Math.floor(Math.random() * 150) + 75, // 75-225 xp
      experience: Math.floor(Math.random() * 150) + 75, // Legacy field for compatibility
    },
    requirements: {
      minLevel: Math.floor(Math.random() * 3) + 1, // Level 1-3 (AR hunting is accessible)
      equipment: ["Smartphone with AR capability", "Charged battery"],
    },
    huntDetails: {
      coinsAvailable: Math.floor(Math.random() * 50) + 20, // 20-70 coins to find
      difficulty: getRandomElement(["Easy", "Medium", "Hard"]),
      terrain: getRandomElement([
        "Urban",
        "Nature",
        "Mixed",
        "Waterfront",
        "Historic",
      ]),
      range: Math.floor(Math.random() * 4) + 1, // 1-5km range
      specialRewards: getRandomElement([
        "Golden Coin Multiplier",
        "Rare Badge Collection",
        "Exclusive Avatar Items",
        "Bonus XP Boost",
        "Premium City Pass",
        "AR Camera Upgrade",
      ]),
      totalPrizePool: Math.floor(Math.random() * 2000) + 1000, // 1000-3000 coin prize pool
    },
    tags: [
      "ar-coin-hunt",
      template.category.toLowerCase().replace(" ", "-"),
      template.region.toLowerCase().replace(" ", "-"),
    ],
    createdBy: "admin",
    createdAt: firestore.FieldValue.serverTimestamp(),
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
}

export async function populateMoreEvents() {
  console.log("Starting to populate events...");

  try {
    const batch = firestore().batch();

    // Generate 25 random events
    for (let i = 0; i < 25; i++) {
      const eventData = generateRandomEvent(i);
      const eventRef = firestore().collection("events").doc();
      batch.set(eventRef, eventData);

      console.log(
        `Generated event ${i + 1}: ${eventData.name} (${eventData.status})`
      );
    }

    await batch.commit();
    console.log("Successfully populated 25 events!");

    return { success: true, count: 25 };
  } catch (error) {
    console.error("Error populating events:", error);
    throw error;
  }
}

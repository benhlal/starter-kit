const admin = require("firebase-admin");

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Sample images - you can replace these with actual URLs
const sampleImages = [
  "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
  "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
  "https://images.unsplash.com/photo-1516483638261-f4dbbd436418?w=400",
  "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400",
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
  "https://images.unsplash.com/photo-1554223090-74785ad8b2c3?w=400",
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400",
  "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=400",
];

// Random event categories and details
const eventTemplates = [
  {
    name: "Sunset Beach Photography Walk",
    description:
      "Join us for a magical evening capturing the golden hour at the beach. Perfect for beginners and pros alike. Bring your camera and discover new perspectives.",
    category: "Photography",
    region: "California",
  },
  {
    name: "Urban Street Art Tour",
    description:
      "Explore the vibrant street art scene in the city center. Meet local artists, learn about different techniques, and discover hidden murals.",
    category: "Art",
    region: "New York",
  },
  {
    name: "Mountain Hiking Adventure",
    description:
      "Challenge yourself with this moderate 5-mile hike through scenic mountain trails. Breathtaking views and fresh air guaranteed.",
    category: "Outdoor",
    region: "Colorado",
  },
  {
    name: "Coffee Tasting Experience",
    description:
      "Discover the world of specialty coffee with our expert barista. Learn about different brewing methods and taste rare coffee varieties.",
    category: "Food",
    region: "Seattle",
  },
  {
    name: "Night Sky Stargazing",
    description:
      "Escape the city lights and observe constellations, planets, and meteor showers. Telescopes provided for this cosmic adventure.",
    category: "Science",
    region: "Arizona",
  },
  {
    name: "Vintage Market Hunt",
    description:
      "Browse unique vintage finds and antiques at the weekly market. From retro clothing to rare collectibles, there's something for everyone.",
    category: "Shopping",
    region: "Oregon",
  },
  {
    name: "Jazz Music Session",
    description:
      "Intimate jazz performance featuring local musicians. Enjoy smooth melodies in a cozy atmosphere with fellow music lovers.",
    category: "Music",
    region: "Louisiana",
  },
  {
    name: "Cooking Class: Italian Cuisine",
    description:
      "Learn to make authentic Italian pasta and sauces from scratch. All ingredients provided, recipes included to take home.",
    category: "Cooking",
    region: "California",
  },
  {
    name: "Digital Art Workshop",
    description:
      "Master digital illustration techniques using professional software. Suitable for beginners, tablets and styluses provided.",
    category: "Technology",
    region: "Washington",
  },
  {
    name: "Yoga in the Park",
    description:
      "Start your day with peaceful yoga practice surrounded by nature. All levels welcome, bring your own mat or rent one on-site.",
    category: "Wellness",
    region: "Florida",
  },
  {
    name: "Wine and Paint Night",
    description:
      "Relax and unleash your creativity while sipping local wines. No painting experience required, all materials included.",
    category: "Art",
    region: "California",
  },
  {
    name: "Kayak River Adventure",
    description:
      "Paddle through calm river waters and enjoy wildlife spotting. Safety equipment provided, suitable for beginners.",
    category: "Water Sports",
    region: "Oregon",
  },
  {
    name: "Food Truck Festival",
    description:
      "Sample diverse cuisines from 15+ local food trucks. Live music, family-friendly atmosphere, and outdoor seating available.",
    category: "Food",
    region: "Texas",
  },
  {
    name: "Rock Climbing Basics",
    description:
      "Learn fundamental rock climbing techniques in a safe, supervised environment. Equipment rental and instruction included.",
    category: "Adventure",
    region: "Utah",
  },
  {
    name: "Book Club Discussion",
    description:
      "Join our monthly book club to discuss contemporary fiction. This month: award-winning novels and author insights.",
    category: "Literature",
    region: "Massachusetts",
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

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomEvent(index) {
  const template = getRandomElement(eventTemplates);
  const coords = locationCoords[template.region];

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
  let status, startDate, endDate;
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
    startDate: admin.firestore.Timestamp.fromDate(startDate),
    endDate: admin.firestore.Timestamp.fromDate(endDate),
    status: status,
    category: template.category,
    maxParticipants: Math.floor(Math.random() * 20) + 5, // 5-25 participants
    currentParticipants: Math.floor(Math.random() * 15) + 1, // 1-15 current
    isActive: status !== "completed",
    image: getRandomElement(sampleImages),
    rewards: {
      coins: Math.floor(Math.random() * 500) + 100, // 100-600 coins
      xp: Math.floor(Math.random() * 100) + 50, // 50-150 xp
    },
    requirements: {
      minLevel: Math.floor(Math.random() * 5) + 1, // Level 1-5
      equipment:
        template.category === "Photography"
          ? ["Camera"]
          : template.category === "Outdoor"
          ? ["Hiking boots", "Water bottle"]
          : template.category === "Water Sports"
          ? ["Swimwear"]
          : [],
    },
    tags: [
      template.category.toLowerCase(),
      template.region.toLowerCase().replace(" ", "-"),
    ],
    createdBy: "admin",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
}

async function populateEvents() {
  console.log("Starting to populate events...");

  try {
    const batch = db.batch();

    // Generate 25 random events
    for (let i = 0; i < 25; i++) {
      const eventData = generateRandomEvent(i);
      const eventRef = db.collection("events").doc();
      batch.set(eventRef, eventData);

      console.log(
        `Generated event ${i + 1}: ${eventData.name} (${eventData.status})`
      );
    }

    await batch.commit();
    console.log("Successfully populated 25 events!");

    // Print summary
    console.log("\nEvent generation complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error populating events:", error);
    process.exit(1);
  }
}

populateEvents();

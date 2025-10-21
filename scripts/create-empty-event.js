const admin = require("firebase-admin");

// Initialize Firebase Admin (assumes GOOGLE_APPLICATION_CREDENTIALS is set)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function createEmptyEvent({
  name = "Empty Demo Event",
  tokensRequired = 10,
  participants = 3,
  location = {
    latitude: 48.8566,
    longitude: 2.3522,
    address: "Paris, France",
    venue: "Demo Venue",
  },
  status = "upcoming",
} = {}) {
  const now = new Date();
  const startDate = admin.firestore.Timestamp.fromDate(
    new Date(now.getTime() + 60 * 60 * 1000)
  ); // 1 hour from now
  const endDate = admin.firestore.Timestamp.fromDate(
    new Date(now.getTime() + 3 * 60 * 60 * 1000)
  ); // +3h

  const eventData = {
    name,
    description: "A minimal demo event to inspect token calculations",
    type: "demo",
    status,
    location: location,
    coordinate: { latitude: location.latitude, longitude: location.longitude },
    startDate,
    endDate,
    maxParticipants: Math.max(participants, 10),
    currentParticipants: participants,
    participants: Array.from({ length: participants }).map(
      (_, i) => `demo-user-${i + 1}`
    ),
    organizer: { id: "admin", name: "Demo Admin" },
    tags: ["demo", "token-economy"],
    image: "",
    rewards: { coins: 0, experience: 0 },
    minCoins: 0,
    requirements: { minLevel: 1 },
    visibility: "public",
    huntDetails: {
      coinsAvailable: 3,
      difficulty: "Easy",
      terrain: "Urban",
      range: 500,
      totalPrizePool: 0,
      tokensRequired: tokensRequired,
      tokensCollected: 0,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const ref = await db.collection("events").add(eventData);
  console.log("Created event with id:", ref.id);
  return ref.id;
}

// CLI
const args = process.argv.slice(2);
const parsed = {};
args.forEach((arg) => {
  const [k, v] = arg.split("=");
  parsed[k.replace(/^--/, "")] = v;
});

createEmptyEvent({
  name: parsed.name || undefined,
  tokensRequired: parsed.tokensRequired ? Number(parsed.tokensRequired) : 10,
  participants: parsed.participants ? Number(parsed.participants) : 3,
  status: parsed.status || "upcoming",
})
  .then((id) => {
    console.log("Event created:", id);
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

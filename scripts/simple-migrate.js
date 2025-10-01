#!/usr/bin/env node

/**
 * Simple migration script to add sample data to Firebase
 * Usage: node scripts/simple-migrate.js
 */

// Sample data to insert directly
const sampleEvents = [
  {
    title: "Paris Treasure Hunt",
    description:
      "Explore the City of Light and discover hidden treasures around iconic landmarks.",
    type: "treasure-hunt",
    status: "active",
    location: {
      latitude: 48.8566,
      longitude: 2.3522,
      address: "Paris, France",
      venue: "City Center",
    },
    startDate: new Date("2024-03-01T10:00:00Z").toISOString(),
    endDate: new Date("2024-03-01T18:00:00Z").toISOString(),
    maxParticipants: 100,
    currentParticipants: 532,
    participants: [],
    organizer: { id: "event_organizer_1", name: "Paris Adventures" },
    tags: ["urban", "exploration", "landmarks"],
    image:
      "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&w=600",
    rewards: {
      coins: 1200,
      experience: 500,
      badges: ["First Prize", "Second Prize", "Third Prize"],
    },
    visibility: "public",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "New York Central Park Hunt",
    description:
      "Navigate through Central Park's scenic paths while hunting for digital treasures.",
    type: "community-event",
    status: "active",
    location: {
      latitude: 40.7829,
      longitude: -73.9654,
      address: "Central Park, New York",
      venue: "Central Park",
    },
    startDate: new Date("2024-03-05T14:00:00Z").toISOString(),
    endDate: new Date("2024-03-05T20:00:00Z").toISOString(),
    maxParticipants: 75,
    currentParticipants: 420,
    participants: [],
    organizer: { id: "event_organizer_2", name: "NYC Explorers" },
    tags: ["nature", "park", "community"],
    image:
      "https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&w=600",
    rewards: {
      coins: 950,
      experience: 400,
      badges: ["First Prize", "Second Prize", "Third Prize"],
    },
    visibility: "public",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "Tokyo Night Run",
    description:
      "Experience Tokyo's neon-lit streets in an exciting night-time treasure hunt.",
    type: "challenge",
    status: "active",
    location: {
      latitude: 35.6762,
      longitude: 139.6503,
      address: "Tokyo, Japan",
      venue: "Shibuya District",
    },
    startDate: new Date("2024-03-10T19:00:00Z").toISOString(),
    endDate: new Date("2024-03-10T23:00:00Z").toISOString(),
    maxParticipants: 50,
    currentParticipants: 300,
    participants: [],
    organizer: { id: "event_organizer_3", name: "Tokyo Treks" },
    tags: ["night", "city", "challenge"],
    image: "https://images.pexels.com/photos/356830/pexels-photo-356830.jpeg",
    rewards: {
      coins: 150000,
      experience: 800,
      badges: ["First Prize", "Second Prize", "Third Prize"],
    },
    visibility: "public",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

console.log("✅ Sample events prepared for database insertion:");
console.log(`📊 Total events: ${sampleEvents.length}`);
sampleEvents.forEach((event, index) => {
  console.log(`${index + 1}. ${event.title} - ${event.location.address}`);
});

console.log("\n🚀 To insert these events into Firebase:");
console.log("1. Ensure Firebase is properly configured");
console.log("2. Use the CreateEventModal in the app to manually add events");
console.log("3. Or integrate with FirebaseService.createEvent() method");

console.log("\n💡 Events are ready to be created through the app interface!");

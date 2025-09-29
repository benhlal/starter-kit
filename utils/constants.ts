import { Event, EventLocation } from "../types";
import { generateRandomCoins } from "./mapUtils";

export const eventLocations: EventLocation[] = [
  {
    id: "1",
    eventId: "1",
    title: "Total Prize",
    description: "€1200 • 532 subscribers",
    location: { latitude: 48.8566, longitude: 2.3522 },
    coordinate: { latitude: 48.8566, longitude: 2.3522 }, // Legacy support
    type: "treasure",
    radius: 100,
    interactionType: "tap",
    isActive: true,
    visitedBy: [],
    coins: 120, // Legacy support
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    eventId: "2",
    title: "New York Central Park Hunt",
    description: "€950 • 420 subscribers",
    location: { latitude: 40.7829, longitude: -73.9654 },
    coordinate: { latitude: 40.7829, longitude: -73.9654 }, // Legacy support
    type: "checkpoint",
    radius: 150,
    interactionType: "proximity",
    isActive: true,
    visitedBy: [],
    coins: 95, // Legacy support
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    eventId: "3",
    title: "Tokyo Night Run",
    description: "¥150,000 • 300 subscribers",
    location: { latitude: 35.6762, longitude: 139.6503 },
    coordinate: { latitude: 35.6762, longitude: 139.6503 }, // Legacy support
    type: "challenge",
    radius: 200,
    interactionType: "ar-scan",
    isActive: true,
    visitedBy: [],
    coins: 150, // Legacy support
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    eventId: "4",
    title: "Sydney Opera Adventure",
    description: "AU$2,100 • 210 subscribers",
    location: { latitude: -33.8568, longitude: 151.2153 },
    coordinate: { latitude: -33.8568, longitude: 151.2153 }, // Legacy support
    type: "ar-portal",
    radius: 300,
    interactionType: "long-press",
    isActive: true,
    visitedBy: [],
    coins: 210, // Legacy support
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    eventId: "5",
    title: "London Bridge Quest",
    description: "£1,300 • 410 subscribers",
    location: { latitude: 51.5074, longitude: -0.1278 },
    coordinate: { latitude: 51.5074, longitude: -0.1278 }, // Legacy support
    type: "social-hub",
    radius: 250,
    interactionType: "gesture",
    isActive: true,
    visitedBy: [],
    coins: 130, // Legacy support
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const events: Event[] = [
  {
    id: "1",
    title: "Total Prize",
    name: "Total Prize", // Legacy support
    description: "Join the ultimate treasure hunt in Paris",
    type: "treasure-hunt",
    status: "active",
    location: {
      latitude: 48.8566,
      longitude: 2.3522,
      address: "Paris, France",
    },
    coordinate: { latitude: 48.8566, longitude: 2.3522 }, // Legacy support
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    currentParticipants: 532,
    participants: [],
    organizer: { id: "org1", name: "Paris Adventures" },
    tags: ["treasure", "city", "adventure"],
    image:
      "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&w=600",
    img: "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&w=600", // Legacy support
    rewards: { coins: 1200, experience: 500 },
    visibility: "public",
    // Legacy fields
    balance: "Total Balance: €1200",
    subscribers: "532 subscribers",
    distance: "2 km",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "New York Central Park Hunt",
    name: "New York Central Park Hunt", // Legacy support
    description: "Discover hidden treasures in Central Park",
    type: "community-event",
    status: "active",
    location: {
      latitude: 40.7829,
      longitude: -73.9654,
      address: "Central Park, New York",
    },
    coordinate: { latitude: 40.7829, longitude: -73.9654 }, // Legacy support
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    currentParticipants: 420,
    participants: [],
    organizer: { id: "org2", name: "NYC Explorers" },
    tags: ["park", "nature", "community"],
    image:
      "https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&w=600",
    img: "https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&w=600", // Legacy support
    rewards: { coins: 950, experience: 400 },
    visibility: "public",
    // Legacy fields
    balance: "Total Balance: €950",
    subscribers: "420 subscribers",
    distance: "5 km",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Tokyo Night Run",
    name: "Tokyo Night Run", // Legacy support
    description: "Experience Tokyo's neon-lit streets in AR",
    type: "ar-experience",
    status: "active",
    location: {
      latitude: 35.6762,
      longitude: 139.6503,
      address: "Shibuya, Tokyo",
    },
    coordinate: { latitude: 35.6762, longitude: 139.6503 }, // Legacy support
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    currentParticipants: 300,
    participants: [],
    organizer: { id: "org3", name: "Tokyo AR Adventures" },
    tags: ["night", "ar", "urban"],
    image: "https://images.pexels.com/photos/356830/pexels-photo-356830.jpeg",
    img: "https://images.pexels.com/photos/356830/pexels-photo-356830.jpeg", // Legacy support
    rewards: { coins: 1500, experience: 750 },
    visibility: "public",
    // Legacy fields
    balance: "Total Balance: ¥150,000",
    subscribers: "300 subscribers",
    distance: "3.5 km",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Sydney Opera Adventure",
    name: "Sydney Opera Adventure", // Legacy support
    description: "Explore the iconic Opera House with AR",
    type: "exhibition",
    status: "upcoming",
    location: {
      latitude: -33.8568,
      longitude: 151.2153,
      address: "Sydney Opera House, Australia",
    },
    coordinate: { latitude: -33.8568, longitude: 151.2153 }, // Legacy support
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    currentParticipants: 210,
    participants: [],
    organizer: { id: "org4", name: "Sydney Cultural Events" },
    tags: ["culture", "landmark", "ar"],
    image: "https://images.pexels.com/photos/2193300/pexels-photo-2193300.jpeg",
    img: "https://images.pexels.com/photos/2193300/pexels-photo-2193300.jpeg", // Legacy support
    rewards: { coins: 2100, experience: 1000 },
    visibility: "public",
    // Legacy fields
    balance: "Total Balance: AU$2,100",
    subscribers: "210 subscribers",
    distance: "4 km",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    title: "London Bridge Quest",
    name: "London Bridge Quest", // Legacy support
    description: "Historical adventure across London's bridges",
    type: "challenge",
    status: "active",
    location: {
      latitude: 51.5074,
      longitude: -0.1278,
      address: "Tower Bridge, London",
    },
    coordinate: { latitude: 51.5074, longitude: -0.1278 }, // Legacy support
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    currentParticipants: 410,
    participants: [],
    organizer: { id: "org5", name: "London Heritage Tours" },
    tags: ["history", "bridges", "challenge"],
    image: "https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg",
    img: "https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg", // Legacy support
    rewards: { coins: 1300, experience: 600 },
    visibility: "public",
    // Legacy fields
    balance: "Total Balance: £1,300",
    subscribers: "410 subscribers",
    distance: "2.8 km",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "6",
    title: "Marrakesh Medina Hunt",
    name: "Marrakesh Medina Hunt", // Legacy support
    description:
      "Navigate the vibrant souks and historic alleys of Marrakesh's Medina.",
    type: "treasure-hunt",
    status: "active",
    location: {
      latitude: 31.6295,
      longitude: -7.9811,
      address: "Marrakesh, Morocco",
    },
    coordinate: { latitude: 31.6295, longitude: -7.9811 }, // Legacy support
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    currentParticipants: 240,
    participants: [],
    organizer: { id: "org6", name: "Medina Masters" },
    tags: ["market", "heritage", "exploration"],
    image:
      "https://images.pexels.com/photos/239520/pexels-photo-239520.jpeg?auto=compress&w=600",
    img: "https://images.pexels.com/photos/239520/pexels-photo-239520.jpeg?auto=compress&w=600", // Legacy support
    rewards: { coins: 800, experience: 350 },
    visibility: "public",
    // Legacy fields
    balance: "Total Balance: 800 MAD",
    subscribers: "240 subscribers",
    distance: "6 km",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "7",
    title: "Casablanca Finance City Challenge",
    name: "Casablanca Finance City Challenge", // Legacy support
    description:
      "Race through the modern skyline around Casablanca Finance City.",
    type: "community-event",
    status: "active",
    location: {
      latitude: 33.5731,
      longitude: -7.5898,
      address: "Casablanca, Morocco",
    },
    coordinate: { latitude: 33.5731, longitude: -7.5898 }, // Legacy support
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    currentParticipants: 520,
    participants: [],
    organizer: { id: "org7", name: "Casablanca Crew" },
    tags: ["city", "modern", "community"],
    image:
      "https://images.pexels.com/photos/373912/pexels-photo-373912.jpeg?auto=compress&w=600",
    img: "https://images.pexels.com/photos/373912/pexels-photo-373912.jpeg?auto=compress&w=600", // Legacy support
    rewards: { coins: 1400, experience: 500 },
    visibility: "public",
    // Legacy fields
    balance: "Total Balance: DH 1,400",
    subscribers: "520 subscribers",
    distance: "7.2 km",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Random coins around Paris (25 coins in 5km radius)
const parisCoins = generateRandomCoins(48.8566, 2.3522, 25, "paris");

// Random coins around London (25 coins in 5km radius)
const londonCoins = generateRandomCoins(51.5074, -0.1278, 25, "london");

// Combine all coins
export const randomCoins = [...parisCoins, ...londonCoins];

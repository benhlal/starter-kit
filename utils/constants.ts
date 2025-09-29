import { Event, EventLocation } from "../types";
import { generateRandomCoins } from "./mapUtils";

export const eventLocations: EventLocation[] = [
  {
    id: "1",
    title: "Total Prize",
    description: "€1200 • 532 subscribers",
    coordinate: { latitude: 48.8566, longitude: 2.3522 },
    coins: 120,
  },
  {
    id: "2",
    title: "New York Central Park Hunt",
    description: "€950 • 420 subscribers",
    coordinate: { latitude: 40.7829, longitude: -73.9654 },
    coins: 95,
  },
  {
    id: "3",
    title: "Tokyo Night Run",
    description: "¥150,000 • 300 subscribers",
    coordinate: { latitude: 35.6762, longitude: 139.6503 },
    coins: 150,
  },
  {
    id: "4",
    title: "Sydney Opera Adventure",
    description: "AU$2,100 • 210 subscribers",
    coordinate: { latitude: -33.8568, longitude: 151.2153 },
    coins: 210,
  },
  {
    id: "5",
    title: "London Bridge Quest",
    description: "£1,300 • 410 subscribers",
    coordinate: { latitude: 51.5074, longitude: -0.1278 },
    coins: 130,
  },
];

export const events: Event[] = [
  {
    id: "1",
    name: "Total Prize",
    balance: "Total Balance: €1200",
    subscribers: "532 subscribers",
    distance: "2 km",
    img: "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&w=600",
    coordinate: { latitude: 48.8566, longitude: 2.3522 },
  },
  {
    id: "2",
    name: "New York Central Park Hunt",
    balance: "Total Balance: €950",
    subscribers: "420 subscribers",
    distance: "5 km",
    img: "https://images.pexels.com/photos/462118/pexels-photo-462118.jpeg?auto=compress&w=600",
    coordinate: { latitude: 40.7829, longitude: -73.9654 },
  },
  {
    id: "3",
    name: "Tokyo Night Run",
    balance: "Total Balance: ¥150,000",
    subscribers: "300 subscribers",
    distance: "3.5 km",
    img: "https://images.pexels.com/photos/356830/pexels-photo-356830.jpeg",
    coordinate: { latitude: 35.6762, longitude: 139.6503 },
  },
  {
    id: "4",
    name: "Sydney Opera Adventure",
    balance: "Total Balance: AU$2,100",
    subscribers: "210 subscribers",
    distance: "4 km",
    img: "https://images.pexels.com/photos/2193300/pexels-photo-2193300.jpeg",
    coordinate: { latitude: -33.8568, longitude: 151.2153 },
  },
  {
    id: "5",
    name: "London Bridge Quest",
    balance: "Total Balance: £1,300",
    subscribers: "410 subscribers",
    distance: "2.8 km",
    img: "https://images.pexels.com/photos/460672/pexels-photo-460672.jpeg",
    coordinate: { latitude: 51.5074, longitude: -0.1278 },
  },
];

// Random coins around Paris (25 coins in 5km radius)
const parisCoins = generateRandomCoins(48.8566, 2.3522, 25, "paris");

// Random coins around London (25 coins in 5km radius)
const londonCoins = generateRandomCoins(51.5074, -0.1278, 25, "london");

// Combine all coins
export const randomCoins = [...parisCoins, ...londonCoins];

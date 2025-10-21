import { Event, Coin } from "../types";

export function isEventAllCoinsCollected(
  event: Event,
  coins?: Coin[]
): boolean {
  if (event.allCoinsCollected || event.status === "completed") {
    return true;
  }
  if (coins && coins.length > 0) {
    return coins.every((c) => c.collected);
  }
  // If coins are explicitly provided but empty, do NOT assume all collected.
  // An empty array may indicate coins are not yet loaded or the dataset is missing.
  // Return false so the UI doesn't incorrectly show "All coins collected".
  if (coins && coins.length === 0) {
    return false;
  }
  return false;
}

export function isEventJoinable(event: Event, coins?: Coin[]): boolean {
  // Not joinable if completed or all coins collected
  if (event.status === "completed" || isEventAllCoinsCollected(event, coins)) {
    return false;
  }
  // Allow joining ongoing events (they can join with late fees)
  // Allow joining upcoming events
  // Only exclude if explicitly completed or all coins collected
  return true;
}

export function getEventStatusLabel(event: Event, coins?: Coin[]): string {
  if (isEventAllCoinsCollected(event, coins)) {
    return "All coins collected";
  }
  if (event.status === "completed") {
    return "Completed";
  }
  if (event.status === "active") {
    return "Ongoing";
  }
  if (event.status === "upcoming") {
    return "Upcoming";
  }
  if (event.status === "cancelled") {
    return "Cancelled";
  }
  return "Unknown";
}

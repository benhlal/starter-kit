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
  // If there are no coins, treat as all collected
  if (coins && coins.length === 0) {
    return true;
  }
  return false;
}

export function isEventJoinable(event: Event, coins?: Coin[]): boolean {
  // Not joinable if completed or all coins collected
  if (event.status === "completed" || isEventAllCoinsCollected(event, coins)) {
    return false;
  }
  // Not joinable if no coins
  if (coins && coins.length === 0) return false;
  return true;
}

export function getEventStatusLabel(event: Event, coins?: Coin[]): string {
  if (isEventAllCoinsCollected(event, coins)) return "All coins collected";
  if (event.status === "completed") return "Completed";
  if (event.status === "active") return "Ongoing";
  if (event.status === "upcoming") return "Upcoming";
  if (event.status === "cancelled") return "Cancelled";
  return "Unknown";
}

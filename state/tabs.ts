// state/tabs.ts
import { atom } from "recoil";

export type Tab = "Home" | "Profile" | "Account" | "Map" | "EVENTS" | "Search";

export const activeTabState = atom<Tab>({
  key: "activeTab", // unique ID
  default: "Home", // initial tab
});

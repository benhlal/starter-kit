export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface EventLocation {
  id: string;
  title: string;
  description: string;
  coordinate: Coordinate;
  coins: number;
}

export interface Event {
  id: string;
  name: string;
  balance: string;
  subscribers: string;
  distance: string;
  img: string;
  coordinate: Coordinate;
}

export interface Coin {
  id: string;
  coordinate: Coordinate;
  value: number;
}

export interface FocusLocation {
  latitude: number;
  longitude: number;
  title: string;
}

export type TabName = "Home" | "Account";

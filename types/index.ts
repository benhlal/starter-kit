// Legacy coordinate interface (keeping for backward compatibility)
export interface Coordinate {
  latitude: number;
  longitude: number;
}

// Legacy types (keeping for backward compatibility)
export interface FocusLocation {
  latitude: number;
  longitude: number;
  title: string;
}

export type TabName = "Home" | "Account";

// User types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  level: number;
  totalCoins: number;
  joinedEvents: string[];
  collectedCoins: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  preferences: {
    notifications: boolean;
    theme: "light" | "dark" | "auto";
    language: string;
  };
  stats: {
    eventsJoined: number;
    coinsCollected: number;
    totalDistance: number;
    daysActive: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Event types
export interface Event {
  id: string;
  title: string;
  name?: string; // Legacy support
  description: string;
  type: EventType;
  status: EventStatus;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    venue?: string;
  };
  coordinate?: Coordinate; // Legacy support
  startDate: string;
  endDate: string;
  maxParticipants?: number;
  currentParticipants: number;
  participants: string[]; // User IDs
  organizer: {
    id: string;
    name: string;
  };
  tags: string[];
  image?: string;
  img?: string; // Legacy support
  arContent?: {
    model: string;
    animations?: string[];
    textures?: string[];
  };
  rewards: {
    coins: number;
    experience: number;
    badges?: string[];
  };
  requirements?: {
    minLevel?: number;
    items?: string[];
  };
  visibility: "public" | "private" | "friends";
  // AR Coin Hunt specific fields
  huntDetails?: {
    difficulty: "Easy" | "Medium" | "Hard";
    terrain:
      | "Urban"
      | "Forest"
      | "Beach"
      | "Mountain"
      | "Desert"
      | "Park"
      | "Historical";
    range: number; // in kilometers
    totalPrizePool?: number;
    huntType?: "Flash Hunt" | "Adventure Hunt" | "Epic Journey Hunt";
  };
  // Legacy fields (also support flat terrain/difficulty for backward compatibility)
  terrain?: string;
  difficulty?: string;
  balance?: string;
  subscribers?: string;
  distance?: string;
  createdAt: string;
  updatedAt: string;
}

export type EventType =
  | "treasure-hunt"
  | "ar-experience"
  | "community-event"
  | "challenge"
  | "exhibition"
  | "workshop"
  | "social";

export type EventStatus = "upcoming" | "active" | "completed" | "cancelled";

// Event location types
export interface EventLocation {
  id: string;
  eventId?: string;
  name?: string;
  title?: string; // Legacy support
  description?: string;
  location: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  coordinate?: Coordinate; // Legacy support
  type: LocationType;
  radius: number; // in meters
  arMarkers?: ARMarker[];
  interactionType: InteractionType;
  rewards?: {
    coins: number;
    experience: number;
    items?: string[];
  };
  requirements?: {
    items?: string[];
    level?: number;
  };
  isActive: boolean;
  visitedBy: string[]; // User IDs
  coins?: number; // Legacy support
  createdAt: string;
  updatedAt: string;
}

export type LocationType =
  | "checkpoint"
  | "treasure"
  | "challenge"
  | "information"
  | "ar-portal"
  | "social-hub";

export type InteractionType =
  | "tap"
  | "ar-scan"
  | "long-press"
  | "proximity"
  | "gesture";

// AR Marker types
export interface ARMarker {
  id: string;
  type: "image" | "object" | "plane" | "face";
  content: {
    model?: string;
    texture?: string;
    animation?: string;
    scale?: number;
  };
  trigger: {
    image?: string;
    distance?: number;
    angle?: number;
  };
}

// Coin types
export interface Coin {
  id: string;
  name?: string;
  description?: string;
  value: number;
  type: CoinType;
  rarity: CoinRarity;
  eventId?: string; // Event this coin belongs to
  createdBy?: string; // User ID who placed/created the coin
  location: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  coordinate?: Coordinate; // Legacy support
  region: string;
  collectible: boolean;
  collected: boolean;
  collectedBy?: string; // User ID
  collectedAt?: string;
  image?: string;
  arModel?: string;
  effects?: {
    sound?: string;
    particle?: string;
    animation?: string;
  };
  spawnsAt?: string; // ISO date when coin becomes available
  expiresAt?: string; // ISO date when coin expires
  requirements?: {
    level?: number;
    items?: string[];
    events?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export type CoinType =
  | "standard"
  | "premium"
  | "event"
  | "seasonal"
  | "rare"
  | "legendary";

export type CoinRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

// App state types
export interface AppState {
  useMockData: boolean;
  isOffline: boolean;
  theme: "light" | "dark" | "auto";
  language: string;
  mapStyle: "standard" | "satellite" | "hybrid";
  arEnabled: boolean;
  locationPermission: boolean;
  cameraPermission: boolean;
  debugMode: boolean;
}

// Loading state types
export interface LoadingState {
  events: boolean;
  profile: boolean;
  coins: boolean;
  eventLocations: boolean;
  general: boolean;
}

// Error state types
export interface ErrorState {
  events: Error | null;
  profile: Error | null;
  coins: Error | null;
  eventLocations: Error | null;
  general: Error | null;
}

// Map types
export interface MapLocation {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

// Search types
export interface SearchFilters {
  eventTypes?: EventType[];
  dateRange?: {
    start: string;
    end: string;
  };
  distance?: {
    center: {
      latitude: number;
      longitude: number;
    };
    radius: number; // in kilometers
  };
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
  status?: EventStatus[];
}

// UI Filters specific to the Getaround-like filter bar
export type VehicleType =
  | "any"
  | "city"
  | "suv"
  | "van"
  | "electric"
  | "luxury";

export type PickupMethod = "any" | "meet-owner" | "connect";

export type FeatureKey =
  | "child-seat"
  | "gps"
  | "air-conditioning"
  | "bike-rack"
  | "roof-box"
  | "snow-tires"
  | "bluetooth";

export type EventStatusFilter = "any" | "ongoing" | "upcoming" | "completed";

export type TimePreset =
  | "anytime"
  | "today"
  | "tomorrow"
  | "this-week"
  | "next-week"
  | "this-month"
  | "custom";

export interface DateRange {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
}

export interface UiFilters {
  pickupAt?: string; // ISO
  returnAt?: string; // ISO
  // Status filter (replaces timeStatus)
  eventStatus: EventStatusFilter;
  // Time/Calendar filters
  timePreset: TimePreset;
  customDateRange?: DateRange;
  // Getaround-style filters repurposed
  vehicleType: VehicleType; // deprecated in UI (kept for backward-compat)
  pickupMethod: PickupMethod; // unchanged for now
  // New filters per spec
  subscribedOnly: boolean;
  participantsMin: number;
  newEventsOnly: boolean;
  cities: string[];
}

export interface SearchResult {
  events: Event[];
  coins: Coin[];
  locations: EventLocation[];
  totalResults: number;
  hasMore: boolean;
}

// Statistics types
export interface UserStats {
  eventsJoined: number;
  eventsCompleted: number;
  coinsCollected: number;
  totalCoins: number;
  level: number;
  experience: number;
  totalDistance: number;
  daysActive: number;
  achievements: Achievement[];
  rankings: {
    coins: number;
    events: number;
    level: number;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: "coins" | "events" | "distance" | "social" | "special";
  rarity: "bronze" | "silver" | "gold" | "platinum";
  progress: {
    current: number;
    target: number;
    percentage: number;
  };
  completed: boolean;
  completedAt?: string;
  rewards?: {
    coins: number;
    experience: number;
    title?: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Navigation types
export type RootStackParamList = {
  Home: undefined;
  Events: {
    eventId?: string;
    filters?: SearchFilters;
  };
  Map: {
    focusLocation?: MapLocation;
    showEvent?: string;
  };
  Profile: {
    userId?: string;
  };
  EventDetail: {
    eventId: string;
  };
  ARView: {
    eventId?: string;
    coinId?: string;
  };
};

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// AR Object types (persisted AR placements)
export interface ARObject {
  id: string;
  userId: string;
  type: "spawn" | "coin" | "custom";
  model?: string; // e.g., "coin"
  coinId?: string;
  eventId?: string;
  location: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  rotation?: {
    yaw?: number; // degrees
    pitch?: number; // degrees
    roll?: number; // degrees
  };
  scale?: number; // uniform scale
  active: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

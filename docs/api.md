# API Reference

## Overview

The AR Coin Hunt application uses Firebase Firestore as its primary backend with a service-oriented architecture. The API is organized into several key services that handle different aspects of the application.

## Core Services

### FirebaseService

Primary service for Firebase Firestore operations and real-time data synchronization.

#### Collections

| Collection       | Description                                |
| ---------------- | ------------------------------------------ |
| `events`         | Event definitions and metadata             |
| `coins`          | Individual coin instances and their states |
| `users`          | User profiles and participation data       |
| `eventLocations` | Geographic locations within events         |
| `arObjects`      | AR object placements and configurations    |
| `participations` | Event participation records                |
| `achievements`   | User achievements and rewards              |

### ParticipationService

Handles event participation logic, fee calculations, and user coin management.

## Data Models

### Event

```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    venue?: string;
  };
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
  rewards: {
    coins: number;
    experience: number;
    badges?: string[];
  };
  minCoins?: number;
  requirements?: {
    minLevel?: number;
    items?: string[];
  };
  visibility: "public" | "private" | "friends";
  huntDetails?: {
    coinsAvailable?: number;
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
  completedAt?: string;
  allCoinsCollected?: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Event Types:**

- `treasure-hunt`: Traditional coin hunting
- `ar-experience`: AR-focused experiences
- `community-event`: Social gatherings
- `challenge`: Competitive challenges
- `exhibition`: Display/showcase events
- `workshop`: Educational sessions
- `social`: Networking events

**Event Status:**

- `upcoming`: Event hasn't started yet
- `active`: Event is currently running
- `completed`: Event has finished
- `cancelled`: Event was cancelled

### Coin

```typescript
interface Coin {
  id: string;
  name?: string;
  description?: string;
  value: number;
  type: CoinType;
  rarity: CoinRarity;
  eventId?: string;
  createdBy?: string;
  location: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  region: string;
  collectible: boolean;
  collected: boolean;
  collectedBy?: string;
  collectedAt?: string;
  image?: string;
  arModel?: string;
  effects?: {
    sound?: string;
    particle?: string;
    animation?: string;
  };
  spawnsAt?: string;
  expiresAt?: string;
  requirements?: {
    level?: number;
    items?: string[];
    events?: string[];
  };
  createdAt: string;
  updatedAt: string;
}
```

**Coin Types:**

- `standard`: Regular collectible coins
- `premium`: Higher value coins
- `event`: Special event-specific coins
- `seasonal`: Time-limited seasonal coins
- `rare`: Limited availability coins
- `legendary`: Ultra-rare coins

**Coin Rarity:**

- `common`: Frequently available
- `uncommon`: Moderately rare
- `rare`: Hard to find
- `epic`: Very rare
- `legendary`: Extremely rare
- `mythic`: Ultra-rare legendary coins

### User Profile

```typescript
interface UserProfile {
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
```

## API Methods

### Events API

#### `FirebaseService.getEvents(): Promise<Event[]>`

Retrieves all events from the database, ordered by creation date (newest first).

**Returns:** Array of Event objects

#### `FirebaseService.getEventById(id: string): Promise<Event | null>`

Retrieves a specific event by its ID.

**Parameters:**

- `id`: Event ID string

**Returns:** Event object or null if not found

#### `FirebaseService.createEvent(event: Omit<Event, 'id'>): Promise<string>`

Creates a new event in the database.

**Parameters:**

- `event`: Event data without ID

**Returns:** Created event ID

#### `FirebaseService.updateEvent(eventId: string, updates: Partial<Event>): Promise<void>`

Updates an existing event.

**Parameters:**

- `eventId`: Event ID to update
- `updates`: Partial event data to update

#### `FirebaseService.deleteEvent(eventId: string): Promise<void>`

Deletes an event and all associated data (coins, participations).

**Parameters:**

- `eventId`: Event ID to delete

#### `FirebaseService.subscribeToEvents(callback: (events: Event[]) => void)`

Sets up real-time subscription to events collection.

**Parameters:**

- `callback`: Function called when events data changes

**Returns:** Unsubscribe function

### Coins API

#### `FirebaseService.getCoins(): Promise<Coin[]>`

Retrieves all coins from the database.

**Returns:** Array of Coin objects

#### `FirebaseService.getCoinById(id: string): Promise<Coin | null>`

Retrieves a specific coin by its ID.

**Parameters:**

- `id`: Coin ID string

**Returns:** Coin object or null if not found

#### `FirebaseService.getCoinsForEvent(eventId: string): Promise<Coin[]>`

Retrieves all collectible coins for a specific event.

**Parameters:**

- `eventId`: Event ID

**Returns:** Array of coins for the event

#### `FirebaseService.collectCoin(coinId: string, userId: string): Promise<void>`

Marks a coin as collected by a user.

**Parameters:**

- `coinId`: Coin to collect
- `userId`: User collecting the coin

#### `FirebaseService.subscribeToEventCoins(eventId: string, callback: (coins: Coin[]) => void)`

Sets up real-time subscription to coins for a specific event.

**Parameters:**

- `eventId`: Event ID to monitor
- `callback`: Function called when coin data changes

**Returns:** Unsubscribe function

### Participation API

#### `ParticipationService.participateInEvent(eventId: string, eventName: string, event: any, baseFee: number): Promise<{success: boolean, fee: number, message: string}>`

Allows a user to join an event with fee calculation.

**Parameters:**

- `eventId`: Event to join
- `eventName`: Event name for records
- `event`: Event object
- `baseFee`: Base participation fee

**Returns:** Participation result with success status, actual fee, and message

#### `ParticipationService.leaveEvent(eventId: string, event: any, hasCollectedCoins: boolean): Promise<{success: boolean, refund: number, message: string}>`

Allows a user to leave an event with refund calculation.

**Parameters:**

- `eventId`: Event to leave
- `event`: Event object
- `hasCollectedCoins`: Whether user collected coins

**Returns:** Leave result with success status, refund amount, and message

#### `ParticipationService.isUserParticipating(eventId: string): Promise<boolean>`

Checks if current user is participating in an event.

**Parameters:**

- `eventId`: Event to check

**Returns:** Boolean indicating participation status

#### `ParticipationService.getUserCoins(): Promise<number>`

Gets current user's coin balance.

**Returns:** User's current coin count

### User API

#### `FirebaseService.getUserProfile(userId: string): Promise<any>`

Retrieves a user's profile data.

**Parameters:**

- `userId`: User ID

**Returns:** User profile object

#### `FirebaseService.createUserProfile(userId: string, profile: any): Promise<void>`

Creates a new user profile.

**Parameters:**

- `userId`: User ID
- `profile`: Profile data

#### `FirebaseService.updateUserProfile(userId: string, updates: any): Promise<void>`

Updates user profile data.

**Parameters:**

- `userId`: User ID to update
- `updates`: Profile updates

#### `FirebaseService.subscribeToUserProfile(userId: string, callback: (profile: any) => void)`

Sets up real-time subscription to user profile changes.

**Parameters:**

- `userId`: User ID to monitor
- `callback`: Function called when profile changes

**Returns:** Unsubscribe function

## Utility Functions

### Event Status Utilities

#### `isEventJoinable(event: Event, coins?: Coin[]): boolean`

Determines if an event can be joined by users.

**Parameters:**

- `event`: Event to check
- `coins`: Optional coins array for the event

**Returns:** Boolean indicating if event is joinable

#### `isEventAllCoinsCollected(event: Event, coins?: Coin[]): boolean`

Checks if all coins in an event have been collected.

**Parameters:**

- `event`: Event to check
- `coins`: Optional coins array for the event

**Returns:** Boolean indicating if all coins are collected

#### `getEventStatusLabel(event: Event, coins?: Coin[]): string`

Gets a human-readable status label for an event.

**Parameters:**

- `event`: Event to get status for
- `coins`: Optional coins array for the event

**Returns:** Status label string

## Real-time Subscriptions

The application uses Firebase real-time listeners for live data synchronization:

### Event Subscriptions

```typescript
// Subscribe to all events
const unsubscribe = FirebaseService.subscribeToEvents((events) => {
  // Handle events update
  console.log("Events updated:", events);
});

// Later: unsubscribe()
unsubscribe();
```

### Coin Subscriptions

```typescript
// Subscribe to coins for specific event
const unsubscribe = FirebaseService.subscribeToEventCoins(eventId, (coins) => {
  // Handle coin updates
  console.log("Coins updated:", coins);
});

// Later: unsubscribe()
unsubscribe();
```

### User Profile Subscriptions

```typescript
// Subscribe to user profile changes
const unsubscribe = FirebaseService.subscribeToUserProfile(
  userId,
  (profile) => {
    // Handle profile update
    console.log("Profile updated:", profile);
  }
);

// Later: unsubscribe()
unsubscribe();
```

## Fee Calculation Logic

### Join Fees

- **Upcoming Events**: Base fee (typically 5 coins)
- **Ongoing Events**: Base fee + 10 coin late penalty
- **Completed Events**: Cannot join

### Leave Refunds

- **Before Start**: Full refund if >5 hours remaining
- **Before Start**: Partial refund if <5 hours (penalty: 2 coins/hour)
- **After Start**: No refund unless coins collected
- **Coins Collected**: Full refund + keep collected coins

## Error Handling

All API methods include comprehensive error handling:

```typescript
try {
  const events = await FirebaseService.getEvents();
  // Handle success
} catch (error) {
  console.error("Error fetching events:", error);
  // Handle error (show user message, retry, etc.)
}
```

## Data Validation

The FirebaseService includes automatic data validation and sanitization:

- **Undefined Values**: Automatically stripped from Firestore writes
- **Location Validation**: Default Paris coordinates for invalid locations
- **Type Safety**: TypeScript interfaces ensure data structure compliance
- **Timestamp Handling**: Automatic server timestamp management

## Performance Optimizations

### Query Optimization

- Indexed queries for efficient data retrieval
- Pagination support for large datasets
- Real-time listener management to prevent memory leaks

### Batch Operations

- Firestore batch writes for atomic operations
- Chunked deletions for large datasets (400 items per batch)
- Efficient bulk operations for data migration

### Caching Strategy

- Real-time subscriptions for live data
- Local state management with Recoil
- Offline capability for critical features

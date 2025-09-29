# Refactored Project Structure

This project has been refactored to improve maintainability and reusability by organizing components and screens into folders with their respective stylesheets.

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── BottomNav/       # Navigation bottom bar
│   │   ├── BottomNav.tsx
│   │   ├── BottomNav.styles.ts
│   │   └── index.ts
│   ├── EventItem/       # Individual event card component
│   │   ├── EventItem.tsx
│   │   ├── EventItem.styles.ts
│   │   └── index.ts
│   ├── EventList/       # List of events
│   │   ├── EventList.tsx
│   │   ├── EventList.styles.ts
│   │   └── index.ts
│   ├── FloatingButton/  # Reusable floating action button
│   │   ├── FloatingButton.tsx
│   │   ├── FloatingButton.styles.ts
│   │   └── index.ts
│   ├── MapControls/     # Map zoom and reset controls
│   │   ├── MapControls.tsx
│   │   ├── MapControls.styles.ts
│   │   └── index.ts
│   ├── MapMarker/       # Map marker components
│   │   ├── MapMarker.tsx
│   │   ├── MapMarker.styles.ts
│   │   └── index.ts
│   └── MarkerInfo/      # Selected marker information panel
│       ├── MarkerInfo.tsx
│       ├── MarkerInfo.styles.ts
│       └── index.ts
├── screens/             # Screen components
│   ├── EventScreen/     # Events list screen
│   │   ├── EventScreen.tsx
│   │   ├── EventScreen.styles.ts
│   │   └── index.ts
│   ├── HomeScreen/      # Main container screen
│   │   ├── HomeScreen.tsx
│   │   ├── HomeScreen.styles.ts
│   │   └── index.ts
│   ├── MapScreen/       # Map view screen
│   │   ├── MapScreen.tsx
│   │   ├── MapScreen.styles.ts
│   │   └── index.ts
│   └── ProfileScreen/   # User profile screen
│       ├── ProfileScreen.tsx
│       ├── ProfileScreen.styles.ts
│       └── index.ts
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions and constants
│   ├── constants.ts     # App constants and data
│   └── mapUtils.ts      # Map-related utilities
└── index.ts             # Main export file
```

## Key Improvements

### 1. Component Organization

- Each component has its own folder with:
  - Component file (`.tsx`)
  - Styles file (`.styles.ts`)
  - Index file for clean imports

### 2. Reusable Components

- **EventItem**: Individual event card with "View on Map" functionality
- **EventList**: Manages list of events and handles rendering
- **FloatingButton**: Reusable floating action button
- **MapMarker**: Separate components for event markers and coin markers
- **MapControls**: Zoom and reset controls for the map
- **MarkerInfo**: Information panel for selected markers

### 3. Type Safety

- Comprehensive TypeScript interfaces in `types/index.ts`
- Proper typing for all components and functions
- Better IDE support and error detection

### 4. Utility Functions

- **mapUtils.ts**: Map-related functions like coin generation and map styling
- **constants.ts**: Centralized data management for events and locations

### 5. Clean Imports

- Index files in each folder for clean component imports
- Main `src/index.ts` file exports everything needed

## Benefits

1. **Better Maintainability**: Each component is self-contained with its styles
2. **Improved Reusability**: Components are modular and can be easily reused
3. **Type Safety**: Better TypeScript support throughout the application
4. **Easier Testing**: Components can be tested individually
5. **Better Developer Experience**: Clear folder structure and clean imports
6. **Scalability**: Easy to add new components following the same pattern

## Usage

Import components from the main src folder:

```typescript
import { EventScreen, MapScreen, EventItem } from "./src";
```

Or import directly from component folders:

```typescript
import EventItem from "./src/components/EventItem";
import { EventMarker, CoinMarker } from "./src/components/MapMarker";
```

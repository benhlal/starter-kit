# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2025-10-01

### 🎯 Major Features

#### Comprehensive Location & Time Filtering System

- **Location Filter Modal** with multiple options:
  - "Anywhere" - Global event discovery (default)
  - "Current Location" - GPS-based filtering with permission handling
  - "Choose on Map" - Interactive pin placement for custom locations
  - Predefined city options (Paris, London, New York, Tokyo, etc.)
  - Dynamic custom location support

#### Advanced Time & Status Filtering

- **Status Filter Modal** with event lifecycle options:

  - Any Status (show all events)
  - Ongoing (currently active events)
  - Upcoming (future events)
  - Completed (past events)

- **Time Filter Modal** with flexible scheduling:
  - Preset options: Anytime, Today, Tomorrow, This Week, Next Week, This Month
  - **Custom Date Range Picker** for precise period selection
  - Smart label generation showing active filter selections

### 🗺️ Enhanced Map Integration

#### Interactive Location Selection

- **GPS Location Button**: Automatic location permission handling and map centering
- **Pin Placement Mode**: "Choose on Map" enables interactive location selection
- **Progressive Distance Rings**: Visual 1km, 2km, 3km radius indicators (yellow, dotted)
- **Reduced Camera Focus**: 20% less aggressive focus transitions for better UX
- **Exclusive Ring Behavior**: Only show rings for selected location type

#### Map Controls & Visual Improvements

- **Location Permission Flow**: Proper Android/iOS permission handling with settings fallback
- **Ring Animation**: Beat animation for live GPS location indicator
- **Smart Pin Management**: Automatic cleanup of old pins when placing new ones
- **Location Sync**: Filter selections properly sync with map interactions

### 🏗️ Architecture & State Management

#### Enhanced Recoil State System

- **New `locationFilterState`**: Manages location selection and available options
- **Enhanced `uiFiltersState`**: Added `eventStatus`, `timePreset`, `customDateRange` fields
- **New Hook `useTimeFilter()`**: Centralized time/status filter management
- **Improved `useLocationFilter()`**: Enhanced location handling with map integration

#### Type Safety & Performance

- **New TypeScript Interfaces**:
  - `EventStatusFilter`: "any" | "ongoing" | "upcoming" | "completed"
  - `TimePreset`: "anytime" | "today" | "tomorrow" | "this-week" | "next-week" | "this-month" | "custom"
  - `DateRange`: { startDate: string; endDate: string }
- **Optimized useMemo Dependencies**: Improved filtering performance
- **Smart Event Filtering**: Combined location, status, and time-based filtering

### 🎨 UI/UX Improvements

#### Filter Interface Redesign

- **Updated Filter Chips**: "Status" filter replaces old "Time" filter
- **Dynamic Labels**: Real-time filter state display in UI
- **Visual Status Indicators**: Icons and descriptions for all filter options
- **Consistent Modal Design**: Unified FilterModal base component

#### Enhanced User Experience

- **Intuitive Icons**: 🌍 Anywhere, 📍 Current Location, 🗺️ Choose on Map
- **Smart Defaults**: Sensible default selections for quick start
- **Accessible Design**: Proper color contrast and touch targets
- **Responsive Layout**: Optimized for various screen sizes

### 🔧 Technical Improvements

#### Code Quality & Maintenance

- **ESLint Compliance**: Full codebase formatting and linting
- **Removed Deprecated Code**: Cleaned up old VehicleTypeModal and BottomSheet time picker
- **Modular Components**: Separated concerns with reusable modal components
- **Error Handling**: Proper timeout and permission error handling

#### Performance Optimizations

- **Reduced Re-renders**: Optimized dependency arrays and state updates
- **Memory Management**: Proper cleanup of old event listeners and timers
- **Bundle Size**: Removed unused components and imports

### 🐛 Bug Fixes

#### Location & Map Issues

- **GPS Timeout Handling**: Disabled high accuracy GPS to prevent timeouts
- **Location Permission**: Fixed Android permission flow with settings redirect
- **Map Marker Conflicts**: Resolved flickering and duplicate marker issues
- **Ring Positioning**: Fixed exclusive ring display for different location types

#### Filter & UI Fixes

- **Event Property Names**: Fixed `startDate`/`endDate` vs `startTime`/`endTime` consistency
- **Filter Dependencies**: Corrected React Hook dependency arrays
- **Label Synchronization**: Fixed when label updates with filter changes
- **Type Safety**: Resolved TypeScript errors across filter components

### 🗑️ Removed

#### Deprecated Components

- **VehicleTypeModal**: Replaced with StatusFilterModal
- **BottomSheet Time Picker**: Replaced with dedicated TimeFilterModal
- **Old Time Status Logic**: Removed legacy filtering approach
- **Unused State Variables**: Cleaned up obsolete filter state

### 📝 Documentation

#### Updated Documentation

- **CHANGELOG.md**: Comprehensive change tracking
- **README.md**: Updated with new filtering features
- **Component Documentation**: Inline JSDoc for filter components
- **Type Definitions**: Complete TypeScript interface documentation

## [2.0.x] - Previous Releases

### [2.0.3] - 2025-09-28

- Android GPS/Auth alignment with Google Play Services
- Custom user location marker implementation
- Added @react-native-community/geolocation

### [2.0.2] - 2025-09-27

- Google Play Services version alignment
- Fixed AirMap showsUserLocation crashes
- Enhanced authentication flow

### [2.0.1] - 2025-09-26

- Filters overhaul with city-based filtering
- Time category filtering implementation
- UI improvements and label updates

### [2.0.0] - 2025-09-25

- Major UI redesign with BottomSheet components
- Enhanced event participation flow
- Comprehensive event status management
- Active filter highlighting system

---

## Migration Guide

### From v2.0.x to v2.1.0

#### State Management Changes

```typescript
// Old approach
const filters = useRecoilValue(uiFiltersState);
if (filters.timeStatus) {
  /* ... */
}

// New approach
const { eventStatus, timePreset, customDateRange } = useTimeFilter();
if (eventStatus !== "any") {
  /* ... */
}
```

#### Component Updates

```typescript
// Old VehicleTypeModal
<VehicleTypeModal
  visible={vehicleOpen}
  timeValue={filters.timeStatus}
  onSelectTime={setTimeStatus}
/>

// New StatusFilterModal
<StatusFilterModal
  visible={statusOpen}
  value={eventStatus}
  onSelect={setEventStatus}
/>
```

#### Filter Logic Changes

```typescript
// Old filtering
const filteredEvents = events.filter((e) => {
  if (filters.timeStatus === "ongoing") {
    return isEventOngoing(e);
  }
});

// New filtering
const filteredEvents = events.filter((e) => {
  if (eventStatus === "ongoing") {
    const now = new Date();
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    return start <= now && now <= end;
  }
});
```

### Breaking Changes

- `VehicleTypeModal` component removed - use `StatusFilterModal`
- `timeStatus` filter replaced with `eventStatus`
- Event time properties now use `startDate`/`endDate` consistently
- Filter state structure updated - migrate existing filter logic

### New Features Available

- Location-based filtering with GPS integration
- Custom date range picker for precise time filtering
- Interactive map location selection
- Enhanced visual feedback for active filters

For detailed migration assistance, see the [Migration Guide](./docs/MIGRATION.md).

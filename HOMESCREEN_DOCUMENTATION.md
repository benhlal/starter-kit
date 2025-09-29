# HomeScreen Documentation

## Overview

The `HomeScreen` is the main container component that manages the entire application navigation and screen rendering. It handles the complex navigation flow between the Events list, Map view, and Profile screen while providing smooth transitions without screen flashing.

## Architecture

### Component Structure

```
HomeScreen (Main Container)
├── BottomNav (Navigation Bar)
├── EventScreen (Home Tab)
├── MapScreen (Overlay)
└── ProfileScreen (Account Tab)
```

### State Management

The HomeScreen manages several critical states:

1. **`activeTab`**: Controls which main screen is displayed ("Home" | "Account")
2. **`showMap`**: Controls map visibility with smooth animations
3. **`shouldRenderMap`**: Pre-renders map off-screen to prevent flash effect
4. **`focusLocation`**: Stores location data for map focusing

## Key Features

### 1. Flash-Free Map Transitions

The HomeScreen implements a sophisticated rendering strategy to eliminate map flash effects:

```tsx
// Pre-render map off-screen first
setShouldRenderMap(true);
setTimeout(() => {
  setShowMap(true); // Then show instantly
}, 100);
```

**How it works:**

- Map is pre-rendered off-screen (`opacity: 0, pointerEvents: "none"`)
- After 100ms delay for rendering, map appears instantly
- No visible flash or loading state

### 2. Dual-Screen Navigation

- **Bottom Navigation**: Switches between Home (Events) and Account (Profile)
- **Map Overlay**: Toggles on top of current screen with location focusing

### 3. Location-Aware Map Integration

When users tap "View on Map" from EventScreen:

1. Location coordinates are passed to `handleMapToggle`
2. Map pre-renders with focus location
3. Map appears centered on the selected event

## Component Interface

### Props

The HomeScreen is a root component and doesn't accept props.

### Internal Methods

#### `handleTabChange(tab: string)`

- Switches between main tabs (Home/Account)
- Automatically hides map when switching tabs
- Cleans up map state to prevent memory issues

#### `handleMapToggle(location?)`

- **Without location**: Toggles map visibility
- **With location**: Shows map focused on specific coordinates
- Implements pre-rendering strategy for smooth transitions

#### `renderCurrentScreen()`

- Renders appropriate screen based on `activeTab`
- Handles map overlay rendering and positioning
- Returns JSX for current active screen

## State Flow Diagram

```
User Action → State Update → Screen Rendering
     ↓              ↓              ↓
Tab Switch → activeTab → EventScreen/ProfileScreen
Map Toggle → showMap → Map Overlay
Event Tap → focusLocation → Focused Map
```

## Usage Examples

### Basic Navigation

Users can switch between tabs using the bottom navigation:

- **Home Tab**: Shows EventScreen with list of events
- **Account Tab**: Shows ProfileScreen with user information

### Map Integration

From the EventScreen, users can:

1. Tap floating "📍 Map" button → Shows full map
2. Tap "View on Map" on specific event → Shows map focused on that event
3. Tap back from map → Returns to previous screen

## Technical Implementation

### Rendering Strategy

```tsx
{
  shouldRenderMap && (
    <View
      style={[
        styles.mapOverlay,
        {
          opacity: showMap ? 1 : 0,
          pointerEvents: showMap ? "auto" : "none",
        },
      ]}
    >
      <MapScreen setActiveTab={handleMapToggle} focusLocation={focusLocation} />
    </View>
  );
}
```

### Timing Control

- **Map Pre-render**: 100ms delay before showing
- **Map Hide**: 50ms delay before unmounting
- **State Cleanup**: Automatic cleanup on tab switches

## Styles

### Layout Structure

- **Container**: Full screen with dark background (#121212)
- **Content**: Flexible area for screen rendering
- **Map Overlay**: Absolute positioned overlay covering entire screen

### Z-Index Management

- Map overlay uses `zIndex: 10` to appear above other content
- Bottom navigation remains accessible during map viewing

## Performance Considerations

### Memory Management

- Map is only rendered when needed (`shouldRenderMap`)
- Map state is cleared when switching tabs
- Focus location is reset after hiding map

### Smooth Animations

- No traditional animations to prevent performance issues
- Uses opacity transitions for instant visibility changes
- Pre-rendering eliminates loading states

## Dependencies

- `React` - Component framework
- `React Native` - View, StyleSheet for UI components
- `EventScreen` - Events list screen
- `MapScreen` - Map view with AR features
- `ProfileScreen` - User profile screen
- `BottomNav` - Navigation component

## Future Enhancements

1. **Animation Improvements**: Could add subtle fade transitions
2. **State Persistence**: Remember last viewed location
3. **Deep Linking**: Support direct navigation to map with coordinates
4. **Performance Optimization**: Lazy loading for heavy components

## Error Handling

The component handles edge cases:

- Undefined location coordinates
- Tab switching during map transitions
- Cleanup of timeouts and state on unmount

This HomeScreen architecture provides a robust foundation for the AR mobile application with smooth navigation and optimal user experience.

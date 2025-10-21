# System Architecture

## Technology Stack

### Core Framework

- **React Native 0.72+**: Cross-platform mobile development
- **TypeScript 4.8+**: Type-safe JavaScript development
- **ViroReact**: AR rendering and scene management

### State Management

- **Recoil**: Predictable state management with atoms and selectors
- **React Context**: Local component state management

### Backend & Data

- **Firebase Firestore**: NoSQL cloud database
- **Firebase Authentication**: User authentication and authorization
- **Firebase Cloud Functions**: Serverless backend logic (future)

### Development Tools

- **Metro**: React Native bundler
- **Gradle**: Android build system
- **CocoaPods**: iOS dependency management
- **Jest**: Unit testing framework
- **ESLint + Prettier**: Code quality and formatting

### AR & Location

- **ViroReact**: AR scene rendering
- **react-native-compass-heading**: Device compass integration
- **@viro-community/react-viro**: Community AR components
- **react-native-ar-gps**: Custom GPS AR positioning

## System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Firebase      │    │   External      │
│   (React Native)│◄──►│   Firestore     │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AR Engine     │    │   Data Models   │    │   GPS Services  │
│   (ViroReact)   │    │   (TypeScript)  │    │   (Native)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Architecture

### Screen Components (`screens/`)

```
screens/
├── AR/
│   ├── ARScreen.tsx          # Main AR gameplay screen
│   └── ARCoinHuntScreen.tsx  # Coin hunting interface
├── Auth/
│   └── ...                   # Authentication screens
├── Events/
│   ├── EventScreen.tsx       # Event listing and filtering
│   ├── EventDetailsScreen.tsx # Event details and participation
│   └── ...                   # Event-related screens
├── Home/
│   └── ...                   # Home screen components
├── Map/
│   └── ...                   # Map-based screens
└── Profile/
    └── ...                   # User profile screens
```

### Shared Components (`components/`)

```
components/
├── AR/
│   ├── ARCameraView.tsx      # AR camera interface
│   └── Common/
│       ├── ARCamera.tsx      # Camera controls
│       └── ARCameraSimple.tsx # Simplified camera
├── Events/
│   ├── CreateEventModal/     # Event creation
│   ├── EventItem/           # Event list items
│   ├── EventList/           # Event listing components
│   └── ParticipationModal/  # Join/leave events
├── Filters/
│   ├── FloatingFilters/     # Filter UI components
│   ├── Modal/              # Modal filter interfaces
│   ├── Sheet/              # Bottom sheet filters
│   └── TopSearch/          # Search functionality
├── Home/
│   ├── BottomNav/          # Navigation component
│   └── FloatingButton/     # Action buttons
├── Map/
│   └── MapControls/        # Map interaction controls
└── Migration/
    └── ...                 # Data migration components
```

### State Management (`state/`)

```
state/
├── tabs.ts                  # Navigation state
└── recoil/
    ├── atoms.ts            # Global state atoms
    ├── selectors.ts        # Computed state selectors
    └── ...                 # State management files
```

### Services (`services/`)

```
services/
├── ParticipationService.ts  # Event participation logic
├── firebase/               # Firebase service wrappers
│   └── ...                 # Firestore operations
└── mocks/
    └── MockService.ts      # Development mocks
```

### Utilities (`utils/`)

```
utils/
├── constants.ts            # Application constants
├── eventStatus.ts          # Event status utilities
├── mapUtils.ts             # Map-related utilities
├── dataMigration.ts        # Data migration helpers
├── populateEvents.ts       # Event seeding utilities
└── userRoles.ts            # User role definitions
```

## Data Flow Architecture

### State Flow

```
User Interaction → Component → Recoil Action → Firebase → State Update → UI Re-render
```

### AR Data Flow

```
GPS Update → Kalman Filter → Position Calculation → ViroReact Scene → AR Rendering
```

### Event Data Flow

```
Event Creation → Firestore Write → Real-time Sync → Recoil State → Component Update
```

## Firebase Integration

### Firestore Collections

```
users/                      # User profiles and preferences
├── {userId}/
│   ├── profile             # User profile data
│   └── events              # User's joined events

events/                     # Event definitions
├── {eventId}/
│   ├── details             # Event metadata
│   ├── participants        # Participant list
│   └── coins               # Coin placements

coins/                      # Individual coin instances
├── {coinId}/
│   ├── location            # GPS coordinates
│   ├── status              # Collected/available
│   └── metadata            # Coin properties
```

### Real-time Subscriptions

- Event status updates
- Participant changes
- Coin collection notifications
- User profile synchronization

## AR Architecture

### ViroReact Integration

```
ARScreen Component
├── ViroARSceneNavigator
│   ├── ARScene
│   │   ├── ViroARScene
│   │   ├── ViroARCamera
│   │   ├── ViroAmbientLight
│   │   └── Coin Objects (Viro3DObject)
│   └── GPS Positioning System
```

### GPS Processing Pipeline

```
Raw GPS Data → Kalman Filter → Accuracy Validation → Coordinate Transformation → AR World Positioning
```

## Build Architecture

### Android Build

```
React Native Code → Metro Bundler → Gradle Build → APK Generation
├── JavaScript Bundle
├── Native Android Code
├── Dependencies (ViroReact, Firebase)
└── Resources (Assets, Manifest)
```

### iOS Build

```
React Native Code → Metro Bundler → Xcode Build → IPA Generation
├── JavaScript Bundle
├── Native iOS Code
├── CocoaPods Dependencies
└── Resources (Assets, Plist)
```

## Performance Considerations

### Memory Management

- Component unmounting and cleanup
- Image asset optimization
- Firebase listener management
- AR scene resource management

### Battery Optimization

- GPS update frequency management
- Background process minimization
- Location accuracy balancing
- AR rendering optimization

### Network Efficiency

- Firebase data pagination
- Real-time listener optimization
- Offline data synchronization
- Image loading strategies

## Security Architecture

### Authentication

- Firebase Authentication integration
- Secure token management
- User session handling
- Permission-based access control

### Data Security

- Firestore security rules
- Data validation on client and server
- Secure API key management
- User data privacy protection

## Testing Architecture

### Unit Testing

- Jest for component testing
- Mock services for Firebase
- Utility function testing
- State management testing

### Integration Testing

- AR functionality testing
- GPS integration testing
- Firebase operation testing
- Cross-platform compatibility

### E2E Testing

- User journey testing
- Event participation flows
- AR coin hunting scenarios
- Performance benchmarking

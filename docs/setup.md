# Setup & Installation

## Prerequisites

### System Requirements

- **Node.js**: 18.0.0 or higher
- **npm**: 8.0.0 or higher (comes with Node.js)
- **React Native CLI**: `npm install -g @react-native-community/cli`
- **Git**: For version control

### Android Development

- **Java Development Kit (JDK)**: Version 11 or 17
- **Android Studio**: Latest stable version with Android SDK
- **Android SDK**: API level 33+ (Android 13.0)
- **Android SDK Build-Tools**: Version 33.0.0+
- **Android Emulator**: Or physical Android device

### iOS Development (macOS only)

- **Xcode**: 14.0 or higher
- **iOS Simulator**: Included with Xcode
- **CocoaPods**: `sudo gem install cocoapods`
- **Physical iOS Device**: For testing (optional)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ar-coin-hunt
```

### 2. Install Dependencies

```bash
npm install
```

### 3. iOS Setup (macOS only)

```bash
cd ios
pod install
cd ..
```

### 4. Firebase Configuration

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Firestore Database
4. Enable Authentication

#### Configure Firebase in App

1. Copy your Firebase config from Project Settings
2. Update `firebaseConfig.ts` with your configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
};
```

#### Firestore Security Rules

Apply the following security rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Events are readable by all authenticated users
    match /events/{eventId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.organizerId;
    }

    // Coins can be read by event participants
    match /coins/{coinId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        exists(/databases/$(database)/documents/events/$(resource.data.eventId)/participants/$(request.auth.uid));
    }
  }
}
```

### 5. Environment Variables

Create a `.env` file in the root directory:

```env
# Firebase Configuration
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=your-app-id

# Development Settings
NODE_ENV=development
DEBUG=true

# Optional: Google Maps API Key (for enhanced mapping)
GOOGLE_MAPS_API_KEY=your-maps-api-key
```

## Running the Application

### Android Development

#### Using Android Emulator

```bash
# Start Metro bundler
npm start

# In another terminal, run Android
npm run android
```

#### Using Physical Device

1. Enable USB Debugging on your Android device
2. Connect device via USB
3. Run: `npm run android`

#### Build APK for Release

```bash
# Build release APK
npm run build:android

# Or use the task
npm run task android:assembleDebug
```

### iOS Development (macOS only)

#### Using iOS Simulator

```bash
# Start Metro bundler
npm start

# In another terminal, run iOS
npm run ios
```

#### Using Physical Device

1. Open `ios/ViroStarterKit.xcworkspace` in Xcode
2. Select your device
3. Build and run from Xcode

### Web Development (Limited Support)

```bash
npm run web
```

## Development Workflow

### Code Quality

```bash
# Run linting
npm run lint

# Format code
npm run format

# Type checking
npm run tsc-check
```

### Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building for Production

#### Android Production Build

```bash
# Clean and build release
npm run android:clean-build

# Generate signed APK
# Follow Android Studio signing process
```

#### iOS Production Build

```bash
# Open Xcode workspace
open ios/ViroStarterKit.xcworkspace

# Archive for App Store submission
# Product → Archive
```

## Troubleshooting Setup Issues

### Common Android Issues

#### Metro Bundler Issues

```bash
# Clear Metro cache
npm start -- --reset-cache

# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

#### Gradle Build Failures

```bash
# Clean Gradle cache
cd android
./gradlew clean
./gradlew cleanBuildCache

# Update Gradle wrapper
./gradlew wrapper --gradle-version 8.0.2
```

#### Device Connection Issues

```bash
# Check connected devices
adb devices

# Restart ADB
adb kill-server
adb start-server
```

### Common iOS Issues

#### CocoaPods Issues

```bash
# Clean and reinstall pods
cd ios
rm -rf Pods
rm Podfile.lock
pod install
```

#### Xcode Build Issues

- Clean build folder: `Product → Clean Build Folder`
- Reset package caches: `File → Packages → Reset Package Caches`
- Update Xcode command line tools

### Firebase Issues

#### Authentication Problems

- Verify Firebase config in `firebaseConfig.ts`
- Check Firebase Console authentication settings
- Ensure correct SHA-1 fingerprint for Android

#### Firestore Permission Errors

- Review Firestore security rules
- Check Firebase project permissions
- Verify authentication state

### AR-Specific Issues

#### ViroReact Not Working

- Ensure device supports AR (Android API 24+, iOS 11+)
- Check AR permissions in app settings
- Verify ViroReact license (if applicable)

#### GPS Accuracy Problems

- Grant location permissions
- Test outdoors with clear sky view
- Check GPS settings on device

## Development Tools Setup

### VS Code Extensions

- React Native Tools
- TypeScript Importer
- Prettier
- ESLint
- Firebase

### Android Studio Configuration

- Install Android SDK components
- Configure emulator with Play Store
- Enable HAXM for better performance

### Xcode Configuration

- Install additional simulator runtimes
- Configure developer account for device testing
- Enable developer mode on physical devices

## Environment-Specific Configurations

### Development Environment

```bash
# Enable debug mode
export DEBUG=true

# Use local Firebase emulators (optional)
firebase emulators:start
```

### Staging Environment

- Use separate Firebase project
- Configure staging-specific environment variables
- Enable additional logging

### Production Environment

- Use production Firebase project
- Disable debug features
- Configure proper error reporting
- Set up crash analytics

## Performance Optimization

### Development Performance

```bash
# Enable Fast Refresh
# Already enabled by default in React Native

# Use Hermes engine for Android
# Enabled in android/app/build.gradle
```

### Build Performance

```bash
# Enable Gradle daemon
echo "org.gradle.daemon=true" >> ~/.gradle/gradle.properties

# Increase memory for builds
export GRADLE_OPTS="-Xmx4096m -XX:MaxPermSize=2048m"
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm ci
      - run: npm run tsc-check
      - run: npm test
```

This setup provides a complete development environment for the AR Coin Hunt application with comprehensive error handling and optimization strategies.

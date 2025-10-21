# Troubleshooting

## Common Issues and Solutions

### Build and Development Issues

#### Metro Bundler Issues

**Problem:** Metro bundler fails to start or crashes

```
Error: Metro bundler process exited
```

**Solutions:**

1. Clear Metro cache:

   ```bash
   npm start -- --reset-cache
   ```

2. Clear node_modules and reinstall:

   ```bash
   rm -rf node_modules
   npm install
   ```

3. Check for port conflicts (default port 8081):

   ```bash
   lsof -i :8081
   kill -9 <process-id>
   ```

4. Reset watchman (if installed):
   ```bash
   watchman watch-del-all
   ```

#### Gradle Build Failures

**Problem:** Android build fails with Gradle errors

```
> Task :app:mergeDebugResources FAILED
```

**Solutions:**

1. Clean Gradle cache:

   ```bash
   cd android
   ./gradlew clean
   ./gradlew cleanBuildCache
   ```

2. Update Gradle wrapper:

   ```bash
   ./gradlew wrapper --gradle-version 8.0.2
   ```

3. Clear Android build cache:

   ```bash
   rm -rf android/.gradle
   rm -rf android/build
   rm -rf android/app/build
   ```

4. Check Android SDK versions in `android/build.gradle`

#### iOS Build Issues

**Problem:** CocoaPods installation fails

```
[!] Unable to find a specification for `React-Core`
```

**Solutions:**

1. Clean and reinstall pods:

   ```bash
   cd ios
   rm -rf Pods
   rm Podfile.lock
   pod install --repo-update
   ```

2. Update CocoaPods:

   ```bash
   sudo gem install cocoapods
   ```

3. Clear Xcode derived data:
   ```
   Xcode → Preferences → Locations → Derived Data → Delete
   ```

#### TypeScript Compilation Errors

**Problem:** TypeScript errors preventing build

```
error TS2304: Cannot find name 'SomeType'
```

**Solutions:**

1. Check import statements and file paths
2. Verify type definitions in `types/index.ts`
3. Run type checking:

   ```bash
   npm run tsc-check
   ```

4. Clear TypeScript cache if using VS Code

### Runtime Issues

#### AR Functionality Not Working

**Problem:** AR camera doesn't start or shows black screen

**Solutions:**

1. **Permissions Check:**

   - Ensure camera permission granted in device settings
   - Check location permissions for GPS AR
   - Verify AR permissions on iOS

2. **Device Compatibility:**

   - AR requires Android API 24+ or iOS 11+
   - Check device AR support in settings
   - Some Android devices need Google Play Services AR

3. **ViroReact Issues:**
   - Verify ViroReact license key (if required)
   - Check ViroReact version compatibility
   - Clear app data and reinstall

#### GPS Accuracy Problems

**Problem:** GPS positioning is inaccurate or not updating

**Solutions:**

1. **Location Settings:**

   - Enable high accuracy mode in device settings
   - Ensure GPS satellites are available (outdoor location)
   - Check for GPS signal interference

2. **Permission Issues:**

   - Grant precise location permission
   - Allow location access in background (Android)

3. **Kalman Filtering:**
   - Verify Kalman filter implementation in GPS utils
   - Check filter parameters for your use case
   - Monitor GPS accuracy values in debug mode

#### Firebase Connection Issues

**Problem:** Cannot connect to Firebase or data not syncing

**Solutions:**

1. **Configuration Check:**

   - Verify Firebase config in `firebaseConfig.ts`
   - Check API keys and project IDs
   - Ensure correct Firestore security rules

2. **Network Issues:**

   - Check internet connection
   - Verify Firebase project is active
   - Check for firewall blocking Firebase ports

3. **Authentication:**
   - Ensure user is properly authenticated
   - Check Firebase Authentication settings
   - Verify user has necessary permissions

### Event and Participation Issues

#### Events Not Showing

**Problem:** Event list is empty or events not displaying

**Solutions:**

1. **Filter Settings:**

   - Check if `subscribedOnly` filter is enabled
   - Verify event status filters (upcoming/ongoing)
   - Clear all filters and try again

2. **Data Loading:**

   - Check Firebase connection and permissions
   - Verify events exist in Firestore
   - Check for real-time subscription errors

3. **Component State:**
   - Verify Recoil state is properly initialized
   - Check for errors in EventScreen component
   - Monitor network requests in debug mode

#### Cannot Join Events

**Problem:** Join button disabled or join fails

**Solutions:**

1. **Event Status:**

   - Check if event is completed or all coins collected
   - Verify event hasn't been cancelled
   - Check event timing (ongoing events should be joinable)

2. **User Balance:**

   - Ensure user has sufficient coins for join fee
   - Check coin balance in user profile
   - Verify fee calculation logic

3. **Participation Logic:**
   - Check if user is already participating
   - Verify event capacity limits
   - Check ParticipationService error messages

#### Coin Collection Not Working

**Problem:** Cannot collect coins in AR view

**Solutions:**

1. **Proximity Check:**

   - Ensure within collection distance (typically 5-10 meters)
   - Check GPS accuracy before attempting collection
   - Verify coin hasn't already been collected

2. **Permission Issues:**

   - Check location permissions for precise positioning
   - Ensure internet connection for Firebase updates
   - Verify user authentication status

3. **AR State:**
   - Check if AR scene is properly initialized
   - Verify ViroReact AR camera is active
   - Monitor AR session state in debug logs

### Performance Issues

#### App Running Slowly

**Problem:** App is laggy or unresponsive

**Solutions:**

1. **Memory Management:**

   - Clear app cache and restart
   - Monitor memory usage in Android Studio/XCode
   - Check for memory leaks in AR components

2. **GPS Optimization:**

   - Reduce GPS update frequency if not needed
   - Implement proper GPS filtering
   - Use background location sparingly

3. **AR Performance:**
   - Lower AR rendering quality on older devices
   - Reduce number of simultaneous AR objects
   - Implement AR object pooling

#### Battery Drain

**Problem:** App drains battery quickly

**Solutions:**

1. **GPS Settings:**

   - Use network location when GPS not needed
   - Implement smart GPS update intervals
   - Stop location updates when app in background

2. **AR Optimization:**

   - Disable AR when not in AR view
   - Reduce AR rendering frame rate
   - Implement AR session timeouts

3. **Background Processing:**
   - Minimize background Firebase listeners
   - Use efficient polling instead of constant sync
   - Implement proper app lifecycle management

### UI and Display Issues

#### Layout Problems

**Problem:** UI elements not displaying correctly

**Solutions:**

1. **Screen Density:**

   - Check device screen density and DPI
   - Verify responsive design implementation
   - Test on multiple device sizes

2. **Theme Issues:**

   - Check theme settings in user preferences
   - Verify dark/light mode compatibility
   - Clear theme cache if needed

3. **Component State:**
   - Check Recoil state for UI components
   - Verify component props and state
   - Monitor React component lifecycle

#### Navigation Issues

**Problem:** Screen navigation not working

**Solutions:**

1. **React Navigation:**

   - Check navigation container setup
   - Verify route definitions
   - Clear navigation state if corrupted

2. **Deep Linking:**
   - Verify deep link configuration
   - Check URL schemes on Android/iOS
   - Test deep links from external sources

### Data and Synchronization Issues

#### Offline Functionality

**Problem:** App doesn't work offline

**Solutions:**

1. **Offline Setup:**

   - Implement proper offline data caching
   - Queue operations for when online
   - Show offline indicators to user

2. **Sync Issues:**
   - Implement conflict resolution for data sync
   - Handle network reconnection gracefully
   - Verify offline data integrity

#### Data Corruption

**Problem:** User data appears corrupted

**Solutions:**

1. **Data Validation:**

   - Implement data validation on read/write
   - Add checksums for critical data
   - Regular data integrity checks

2. **Recovery:**
   - Implement data backup and restore
   - Clear corrupted local cache
   - Re-sync from Firebase

### Testing and Debugging

#### Unit Test Failures

**Problem:** Tests failing unexpectedly

**Solutions:**

1. **Test Setup:**

   - Check Jest configuration
   - Verify mock implementations
   - Update test snapshots if needed

2. **Async Testing:**
   - Implement proper async/await in tests
   - Use appropriate timeout values
   - Mock Firebase calls correctly

#### Debug Mode Issues

**Problem:** Debug features not working

**Solutions:**

1. **Debug Configuration:**

   - Enable debug mode in app settings
   - Check debug flags in development builds
   - Verify debug logging is enabled

2. **Remote Debugging:**
   - Set up proper remote debugging tools
   - Check network connectivity for remote debug
   - Use appropriate debugging ports

### Platform-Specific Issues

#### Android-Specific Problems

**Problem:** Issues only occurring on Android

**Solutions:**

1. **Android Manifest:**

   - Check permissions in AndroidManifest.xml
   - Verify intent filters and activities
   - Check build configurations

2. **Gradle Issues:**
   - Update Gradle and Android Gradle Plugin
   - Check SDK versions and compatibility
   - Verify native library dependencies

#### iOS-Specific Problems

**Problem:** Issues only occurring on iOS

**Solutions:**

1. **iOS Permissions:**

   - Check Info.plist for required permissions
   - Verify iOS-specific permission dialogs
   - Check App Store Connect configuration

2. **Xcode Issues:**
   - Update Xcode and iOS SDK
   - Check provisioning profiles
   - Verify code signing certificates

### Deployment Issues

#### App Store/Google Play Issues

**Problem:** App rejected or issues during submission

**Solutions:**

1. **App Store Guidelines:**

   - Check App Store Review Guidelines compliance
   - Verify privacy policy and terms of service
   - Ensure proper app descriptions and screenshots

2. **Technical Requirements:**
   - Verify minimum iOS/Android versions
   - Check for deprecated API usage
   - Implement proper crash reporting

#### Release Build Issues

**Problem:** Release build fails or crashes

**Solutions:**

1. **Build Configuration:**

   - Check release-specific configurations
   - Verify proguard rules (Android)
   - Check optimization settings

2. **Environment Variables:**
   - Ensure production environment variables
   - Check Firebase production configuration
   - Verify API endpoints for production

### Getting Help

If these solutions don't resolve your issue:

1. **Check Logs:**

   - Enable verbose logging in development
   - Check device logs (Android: logcat, iOS: Console)
   - Monitor Firebase console for errors

2. **Community Resources:**

   - Check GitHub issues for similar problems
   - Search React Native and Firebase documentation
   - Ask on Stack Overflow with relevant tags

3. **Professional Support:**

   - Contact Firebase support for backend issues
   - Reach out to ViroReact support for AR issues
   - Consult React Native experts for framework issues

4. **Debugging Tools:**
   - Use React Native Debugger
   - Implement proper error boundaries
   - Add comprehensive logging and monitoring

Remember to always test fixes thoroughly and implement proper error handling to prevent issues from affecting users.

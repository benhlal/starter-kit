import { NativeModules, Platform } from 'react-native';
const LINKING_ERROR = `The package 'react-native-ar-gps' doesn't seem to be linked. Make sure: \n\n` + Platform.select({
  ios: "- You have run 'cd ios && pod install'\n",
  default: ''
}) + '- You rebuilt the app after installing the package\n' + '- You are not using Expo Go\n';
const ARGPSModule = NativeModules.ARGPSNative ? NativeModules.ARGPSNative : new Proxy({}, {
  get() {
    throw new Error(LINKING_ERROR);
  }
});
export class ARGPS {
  sessionActive = false;
  worldOrigin = null;
  trackedObjects = new Map();
  static getInstance() {
    if (!ARGPS.instance) {
      ARGPS.instance = new ARGPS();
    }
    return ARGPS.instance;
  }

  /**
   * Initialize AR session with GPS origin anchoring
   */
  async startSession(config) {
    try {
      const result = await ARGPSModule.startSession(config);
      this.sessionActive = true;
      return result;
    } catch (error) {
      console.error('Failed to start AR session:', error);
      throw error;
    }
  }

  /**
   * Stop the AR session
   */
  async stopSession() {
    try {
      await ARGPSModule.stopSession();
      this.sessionActive = false;
      this.worldOrigin = null;
      this.trackedObjects.clear();
    } catch (error) {
      console.error('Failed to stop AR session:', error);
      throw error;
    }
  }

  /**
   * Set the world origin for GPS-to-AR coordinate conversion
   */
  async setWorldOrigin(position) {
    try {
      await ARGPSModule.setWorldOrigin(position);
      this.worldOrigin = position;
    } catch (error) {
      console.error('Failed to set world origin:', error);
      throw error;
    }
  }

  /**
   * Convert GPS coordinates to AR world coordinates
   */
  async gpsToWorldPosition(gpsPosition) {
    try {
      return await ARGPSModule.gpsToWorldPosition(gpsPosition);
    } catch (error) {
      console.error('Failed to convert GPS to world position:', error);
      throw error;
    }
  }

  /**
   * Place an AR object at GPS coordinates with world anchoring
   */
  async placeObject(object) {
    try {
      const worldPosition = await this.gpsToWorldPosition(object.position);
      const anchoredObject = {
        ...object,
        worldPosition
      };
      await ARGPSModule.placeObject(anchoredObject);
      this.trackedObjects.set(object.id, anchoredObject);
    } catch (error) {
      console.error('Failed to place AR object:', error);
      throw error;
    }
  }

  /**
   * Remove an AR object
   */
  async removeObject(objectId) {
    try {
      await ARGPSModule.removeObject(objectId);
      this.trackedObjects.delete(objectId);
    } catch (error) {
      console.error('Failed to remove AR object:', error);
      throw error;
    }
  }

  /**
   * Get current session state
   */
  async getSessionState() {
    try {
      return await ARGPSModule.getSessionState();
    } catch (error) {
      console.error('Failed to get session state:', error);
      throw error;
    }
  }

  /**
   * Update object positions based on current GPS
   */
  async updateObjectPositions(currentGPS) {
    try {
      await ARGPSModule.updateObjectPositions(currentGPS);
    } catch (error) {
      console.error('Failed to update object positions:', error);
      throw error;
    }
  }

  /**
   * Subscribe to AR events
   */
  addEventListener(eventType, _callback) {
    // This would be implemented with DeviceEventEmitter for real-time events
    console.log(`Subscribing to ${eventType} events`);
  }

  /**
   * Unsubscribe from AR events
   */
  removeEventListener(eventType, _callback) {
    console.log(`Unsubscribing from ${eventType} events`);
  }

  /**
   * Get tracked objects
   */
  getTrackedObjects() {
    return this.trackedObjects;
  }

  /**
   * Check if session is active
   */
  isSessionActive() {
    return this.sessionActive;
  }

  /**
   * Get world origin
   */
  getWorldOrigin() {
    return this.worldOrigin;
  }
}
export default ARGPS.getInstance();
//# sourceMappingURL=ARGPS.js.map
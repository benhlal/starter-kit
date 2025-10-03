import type { ARGPSPosition, ARWorldPosition, ARObject, ARSession, ARConfiguration, AREventType } from './types';
export declare class ARGPS {
    private static instance;
    private sessionActive;
    private worldOrigin;
    private trackedObjects;
    static getInstance(): ARGPS;
    /**
     * Initialize AR session with GPS origin anchoring
     */
    startSession(config: ARConfiguration): Promise<ARSession>;
    /**
     * Stop the AR session
     */
    stopSession(): Promise<void>;
    /**
     * Set the world origin for GPS-to-AR coordinate conversion
     */
    setWorldOrigin(position: ARGPSPosition): Promise<void>;
    /**
     * Convert GPS coordinates to AR world coordinates
     */
    gpsToWorldPosition(gpsPosition: ARGPSPosition): Promise<ARWorldPosition>;
    /**
     * Place an AR object at GPS coordinates with world anchoring
     */
    placeObject(object: ARObject): Promise<void>;
    /**
     * Remove an AR object
     */
    removeObject(objectId: string): Promise<void>;
    /**
     * Get current session state
     */
    getSessionState(): Promise<ARSession>;
    /**
     * Update object positions based on current GPS
     */
    updateObjectPositions(currentGPS: ARGPSPosition): Promise<void>;
    /**
     * Subscribe to AR events
     */
    addEventListener(eventType: AREventType, _callback: (event: any) => void): void;
    /**
     * Unsubscribe from AR events
     */
    removeEventListener(eventType: AREventType, _callback: (event: any) => void): void;
    /**
     * Get tracked objects
     */
    getTrackedObjects(): Map<string, ARObject>;
    /**
     * Check if session is active
     */
    isSessionActive(): boolean;
    /**
     * Get world origin
     */
    getWorldOrigin(): ARGPSPosition | null;
}
declare const _default: ARGPS;
export default _default;
//# sourceMappingURL=ARGPS.d.ts.map
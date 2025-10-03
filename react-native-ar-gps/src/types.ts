export interface ARGPSPosition {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
}

export interface ARWorldPosition {
  x: number;
  y: number;
  z: number;
}

export interface ARObject {
  /** Unique identifier */
  id: string;
  /** Object type or model name */
  type: string;
  /** GPS position where object should appear */
  position: ARGPSPosition;
  /** Scale of the object */
  scale?: { x: number; y: number; z: number };
  /** Rotation of the object */
  rotation?: { x: number; y: number; z: number };
  /** World position (calculated) */
  worldPosition?: ARWorldPosition;
}

export interface ARSession {
  isRunning: boolean;
  worldOrigin: ARGPSPosition | null;
  trackingState: 'tracking' | 'limited' | 'notAvailable';
}

export type ARSessionState = ARSession;

export interface ARConfiguration {
  /** Enable world tracking */
  worldTracking: boolean;
  /** Enable plane detection */
  planeDetection: boolean;
  /** Enable image tracking (optional) */
  enableImageTracking?: boolean;
  /** Maximum tracking distance in meters (optional) */
  maxTrackingDistance?: number;
}

export type AREventType =
  | 'sessionDidStart'
  | 'sessionDidFail'
  | 'planeDetected'
  | 'objectAnchored'
  | 'trackingStateChanged';

export interface AREvent {
  type: AREventType;
  data?: any;
}

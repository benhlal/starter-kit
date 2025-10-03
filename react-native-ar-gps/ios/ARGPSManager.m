#import "ARGPSManager.h"
#import <simd/simd.h>

@implementation ARGPSManager

- (instancetype)init {
    if (self = [super init]) {
        _arSession = [[ARSession alloc] init];
        _arSession.delegate = self;
        _trackedObjects = [[NSMutableDictionary alloc] init];
        _hasWorldOrigin = NO;
    }
    return self;
}

- (BOOL)startSessionWithConfig:(NSDictionary *)config error:(NSError **)error {
    if (!ARWorldTrackingConfiguration.isSupported) {
        if (error) {
            *error = [NSError errorWithDomain:@"ARGPSError" 
                                        code:1001 
                                    userInfo:@{NSLocalizedDescriptionKey: @"ARKit is not supported on this device"}];
        }
        return NO;
    }
    
    _configuration = [[ARWorldTrackingConfiguration alloc] init];
    
    // Configure based on provided options
    if ([config[@"enablePlaneDetection"] boolValue]) {
        _configuration.planeDetection = ARPlaneDetectionHorizontal | ARPlaneDetectionVertical;
    }
    
    NSString *worldAlignment = config[@"worldAlignment"];
    if ([worldAlignment isEqualToString:@"gravity"]) {
        _configuration.worldAlignment = ARWorldAlignmentGravity;
    } else if ([worldAlignment isEqualToString:@"gravityAndHeading"]) {
        _configuration.worldAlignment = ARWorldAlignmentGravityAndHeading;
    } else {
        _configuration.worldAlignment = ARWorldAlignmentCamera;
    }
    
    [_arSession runWithConfiguration:_configuration];
    
    if (self.delegate) {
        [self.delegate arManager:self didReceiveEvent:@"sessionDidStart" data:@{}];
    }
    
    return YES;
}

- (void)stopSession {
    [_arSession pause];
    [_trackedObjects removeAllObjects];
    _hasWorldOrigin = NO;
}

- (BOOL)setWorldOrigin:(NSDictionary *)position error:(NSError **)error {
    NSNumber *lat = position[@"latitude"];
    NSNumber *lon = position[@"longitude"];
    
    if (!lat || !lon) {
        if (error) {
            *error = [NSError errorWithDomain:@"ARGPSError"
                                        code:1002
                                    userInfo:@{NSLocalizedDescriptionKey: @"Invalid GPS coordinates"}];
        }
        return NO;
    }
    
    _worldOrigin = CLLocationCoordinate2DMake([lat doubleValue], [lon doubleValue]);
    _hasWorldOrigin = YES;
    
    NSLog(@"[ARGPS] World origin set to: %f, %f", _worldOrigin.latitude, _worldOrigin.longitude);
    return YES;
}

- (NSDictionary *)gpsToWorldPosition:(NSDictionary *)gpsPosition error:(NSError **)error {
    if (!_hasWorldOrigin) {
        if (error) {
            *error = [NSError errorWithDomain:@"ARGPSError"
                                        code:1003
                                    userInfo:@{NSLocalizedDescriptionKey: @"World origin not set"}];
        }
        return nil;
    }
    
    NSNumber *lat = gpsPosition[@"latitude"];
    NSNumber *lon = gpsPosition[@"longitude"];
    
    if (!lat || !lon) {
        if (error) {
            *error = [NSError errorWithDomain:@"ARGPSError"
                                        code:1002
                                    userInfo:@{NSLocalizedDescriptionKey: @"Invalid GPS coordinates"}];
        }
        return nil;
    }
    
    // GPS to meters conversion
    double metersPerDegreeLat = 111320.0;
    double metersPerDegreeLon = metersPerDegreeLat * cos(_worldOrigin.latitude * M_PI / 180.0);
    
    double deltaLat = [lat doubleValue] - _worldOrigin.latitude;
    double deltaLon = [lon doubleValue] - _worldOrigin.longitude;
    
    // Convert to AR world coordinates
    // X = East-West (positive = East)
    // Z = North-South (positive = North) - Note: Inverted for AR coordinate system
    // Y = Up-Down (positive = Up)
    double x = deltaLon * metersPerDegreeLon;
    double z = -deltaLat * metersPerDegreeLat; // Inverted for AR coordinates
    double y = 0.0; // Ground level
    
    NSLog(@"[ARGPS] GPS(%.6f, %.6f) -> AR(%.2f, %.2f, %.2f)", 
          [lat doubleValue], [lon doubleValue], x, y, z);
    
    return @{
        @"x": @(x),
        @"y": @(y),
        @"z": @(z)
    };
}

- (BOOL)placeObject:(NSDictionary *)object error:(NSError **)error {
    NSString *objectId = object[@"id"];
    NSDictionary *worldPosition = object[@"worldPosition"];
    
    if (!objectId || !worldPosition) {
        if (error) {
            *error = [NSError errorWithDomain:@"ARGPSError"
                                        code:1004
                                    userInfo:@{NSLocalizedDescriptionKey: @"Invalid object data"}];
        }
        return NO;
    }
    
    float x = [worldPosition[@"x"] floatValue];
    float y = [worldPosition[@"y"] floatValue];
    float z = [worldPosition[@"z"] floatValue];
    
    // Create AR anchor at world coordinates
    simd_float4x4 transform = matrix_identity_float4x4;
    transform.columns[3] = simd_make_float4(x, y, z, 1.0);
    
    ARAnchor *anchor = [[ARAnchor alloc] initWithTransform:transform];
    [_arSession addAnchor:anchor];
    
    // Store the anchor for tracking
    _trackedObjects[objectId] = anchor;
    
    NSLog(@"[ARGPS] Placed object %@ at AR coordinates (%.2f, %.2f, %.2f)", objectId, x, y, z);
    
    if (self.delegate) {
        [self.delegate arManager:self didReceiveEvent:@"objectAnchored" data:@{
            @"objectId": objectId,
            @"worldPosition": worldPosition
        }];
    }
    
    return YES;
}

- (void)removeObject:(NSString *)objectId {
    ARAnchor *anchor = _trackedObjects[objectId];
    if (anchor) {
        [_arSession removeAnchor:anchor];
        [_trackedObjects removeObjectForKey:objectId];
        NSLog(@"[ARGPS] Removed object %@", objectId);
    }
}

- (NSDictionary *)getSessionState {
    ARTrackingState trackingState = _arSession.currentFrame.camera.trackingState;
    NSString *trackingStateString;
    
    switch (trackingState) {
        case ARTrackingStateNormal:
            trackingStateString = @"tracking";
            break;
        case ARTrackingStateLimited:
            trackingStateString = @"limited";
            break;
        case ARTrackingStateNotAvailable:
            trackingStateString = @"notAvailable";
            break;
    }
    
    return @{
        @"isRunning": @(_arSession.currentFrame != nil),
        @"worldOrigin": _hasWorldOrigin ? @{
            @"latitude": @(_worldOrigin.latitude),
            @"longitude": @(_worldOrigin.longitude)
        } : [NSNull null],
        @"trackingState": trackingStateString
    };
}

- (void)updateObjectPositions:(NSDictionary *)currentGPS {
    // Recalculate positions for all tracked objects based on new GPS position
    // This could be used for drift correction
    NSLog(@"[ARGPS] Updating object positions based on GPS: %@", currentGPS);
}

#pragma mark - ARSessionDelegate

- (void)session:(ARSession *)session didUpdateFrame:(ARFrame *)frame {
    // Frame updates - could be used for tracking state monitoring
}

- (void)session:(ARSession *)session didAddAnchors:(NSArray<ARAnchor *> *)anchors {
    for (ARAnchor *anchor in anchors) {
        if ([anchor isKindOfClass:[ARPlaneAnchor class]]) {
            if (self.delegate) {
                [self.delegate arManager:self didReceiveEvent:@"planeDetected" data:@{
                    @"anchorId": anchor.identifier.UUIDString
                }];
            }
        }
    }
}

- (void)session:(ARSession *)session didFailWithError:(NSError *)error {
    if (self.delegate) {
        [self.delegate arManager:self didReceiveEvent:@"sessionDidFail" data:@{
            @"error": error.localizedDescription
        }];
    }
}

- (void)session:(ARSession *)session cameraDidChangeTrackingState:(ARCamera *)camera {
    ARTrackingState trackingState = camera.trackingState;
    NSString *trackingStateString;
    
    switch (trackingState) {
        case ARTrackingStateNormal:
            trackingStateString = @"tracking";
            break;
        case ARTrackingStateLimited:
            trackingStateString = @"limited";
            break;
        case ARTrackingStateNotAvailable:
            trackingStateString = @"notAvailable";
            break;
    }
    
    if (self.delegate) {
        [self.delegate arManager:self didReceiveEvent:@"trackingStateChanged" data:@{
            @"trackingState": trackingStateString
        }];
    }
}

@end
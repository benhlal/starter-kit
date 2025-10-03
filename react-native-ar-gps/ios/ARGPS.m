#import "ARGPS.h"
#import "ARGPSManager.h"
#import <React/RCTLog.h>

@interface ARGPS()
@property (nonatomic, strong) ARGPSManager *arManager;
@end

@implementation ARGPS

RCT_EXPORT_MODULE()

- (instancetype)init {
    if (self = [super init]) {
        _arManager = [[ARGPSManager alloc] init];
        _arManager.delegate = self;
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[@"sessionDidStart", @"sessionDidFail", @"planeDetected", @"objectAnchored", @"trackingStateChanged"];
}

RCT_EXPORT_METHOD(startSession:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSError *error;
        BOOL success = [self.arManager startSessionWithConfig:config error:&error];
        
        if (success) {
            resolve(@{
                @"isRunning": @YES,
                @"worldOrigin": [NSNull null],
                @"trackingState": @"tracking"
            });
        } else {
            reject(@"AR_SESSION_ERROR", error.localizedDescription, error);
        }
    });
}

RCT_EXPORT_METHOD(stopSession:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self.arManager stopSession];
        resolve([NSNull null]);
    });
}

RCT_EXPORT_METHOD(setWorldOrigin:(NSDictionary *)position
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSError *error;
        BOOL success = [self.arManager setWorldOrigin:position error:&error];
        
        if (success) {
            resolve([NSNull null]);
        } else {
            reject(@"WORLD_ORIGIN_ERROR", error.localizedDescription, error);
        }
    });
}

RCT_EXPORT_METHOD(gpsToWorldPosition:(NSDictionary *)gpsPosition
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSError *error;
        NSDictionary *worldPosition = [self.arManager gpsToWorldPosition:gpsPosition error:&error];
        
        if (worldPosition) {
            resolve(worldPosition);
        } else {
            reject(@"COORDINATE_CONVERSION_ERROR", error.localizedDescription, error);
        }
    });
}

RCT_EXPORT_METHOD(placeObject:(NSDictionary *)object
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSError *error;
        BOOL success = [self.arManager placeObject:object error:&error];
        
        if (success) {
            resolve([NSNull null]);
        } else {
            reject(@"PLACE_OBJECT_ERROR", error.localizedDescription, error);
        }
    });
}

RCT_EXPORT_METHOD(removeObject:(NSString *)objectId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self.arManager removeObject:objectId];
        resolve([NSNull null]);
    });
}

RCT_EXPORT_METHOD(getSessionState:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        NSDictionary *state = [self.arManager getSessionState];
        resolve(state);
    });
}

RCT_EXPORT_METHOD(updateObjectPositions:(NSDictionary *)currentGPS
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        [self.arManager updateObjectPositions:currentGPS];
        resolve([NSNull null]);
    });
}

// ARGPSManagerDelegate methods
- (void)arManager:(ARGPSManager *)manager didReceiveEvent:(NSString *)eventType data:(NSDictionary *)data {
    [self sendEventWithName:eventType body:data];
}

@end
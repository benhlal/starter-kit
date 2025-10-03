#import <Foundation/Foundation.h>
#import <ARKit/ARKit.h>
#import <CoreLocation/CoreLocation.h>

@class ARGPSManager;

@protocol ARGPSManagerDelegate <NSObject>
- (void)arManager:(ARGPSManager *)manager didReceiveEvent:(NSString *)eventType data:(NSDictionary *)data;
@end

@interface ARGPSManager : NSObject <ARSessionDelegate, ARSCNViewDelegate>

@property (nonatomic, weak) id<ARGPSManagerDelegate> delegate;
@property (nonatomic, strong) ARSession *arSession;
@property (nonatomic, strong) ARWorldTrackingConfiguration *configuration;

// GPS World Origin for coordinate conversion
@property (nonatomic, assign) CLLocationCoordinate2D worldOrigin;
@property (nonatomic, assign) BOOL hasWorldOrigin;

// Tracked AR objects
@property (nonatomic, strong) NSMutableDictionary<NSString *, ARAnchor *> *trackedObjects;

// Methods
- (BOOL)startSessionWithConfig:(NSDictionary *)config error:(NSError **)error;
- (void)stopSession;
- (BOOL)setWorldOrigin:(NSDictionary *)position error:(NSError **)error;
- (NSDictionary *)gpsToWorldPosition:(NSDictionary *)gpsPosition error:(NSError **)error;
- (BOOL)placeObject:(NSDictionary *)object error:(NSError **)error;
- (void)removeObject:(NSString *)objectId;
- (NSDictionary *)getSessionState;
- (void)updateObjectPositions:(NSDictionary *)currentGPS;

@end
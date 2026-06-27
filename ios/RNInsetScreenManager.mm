/**
 * RNInsetScreenManager.mm
 *
 * iOS implementation for the InsetScreen component.
 *
 * Provides two objects:
 *   1. RNInsetScreenView  — a passthrough UIView that fires a local
 *      NSNotification whenever safe-area insets change (orientation, modal,
 *      keyboard toolbar, etc.).
 *   2. RNInsetScreenEmitter — an RCTEventEmitter module that listens for that
 *      notification, reads UIWindow.safeAreaInsets and emits
 *      "screenInsetsChanged" to JavaScript via NativeEventEmitter.
 *   3. RNInsetScreenManager — the RCTViewManager that vends RNInsetScreenView
 *      so it can be rendered as <RNInsetScreen> from JS.
 *
 * The JavaScript side (useImmersiveMode.ts) creates a NativeEventEmitter on
 * top of RNInsetScreenEmitter and calls `getTopInset` / `getBottomInset` for
 * an initial synchronous seed — exactly mirroring the Android flow.
 */

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTViewManager.h>
#import <UIKit/UIKit.h>

// ─────────────────────────────────────────────────────────────────────────────
// Internal notification used to decouple the view from the emitter module.
// ─────────────────────────────────────────────────────────────────────────────

static NSString *const RNSafeAreaChangedNotification = @"RNBottomSheet_SafeAreaChanged";

// ─────────────────────────────────────────────────────────────────────────────
// RNInsetScreenView — passthrough UIView
// ─────────────────────────────────────────────────────────────────────────────

@interface RNInsetScreenView : UIView
@end

@implementation RNInsetScreenView

/** Fired by UIKit whenever the view's safe-area insets change. */
- (void)safeAreaInsetsDidChange {
  [super safeAreaInsetsDidChange];
  [[NSNotificationCenter defaultCenter]
      postNotificationName:RNSafeAreaChangedNotification
                    object:nil];
}

/** Called when the view enters the window hierarchy. */
- (void)didMoveToWindow {
  [super didMoveToWindow];
  if (!self.window) return;
  // Slight delay so the window has settled and safeAreaInsets are final.
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(60 * NSEC_PER_MSEC)),
                 dispatch_get_main_queue(), ^{
    [[NSNotificationCenter defaultCenter]
        postNotificationName:RNSafeAreaChangedNotification
                      object:nil];
  });
}

// Exported view properties (values are informational; padding is applied in JS)
@property (nonatomic, assign) BOOL applyTopInset;
@property (nonatomic, assign) BOOL applyBottomInset;

@end

// ─────────────────────────────────────────────────────────────────────────────
// RNInsetScreenEmitter — RCTEventEmitter that pushes inset data to JS
// ─────────────────────────────────────────────────────────────────────────────

@interface RNInsetScreenEmitter : RCTEventEmitter <RCTBridgeModule>
@end

@implementation RNInsetScreenEmitter {
  BOOL _observing;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[@"screenInsetsChanged"];
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

- (void)startObserving {
  _observing = YES;
  [[NSNotificationCenter defaultCenter]
      addObserver:self
         selector:@selector(_onSafeAreaChanged)
             name:RNSafeAreaChangedNotification
           object:nil];
  // Also update on orientation change (catches cases without an InsetScreen)
  [[NSNotificationCenter defaultCenter]
      addObserver:self
         selector:@selector(_onSafeAreaChanged)
             name:UIDeviceOrientationDidChangeNotification
           object:nil];
  [self _emitInsets];
}

- (void)stopObserving {
  _observing = NO;
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

// ── Exported methods (mirror Android ImmersiveModule.getBottomInset etc.) ─────

RCT_EXPORT_METHOD(getTopInset:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve(@([self _safeAreaInsets].top));
  });
}

RCT_EXPORT_METHOD(getBottomInset:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve(@([self _safeAreaInsets].bottom));
  });
}

// ── Private ───────────────────────────────────────────────────────────────────

- (void)_onSafeAreaChanged {
  if (!_observing) return;
  [self _emitInsets];
}

- (void)_emitInsets {
  dispatch_async(dispatch_get_main_queue(), ^{
    UIEdgeInsets ins = [self _safeAreaInsets];
    [self sendEventWithName:@"screenInsetsChanged" body:@{
      @"top":    @(ins.top),
      @"bottom": @(ins.bottom),
      @"left":   @(ins.left),
      @"right":  @(ins.right),
    }];
  });
}

/** Reads the key window's safeAreaInsets; falls back to zero on failure. */
- (UIEdgeInsets)_safeAreaInsets {
  UIWindow *window = nil;
  for (UIScene *scene in [UIApplication sharedApplication].connectedScenes) {
    if (![scene isKindOfClass:[UIWindowScene class]]) continue;
    UIWindowScene *ws = (UIWindowScene *)scene;
    for (UIWindow *w in ws.windows) {
      if (w.isKeyWindow) { window = w; break; }
    }
    if (!window) window = ws.windows.firstObject;
    if (window) break;
  }
  return window ? window.safeAreaInsets : UIEdgeInsetsZero;
}

@end

// ─────────────────────────────────────────────────────────────────────────────
// RNInsetScreenManager — RCTViewManager
// ─────────────────────────────────────────────────────────────────────────────

@interface RNInsetScreenManager : RCTViewManager
@end

@implementation RNInsetScreenManager

RCT_EXPORT_MODULE(RNInsetScreen)

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (UIView *)view {
  return [[RNInsetScreenView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(applyTopInset, BOOL)
RCT_EXPORT_VIEW_PROPERTY(applyBottomInset, BOOL)

@end

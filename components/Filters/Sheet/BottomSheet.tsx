import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface BottomSheetProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeightPercent?: number; // default 0.6
  dimOverlay?: boolean; // default false (transparent)
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  title,
  onClose,
  children,
  footer,
  maxHeightPercent = 0.6,
  dimOverlay = false,
}) => {
  const screenH = Dimensions.get("window").height;
  const sheetMaxHeight = Math.round(screenH * maxHeightPercent);
  // Start hidden (pushed down by its own height); animate to 0 when visible
  const translateY = useRef(new Animated.Value(sheetMaxHeight)).current;
  const scrollYRef = useRef(0);
  const [overlayEnabled, setOverlayEnabled] = useState(false);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // temporarily disable overlay taps to avoid immediate close from the same press
      setOverlayEnabled(false);
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current);
      }
      openTimerRef.current = setTimeout(() => setOverlayEnabled(true), 250);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      if (openTimerRef.current) {
        clearTimeout(openTimerRef.current);
        openTimerRef.current = null;
      }
      Animated.timing(translateY, {
        toValue: sheetMaxHeight,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, sheetMaxHeight, translateY]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (_, gesture) =>
          scrollYRef.current <= 0 &&
          gesture.dy > 5 &&
          Math.abs(gesture.dx) < 10,
        onMoveShouldSetPanResponder: (_, gesture) =>
          scrollYRef.current <= 0 &&
          gesture.dy > 5 &&
          Math.abs(gesture.dx) < 10,
        onPanResponderMove: (_, gesture) => {
          const y = Math.max(0, gesture.dy);
          translateY.setValue(y);
        },
        onPanResponderRelease: (_, gesture) => {
          const threshold = 120; // drag ~120px to dismiss
          if (gesture.dy > threshold) {
            Animated.timing(translateY, {
              toValue: sheetMaxHeight,
              duration: 180,
              useNativeDriver: true,
            }).start(() => onClose());
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [onClose, sheetMaxHeight, translateY]
  );

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Pressable
        style={[styles.overlay, dimOverlay && styles.dimmed]}
        onPress={onClose}
        disabled={!overlayEnabled}
      />
      <Animated.View
        style={[
          styles.sheet,
          { height: sheetMaxHeight, transform: [{ translateY }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.grabber} {...panResponder.panHandlers}>
          <View style={styles.grabberPill} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
        </View>
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    // elevation helps on Android to ensure it's above other views
    elevation: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  dimmed: {
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#151515",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
    elevation: 8,
  },
  grabber: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a2a",
  },
  grabberPill: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#3a3a3a",
    marginBottom: 6,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
    backgroundColor: "#151515",
  },
});

export default BottomSheet;

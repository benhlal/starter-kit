import React, { useMemo, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
} from "react-native";

interface FilterModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  attachToBottom?: boolean; // when true, remove bottom safe-area padding so sheet touches navbar
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  title,
  onClose,
  children,
  footer,
  attachToBottom = false,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
        onPanResponderMove: (_, gesture) => {
          const y = Math.max(0, gesture.dy);
          translateY.setValue(y);
        },
        onPanResponderRelease: (_, gesture) => {
          const threshold = 80;
          if (gesture.dy > threshold) {
            // swipe down to close
            Animated.timing(translateY, {
              toValue: 300,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              translateY.setValue(0);
              onClose();
            });
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [onClose, translateY]
  );

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheetWrapper} onPress={() => {}}>
          <Animated.View
            style={[styles.sheet, { transform: [{ translateY }] }]}
            {...panResponder.panHandlers}
          >
            <View style={styles.header}>
              <View style={styles.headerSpacer} />
              <Text style={styles.title}>{title}</Text>
              <View style={styles.headerSpacer} />
            </View>
            <ScrollView
              style={styles.content}
              contentContainerStyle={[
                styles.contentContainer,
                attachToBottom ? styles.contentNoPad : undefined,
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
            {footer ? (
              <View
                style={[
                  styles.footer,
                  attachToBottom ? styles.footerAttached : undefined,
                ]}
              >
                {footer}
              </View>
            ) : null}
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    alignItems: "stretch",
  },
  sheetWrapper: {
    width: "100%",
  },
  sheet: {
    backgroundColor: "#151515",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "80%",
    width: "100%",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerAction: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 24,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  content: {
    flexGrow: 0,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  contentNoPad: {
    paddingBottom: 0,
  },
  footer: {
    paddingTop: 8,
    paddingHorizontal: 16,
    backgroundColor: "#151515",
    borderTopWidth: 1,
    borderTopColor: "#2a2a2a",
  },
  footerAttached: {
    paddingBottom: 0,
  },
});

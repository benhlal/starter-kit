import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet from "../Filters/Sheet/BottomSheet";

interface ConfirmDialogProps {
  visible: boolean;
  title?: string;
  message?: string;
  feeLabel?: string; // e.g., "Participation fee: €5"
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title = "Confirm",
  message,
  feeLabel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  const footer = (
    <View style={styles.footerRow}>
      <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onCancel}>
        <Text style={styles.btnText}>{cancelText}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.confirm]} onPress={onConfirm}>
        <Text style={styles.btnText}>{confirmText}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <BottomSheet visible={visible} title={title} onClose={onCancel} footer={footer}>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {feeLabel ? <Text style={styles.fee}>{feeLabel}</Text> : null}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  message: { color: "#EDEDED", fontSize: 16, marginBottom: 8 },
  fee: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  footerRow: {
    flexDirection: "row",
    gap: 12,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancel: {
    backgroundColor: "#1C1C1C",
    borderWidth: 1,
    borderColor: "#373737",
  },
  confirm: {
    backgroundColor: "#D946EF",
  },
  btnText: { color: "#FFFFFF", fontWeight: "700" },
});

export default ConfirmDialog;

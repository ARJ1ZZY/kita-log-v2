import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../styles/designSystem';

const UpgradeConfirmModal = ({ visible, onCancel, onConfirm }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Ionicons name="rocket-outline" size={40} color={t.colors.primary} />
        <Text style={styles.title}>Upgrade to KITA-LOG Premium</Text>
        <Text style={styles.price}>₱199.00</Text>
        <Text style={styles.message}>
          Unlock unlimited businesses and premium features. Continue?
        </Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
            <Text style={styles.confirmText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.colors.overlay },
  card: { width: '85%', backgroundColor: t.colors.surface, borderRadius: 20, padding: 24, alignItems: 'center', ...t.shadows.xl },
  title: { fontSize: 20, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark, marginTop: 12, textAlign: 'center' },
  price: { fontSize: 28, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.primary, marginTop: 8 },
  message: { fontSize: 14, fontFamily: t.typography.body, color: t.colors.medium, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' },
  cancelBtn: { flex: 1, backgroundColor: t.colors.background, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: t.colors.medium, fontSize: 16, fontFamily: t.typography.bodySemiBold },
  confirmBtn: { flex: 1, backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center' },
  confirmText: { color: t.colors.white, fontSize: 16, fontFamily: t.typography.bodySemiBold, fontWeight: '600' },
});

export default UpgradeConfirmModal;
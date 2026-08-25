import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';

const UpgradeModal = ({ visible, onClose }) => {
  const { unlockUnlimited } = useAuth();
  const [linked, setLinked] = useState(false);

  const handleLinkGCash = () => {
    setLinked(true);
  };

  const handleProceed = async () => {
    if (!linked) {
      alert('Please link your GCash account first.');
      return;
    }
    await unlockUnlimited();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Ionicons name="lock-closed" size={40} color={t.colors.primary} />
          <Text style={styles.title}>Unlock Unlimited Businesses</Text>
          <Text style={styles.price}>₱199.00</Text>
          <Text style={styles.description}>
            You currently have the free plan (2 businesses). Upgrade to add unlimited businesses.
          </Text>
          <TouchableOpacity
            style={[styles.gcashBtn, linked && styles.gcashLinked]}
            onPress={handleLinkGCash}
          >
            <Ionicons name={linked ? 'checkmark-circle' : 'link-outline'} size={20} color={linked ? t.colors.success : t.colors.white} />
            <Text style={styles.gcashText}>
              {linked ? 'GCash Account Linked' : 'Link Your GCash Account'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.proceedBtn} onPress={handleProceed}>
            <Text style={styles.proceedText}>Proceed to Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.colors.overlay },
  card: { width: '85%', backgroundColor: t.colors.surface, borderRadius: 20, padding: 24, alignItems: 'center', ...t.shadows.xl },
  title: { fontSize: 20, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark, marginTop: 12, textAlign: 'center' },
  price: { fontSize: 32, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.primary, marginTop: 8 },
  description: { fontSize: 14, fontFamily: t.typography.body, color: t.colors.medium, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  gcashBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: t.colors.secondary, borderRadius: t.radius.button, paddingVertical: 14, paddingHorizontal: 20, marginTop: 20, width: '100%' },
  gcashLinked: { backgroundColor: t.colors.successLight },
  gcashText: { color: t.colors.white, fontSize: 16, fontFamily: t.typography.bodySemiBold },
  proceedBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center', marginTop: 12, width: '100%' },
  proceedText: { color: t.colors.white, fontSize: 16, fontFamily: t.typography.bodySemiBold, fontWeight: '600' },
  cancelBtn: { backgroundColor: t.colors.background, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center', marginTop: 8, width: '100%' },
  cancelText: { color: t.colors.medium, fontSize: 16, fontFamily: t.typography.bodySemiBold },
});

export default UpgradeModal;
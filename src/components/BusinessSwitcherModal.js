import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';
import AddBusinessModal from './AddBusinessModal';
import UpgradeConfirmModal from './UpgradeConfirmModal';
import UpgradeModal from './UpgradeModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import Toast from './Toast';

const BusinessSwitcherModal = ({ visible, onClose }) => {
  const { businesses, activeBusinessId, unlocked, switchBusiness, deleteBusiness, cancelPlan } = useAuth();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [upgradeConfirmVisible, setUpgradeConfirmVisible] = useState(false);
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cancelPlanConfirmVisible, setCancelPlanConfirmVisible] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (msg, type = 'success') => setToast({ visible: true, message: msg, type });

  const handleSelect = async (businessId) => {
    await switchBusiness(businessId);
    onClose();
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteBusiness(deleteTarget.id);
      setDeleteTarget(null);
      showToast('Business deleted', 'success');
    }
  };

  const handleUpgradeConfirm = () => {
    setUpgradeConfirmVisible(false);
    setUpgradeModalVisible(true);
  };

  const handleCancelPlanConfirm = async () => {
    setCancelPlanConfirmVisible(false);
    await cancelPlan();
    showToast('Premium plan cancelled', 'success');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={t.colors.dark} />
          </TouchableOpacity>
          <Text style={styles.title}>Switch Business</Text>
          <View style={{ width: 44 }} />
        </View>
        <FlatList
          data={businesses}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isActive = item.id === activeBusinessId;
            return (
              <TouchableOpacity style={[styles.businessCard, isActive && styles.activeCard]} onPress={() => handleSelect(item.id)} activeOpacity={0.7}>
                <View style={[styles.bizIcon, { backgroundColor: isActive ? t.colors.primaryLight : t.colors.background }]}>
                  <Ionicons name="business-outline" size={22} color={isActive ? t.colors.primary : t.colors.medium} />
                </View>
                <View style={styles.bizInfo}>
                  <Text style={[styles.bizName, isActive && styles.activeText]}>{item.business_name}</Text>
                  <Text style={styles.bizType}>{item.business_type}</Text>
                </View>
                {isActive ? (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color={t.colors.primary} />
                    <TouchableOpacity onPress={() => setDeleteTarget(item)} style={styles.deleteBtn}>
                      <Ionicons name="trash-outline" size={20} color={t.colors.danger} />
                    </TouchableOpacity>
                  </>
                ) : null}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No businesses yet</Text>
              <Text style={styles.emptySub}>Add your first business to get started</Text>
            </View>
          }
        />

        {/* Plan status footer */}
        <View style={styles.planFooter}>
          <Text style={styles.planStatus}>
            Current Plan: {unlocked ? 'Premium (Unlimited)' : 'Free (2 businesses)'}
          </Text>
          {unlocked && (
            <TouchableOpacity
              style={styles.cancelPlanBtn}
              onPress={() => setCancelPlanConfirmVisible(true)}
            >
              <Text style={styles.cancelPlanText}>Cancel Plan</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            if (businesses.length >= 2 && !unlocked) {
              setUpgradeConfirmVisible(true);
            } else {
              setAddModalVisible(true);
            }
          }}
        >
          <Ionicons name="add" size={20} color={t.colors.white} />
          <Text style={styles.addBtnText}>Add Business</Text>
        </TouchableOpacity>
      </View>

      <AddBusinessModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdded={() => {
          setAddModalVisible(false);
          onClose();
        }}
      />

      <UpgradeConfirmModal
        visible={upgradeConfirmVisible}
        onCancel={() => setUpgradeConfirmVisible(false)}
        onConfirm={handleUpgradeConfirm}
      />

      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
      />

      <ConfirmDeleteModal
        visible={!!deleteTarget}
        title="Delete Business"
        message={`Delete "${deleteTarget?.business_name}"? This will permanently remove all its data.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDeleteModal
        visible={cancelPlanConfirmVisible}
        title="Cancel Premium"
        message="Are you sure you want to cancel your premium plan? You will lose unlimited businesses."
        confirmText="Cancel Plan"
        onCancel={() => setCancelPlanConfirmVisible(false)}
        onConfirm={handleCancelPlanConfirm}
      />

      <Toast message={toast.message} visible={toast.visible} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.colors.surface, paddingTop: 52, paddingBottom: t.spacing.md, paddingHorizontal: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  title: { fontSize: 18, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark },
  list: { padding: t.spacing.lg, paddingBottom: 100 },
  businessCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.lg, marginBottom: t.spacing.md, ...t.shadows.sm },
  activeCard: { borderColor: t.colors.primary, backgroundColor: t.colors.primaryLight },
  bizIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: t.spacing.md },
  bizInfo: { flex: 1 },
  bizName: { fontSize: 16, fontFamily: t.typography.bodySemiBold, fontWeight: '600', color: t.colors.dark },
  activeText: { color: t.colors.primary },
  bizType: { fontSize: 12, fontFamily: t.typography.body, color: t.colors.medium, marginTop: 2 },
  deleteBtn: { padding: 4, marginLeft: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontFamily: t.typography.bodySemiBold, color: t.colors.dark, marginTop: 12 },
  emptySub: { fontSize: 13, fontFamily: t.typography.body, color: t.colors.medium, marginTop: 4 },
  planFooter: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: t.colors.background, alignItems: 'center' },
  planStatus: { fontSize: 14, fontFamily: t.typography.bodySemiBold, color: t.colors.dark },
  cancelPlanBtn: { marginTop: 8, paddingVertical: 6, paddingHorizontal: 16, backgroundColor: t.colors.dangerLight, borderRadius: t.radius.pill },
  cancelPlanText: { color: t.colors.danger, fontSize: 13, fontFamily: t.typography.bodySemiBold },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 14, margin: 16 },
  addBtnText: { color: t.colors.white, fontSize: 16, fontFamily: t.typography.bodySemiBold, fontWeight: '600' },
});

export default BusinessSwitcherModal;
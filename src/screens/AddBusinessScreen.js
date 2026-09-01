import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';
import Toast from '../components/Toast';

const BUSINESS_TYPES = ['Sari-sari Store', 'Ukay-ukay', 'Online Seller', 'Micro-enterprise', 'Other'];

const AddBusinessScreen = () => {
  const insets = useSafeAreaInsets();
  const { addBusiness, closeAddBusinessModal } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState(BUSINESS_TYPES[0]);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (msg, type = 'success') => setToast({ visible: true, message: msg, type });

  const handleAdd = async () => {
    if (!name.trim()) {
      if (Platform.OS === 'web') window.alert('Business name is required');
      else Alert.alert('Error', 'Business name is required');
      return;
    }

    try {
      const result = await addBusiness(name.trim(), type);
      if (result?.success) {
        setName('');
        setType(BUSINESS_TYPES[0]);
        showToast('Business added successfully', 'success');
        closeAddBusinessModal();
      } else if (result?.error === 'limit_reached') {
        if (Platform.OS === 'web') {
          window.alert('Limit reached. You can have up to 2 businesses. Upgrade for ₱199 to add more.');
        } else {
          Alert.alert('Limit Reached', 'You can have up to 2 businesses. Upgrade for ₱199 to add more.');
        }
      } else if (result?.error === 'add_failed') {
        const errorMsg = `Failed to add business: ${result.message || 'Unknown error'}`;
        if (Platform.OS === 'web') window.alert(errorMsg);
        else Alert.alert('Error', errorMsg);
      } else {
        if (Platform.OS === 'web') window.alert('Something went wrong. Please try again.');
        else Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } catch (e) {
      console.error('Add business exception:', e);
      if (Platform.OS === 'web') window.alert('Something went wrong. Please try again.');
      else Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={closeAddBusinessModal} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={t.colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Business</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Business Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Aling Nena's Store"
            placeholderTextColor={t.colors.medium}
            value={name}
            onChangeText={setName}
          />
        </View>
        <Text style={styles.label}>Business Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeRow}>
          {BUSINESS_TYPES.map(b => (
            <TouchableOpacity
              key={b}
              style={[styles.typeChip, type === b && styles.typeChipActive]}
              onPress={() => setType(b)}
            >
              <Text style={[styles.typeText, type === b && styles.typeTextActive]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={closeAddBusinessModal}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
            <Text style={styles.saveText}>Add</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Toast message={toast.message} visible={toast.visible} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: t.colors.surface,
    paddingHorizontal: t.spacing.lg,
    paddingBottom: t.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.border,
  },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark },
  content: { padding: t.spacing.lg },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontFamily: t.typography.bodyBold, fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: t.colors.background, borderRadius: t.radius.input, borderWidth: 1.5, borderColor: t.colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, fontFamily: t.typography.body, color: t.colors.dark, height: 44 },
  typeRow: { marginBottom: 20 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: t.radius.pill, backgroundColor: t.colors.background, borderWidth: 1, borderColor: t.colors.border, marginRight: 8 },
  typeChipActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  typeText: { fontSize: 13, fontFamily: t.typography.bodyMedium, color: t.colors.medium },
  typeTextActive: { color: t.colors.white },
  buttonRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: t.colors.background, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 16, fontFamily: t.typography.bodySemiBold, color: t.colors.medium },
  saveBtn: { flex: 1, backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center' },
  saveText: { fontSize: 16, fontFamily: t.typography.bodySemiBold, color: t.colors.white },
});

export default AddBusinessScreen;
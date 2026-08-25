import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, TextInput, Alert, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { addDocument, getDocuments, deleteDocument, updateDocument } from '../services/firestoreService';
import { t } from '../styles/designSystem';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { sendLocalNotification } from '../services/notificationService';
import { useFormat } from '../utils/format';

const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];

const RecurringTransactionsScreen = ({ onClose }) => {
  const { user, activeBusinessId } = useAuth();
  const { formatCurrency } = useFormat();
  const [recurrings, setRecurrings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', amount: '', frequency: 'monthly', dayOfMonth: '1', type: 'expense', nextDue: '' });
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (msg, type = 'success') => setToast({ visible: true, message: msg, type });

  const fetch = useCallback(async () => {
    if (!user || !activeBusinessId) return;
    setLoading(true);
    const docs = await getDocuments('recurring_transactions', [{ field: 'business_id', operator: '==', value: activeBusinessId }]);
    setRecurrings(docs.sort((a, b) => (a.next_due || '').localeCompare(b.next_due || '')));
    setLoading(false);
  }, [user, activeBusinessId]);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  const handleAdd = async () => {
    const amt = parseFloat(form.amount);
    if (!form.name.trim() || isNaN(amt) || amt <= 0) {
      showToast('Enter valid name and amount', 'error');
      return;
    }
    const nextDue = calculateNextDue(form.frequency, parseInt(form.dayOfMonth) || 1);
    await addDocument('recurring_transactions', {
      business_id: activeBusinessId,
      name: form.name.trim(),
      amount: amt,
      frequency: form.frequency,
      day_of_month: parseInt(form.dayOfMonth) || 1,
      type: form.type,
      next_due: nextDue,
      created_at: new Date().toISOString(),
    });
    setModalVisible(false);
    setForm({ name: '', amount: '', frequency: 'monthly', dayOfMonth: '1', type: 'expense', nextDue: '' });
    fetch();
    showToast('Recurring transaction added', 'success');
  };

  const calculateNextDue = (frequency, dayOfMonth) => {
    const today = new Date();
    let next = new Date(today);
    if (frequency === 'monthly') {
      next = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
    } else if (frequency === 'yearly') {
      next = new Date(today.getFullYear() + 1, today.getMonth(), dayOfMonth);
    } else if (frequency === 'weekly') {
      next.setDate(today.getDate() + 7);
    } else {
      next.setDate(today.getDate() + 1);
    }
    return next.toISOString().split('T')[0];
  };

  const handleGenerateDue = async () => {
    const today = new Date().toISOString().split('T')[0];
    let generated = 0;
    for (const rec of recurrings) {
      if (rec.next_due && rec.next_due <= today) {
        await addDocument('transactions', {
          business_id: activeBusinessId,
          type: rec.type,
          amount: rec.amount,
          description: rec.name,
          date: today,
          time: new Date().toTimeString().split(' ')[0].substring(0, 5),
          items: [],
          created_at: new Date().toISOString(),
        });
        // Update next due date
        const newNextDue = calculateNextDue(rec.frequency, rec.day_of_month);
        await updateDocument('recurring_transactions', rec.id, { next_due: newNextDue });
        generated++;
      }
    }
    if (generated > 0) {
      await sendLocalNotification('Recurring Transactions', `${generated} recurring transaction(s) generated.`);
      showToast(`${generated} transaction(s) generated`, 'success');
    } else {
      showToast('No due transactions', 'info');
    }
    fetch();
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove this recurring transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await deleteDocument('recurring_transactions', id);
        fetch();
        showToast('Deleted', 'success');
      }},
    ]);
  };

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={t.colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={t.colors.dark} /></TouchableOpacity>
        <Text style={styles.title}>Recurring</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
          <Ionicons name="add" size={20} color={t.colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={recurrings}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <TouchableOpacity style={styles.generateBtn} onPress={handleGenerateDue}>
            <Ionicons name="refresh" size={18} color={t.colors.white} />
            <Text style={styles.generateText}>Generate Due Transactions</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardInfo}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.frequency} • Day {item.day_of_month} • {item.type}</Text>
              {item.next_due && (
                <Text style={styles.dueDate}>Due: {item.next_due}</Text>
              )}
            </View>
            <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={t.colors.danger} />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No recurring transactions set</Text>}
      />

      <Modal visible={modalVisible} onClose={() => setModalVisible(false)} title="New Recurring">
        <View>
          <View style={styles.inputGroup}><Text style={styles.label}>Name</Text><TextInput style={styles.input} value={form.name} onChangeText={x => setForm({...form, name: x})} placeholder="e.g., Rent" placeholderTextColor={t.colors.medium} /></View>
          <View style={styles.inputGroup}><Text style={styles.label}>Amount</Text><TextInput style={styles.input} keyboardType="decimal-pad" value={form.amount} onChangeText={x => setForm({...form, amount: x})} placeholder="0.00" placeholderTextColor={t.colors.medium} /></View>
          <View style={styles.inputGroup}><Text style={styles.label}>Frequency</Text>
            <View style={styles.chipRow}>
              {FREQUENCIES.map(f => (
                <TouchableOpacity key={f} style={[styles.chip, form.frequency === f && styles.chipActive]} onPress={() => setForm({...form, frequency: f})}>
                  <Text style={[styles.chipText, form.frequency === f && styles.chipTextActive]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.inputGroup}><Text style={styles.label}>Day of Month</Text><TextInput style={styles.input} keyboardType="number-pad" value={form.dayOfMonth} onChangeText={x => setForm({...form, dayOfMonth: x})} placeholder="1" placeholderTextColor={t.colors.medium} /></View>
          <View style={styles.inputGroup}><Text style={styles.label}>Type</Text>
            <View style={styles.chipRow}>
              {['expense', 'sale'].map(type => (
                <TouchableOpacity key={type} style={[styles.chip, form.type === type && styles.chipActive]} onPress={() => setForm({...form, type})}>
                  <Text style={[styles.chipText, form.type === type && styles.chipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}><Text style={styles.saveText}>Add</Text></TouchableOpacity>
        </View>
      </Modal>
      <Toast message={toast.message} visible={toast.visible} type={toast.type} onHide={() => setToast({...toast, visible: false})} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.colors.surface, paddingTop: 52, paddingBottom: t.spacing.md, paddingHorizontal: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  title: { fontSize: 18, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.primary, justifyContent: 'center', alignItems: 'center' },
  list: { padding: t.spacing.lg, paddingBottom: 40 },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: t.colors.secondary, borderRadius: t.radius.button, paddingVertical: 14, marginBottom: 16 },
  generateText: { color: t.colors.white, fontSize: 16, fontFamily: t.typography.bodySemiBold },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.surface, borderRadius: 16, borderWidth: 1, borderColor: t.colors.border, padding: 16, marginBottom: 8, ...t.shadows.sm },
  cardInfo: { flex: 1 },
  name: { fontSize: 15, fontFamily: t.typography.bodySemiBold, fontWeight: '600', color: t.colors.dark },
  meta: { fontSize: 12, fontFamily: t.typography.body, color: t.colors.medium, marginTop: 2 },
  dueDate: { fontSize: 12, fontFamily: t.typography.bodyMedium, color: t.colors.primary, marginTop: 2 },
  amount: { fontSize: 15, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.primary, marginRight: 12 },
  deleteBtn: { padding: 6 },
  emptyText: { textAlign: 'center', color: t.colors.medium, marginTop: 40, fontFamily: t.typography.body },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontFamily: t.typography.bodyBold, fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { backgroundColor: t.colors.background, borderRadius: t.radius.input, borderWidth: 1.5, borderColor: t.colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, fontFamily: t.typography.body, color: t.colors.dark, height: 44 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: t.radius.pill, backgroundColor: t.colors.background, borderWidth: 1, borderColor: t.colors.border },
  chipActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  chipText: { fontSize: 13, fontFamily: t.typography.bodyMedium, color: t.colors.medium },
  chipTextActive: { color: t.colors.white },
  saveBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveText: { color: t.colors.white, fontSize: 16, fontFamily: t.typography.bodySemiBold },
});

export default RecurringTransactionsScreen;
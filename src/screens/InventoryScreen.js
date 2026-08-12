import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { addDocument, updateDocument, deleteDocument, getDocuments } from '../services/firestoreService';
import { t } from '../styles/designSystem';
import Modal from '../components/Modal';

const CATEGORIES = ['Food', 'Beverages', 'Household', 'Personal Care', 'School Supplies', 'Medicine', 'Others'];

const InventoryScreen = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ item_name: '', category: CATEGORIES[0], unit: 'pcs', cost_price: '', selling_price: '', current_stock: '', low_stock_threshold: '5' });

  const fetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const docs = await getDocuments('inventory', [{ field: 'user_id', operator: '==', value: user.uid }]);
    setItems(docs.sort((a, b) => a.item_name?.localeCompare(b.item_name)));
    setLoading(false);
  }, [user]);

  useFocusEffect(useCallback(() => { fetch(); }, [fetch]));

  const resetForm = () => { setForm({ item_name: '', category: CATEGORIES[0], unit: 'pcs', cost_price: '', selling_price: '', current_stock: '', low_stock_threshold: '5' }); setEditing(null); };
  const openAdd = () => { resetForm(); setModalVisible(true); };
  const openEdit = (item) => { setEditing(item); setForm({ item_name: item.item_name, category: item.category, unit: item.unit, cost_price: item.cost_price?.toString(), selling_price: item.selling_price?.toString(), current_stock: item.current_stock?.toString(), low_stock_threshold: item.low_stock_threshold?.toString() }); setModalVisible(true); };

  const handleSave = async () => {
    const cp = parseFloat(form.cost_price); const sp = parseFloat(form.selling_price); const st = parseInt(form.current_stock);
    if (!form.item_name.trim() || isNaN(cp) || isNaN(sp) || isNaN(st)) { Alert.alert('Invalid', 'Fill all fields correctly.'); return; }
    const data = { user_id: user.uid, item_name: form.item_name.trim(), category: form.category, unit: form.unit, cost_price: cp, selling_price: sp, current_stock: st, low_stock_threshold: parseInt(form.low_stock_threshold) || 5, created_at: new Date().toISOString() };
    try {
      if (editing) { await updateDocument('inventory', editing.id, data); } else { await addDocument('inventory', data); }
      setModalVisible(false); fetch();
    } catch { Alert.alert('Error', 'Save failed.'); }
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Remove this item?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { await deleteDocument('inventory', id); fetch(); } }]);
  };

  const getStatus = (item) => {
    if (item.current_stock <= 0) return { label: 'Out', color: t.colors.danger, bg: t.colors.dangerLight };
    if (item.current_stock <= item.low_stock_threshold) return { label: 'Low', color: t.colors.warning, bg: t.colors.warningLight };
    return { label: 'In Stock', color: t.colors.success, bg: t.colors.successLight };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.background} />
      {loading ? <ActivityIndicator size="large" color={t.colors.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.headerRow}>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryChip, { backgroundColor: t.colors.primaryLight }]}>
                  <Text style={[styles.summaryText, { color: t.colors.primary }]}>{items.length} Items</Text>
                </View>
                <View style={[styles.summaryChip, { backgroundColor: t.colors.warningLight }]}>
                  <Text style={[styles.summaryText, { color: t.colors.warning }]}>{items.filter(i => i.current_stock <= i.low_stock_threshold).length} Low Stock</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={openAdd} activeOpacity={0.7}>
                <Ionicons name="add" size={20} color={t.colors.white} />
                <Text style={styles.addText}>Add</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const status = getStatus(item);
            return (
              <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} onLongPress={() => handleDelete(item.id)} activeOpacity={0.8}>
                <View style={styles.cardLeft}>
                  <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                  <View>
                    <Text style={styles.itemName}>{item.item_name}</Text>
                    <Text style={styles.itemMeta}>{item.category} • {item.unit}</Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.stockText}>{item.current_stock}</Text>
                  <Text style={[styles.stockLabel, { color: status.color }]}>{status.label}</Text>
                  <Text style={styles.priceText}>₱{item.selling_price?.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={t.colors.medium} />
              <Text style={styles.emptyText}>No stock items</Text>
              <Text style={styles.emptySub}>Tap Add to start tracking inventory</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} onClose={() => setModalVisible(false)} title={editing ? 'Edit Item' : 'New Item'}>
        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}><Text style={styles.label}>Item Name *</Text><TextInput style={styles.input} value={form.item_name} onChangeText={t => setForm({...form, item_name: t})} placeholder="Product name" placeholderTextColor={t.colors.medium} /></View>
          <View style={styles.inputGroup}><Text style={styles.label}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.chipRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity key={c} style={[styles.chip, form.category === c && styles.chipActive]} onPress={() => setForm({...form, category: c})} activeOpacity={0.7}>
                  <Text style={[styles.chipText, form.category === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View></ScrollView>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>Cost *</Text><TextInput style={styles.input} keyboardType="decimal-pad" value={form.cost_price} onChangeText={t => setForm({...form, cost_price: t})} placeholder="0" placeholderTextColor={t.colors.medium} /></View>
            <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>Selling *</Text><TextInput style={styles.input} keyboardType="decimal-pad" value={form.selling_price} onChangeText={t => setForm({...form, selling_price: t})} placeholder="0" placeholderTextColor={t.colors.medium} /></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>Stock *</Text><TextInput style={styles.input} keyboardType="number-pad" value={form.current_stock} onChangeText={t => setForm({...form, current_stock: t})} placeholder="0" placeholderTextColor={t.colors.medium} /></View>
            <View style={[styles.inputGroup, { flex: 1 }]}><Text style={styles.label}>Unit</Text><TextInput style={styles.input} value={form.unit} onChangeText={t => setForm({...form, unit: t})} placeholder="pcs" placeholderTextColor={t.colors.medium} /></View>
          </View>
          <View style={styles.inputGroup}><Text style={styles.label}>Low Stock Alert</Text><TextInput style={styles.input} keyboardType="number-pad" value={form.low_stock_threshold} onChangeText={t => setForm({...form, low_stock_threshold: t})} placeholder="5" placeholderTextColor={t.colors.medium} /></View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}><Text style={styles.saveText}>{editing ? 'Update' : 'Add Item'}</Text></TouchableOpacity>
        </ScrollView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  list: { padding: t.spacing.lg, paddingBottom: 30 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.xl },
  summaryRow: { flexDirection: 'row', gap: t.spacing.sm },
  summaryChip: { paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.xs, borderRadius: t.radius.pill },
  summaryText: { fontSize: 12, fontFamily: 'Inter-SemiBold', fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.xs, backgroundColor: t.colors.primary, paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.md, borderRadius: t.radius.button },
  addText: { color: t.colors.white, fontSize: 14, fontFamily: 'Inter-SemiBold', fontWeight: '600' },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.lg, marginBottom: t.spacing.md, ...t.shadows.sm },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  itemName: { fontSize: 15, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.dark },
  itemMeta: { fontSize: 12, fontFamily: 'Inter-Regular', color: t.colors.medium, marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  stockText: { fontSize: 20, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark },
  stockLabel: { fontSize: 11, fontFamily: 'Inter-Bold', fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  priceText: { fontSize: 12, fontFamily: 'Inter-Regular', color: t.colors.medium, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.dark, marginTop: t.spacing.lg },
  emptySub: { fontSize: 13, fontFamily: 'Inter-Regular', color: t.colors.medium, marginTop: t.spacing.xs },
  modalContent: { marginTop: t.spacing.sm, maxHeight: 450 },
  inputGroup: { marginBottom: t.spacing.md },
  label: { fontSize: 12, fontFamily: 'Inter-Bold', fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: t.spacing.sm },
  input: { backgroundColor: t.colors.background, borderRadius: t.radius.input, borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.spacing.md, paddingVertical: 12, fontSize: 15, fontFamily: 'Inter-Regular', color: t.colors.dark },
  chipRow: { flexDirection: 'row', gap: t.spacing.sm },
  chip: { paddingHorizontal: t.spacing.md, paddingVertical: t.spacing.sm, borderRadius: t.radius.pill, backgroundColor: t.colors.background, borderWidth: 1, borderColor: t.colors.border },
  chipActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  chipText: { fontSize: 12, fontFamily: 'Inter-Medium', fontWeight: '500', color: t.colors.medium },
  chipTextActive: { color: t.colors.white },
  row: { flexDirection: 'row', gap: t.spacing.md },
  saveBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center', marginTop: t.spacing.sm },
  saveText: { color: t.colors.white, fontSize: 16, fontFamily: 'Inter-SemiBold', fontWeight: '600' },
});

export default InventoryScreen;
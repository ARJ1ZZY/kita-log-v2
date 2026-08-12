import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView, Animated, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { addDocument, getDocuments } from '../services/firestoreService';
import { t } from '../styles/designSystem';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const AddTransactionModal = ({ visible, onClose, navigation }) => {
  const { user } = useAuth();
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [quantity, setQuantity] = useState('1');
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }).start();
      fetchInventory();
    } else {
      Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  const fetchInventory = async () => {
    if (!user) return;
    const items = await getDocuments('inventory', [{ field: 'user_id', operator: '==', value: user.uid }]);
    setInventory(items.filter(i => i.current_stock > 0));
  };

  const handleSave = async () => {
    const amt = parseFloat(amount);
    const qty = parseInt(quantity);
    if (!description.trim() || isNaN(amt) || amt <= 0) { Alert.alert('Invalid', 'Enter valid description and amount.'); return; }

    try {
      if (type === 'sale' && selectedItem) {
        if (qty > selectedItem.current_stock) { Alert.alert('Error', 'Not enough stock!'); return; }
        await updateDoc(doc(db, 'inventory', selectedItem.id), { current_stock: selectedItem.current_stock - qty });
      }

      await addDocument('transactions', {
        user_id: user.uid, type, amount: amt, description: description.trim(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        item_id: selectedItem?.id || null, quantity: type === 'sale' ? qty : 0,
        created_at: new Date().toISOString(),
      });

      onClose();
      setAmount(''); setDescription(''); setSelectedItem(null); setQuantity('1');
      navigation?.navigate('Transactions');
    } catch (e) { Alert.alert('Error', 'Save failed.'); }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.handle} />
          <View style={styles.typeRow}>
            <TouchableOpacity style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]} onPress={() => setType('expense')} activeOpacity={0.7}>
              <Ionicons name="arrow-down-circle" size={18} color={type === 'expense' ? t.colors.white : t.colors.danger} />
              <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Expense</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeBtn, type === 'sale' && styles.typeBtnSale]} onPress={() => setType('sale')} activeOpacity={0.7}>
              <Ionicons name="arrow-up-circle" size={18} color={type === 'sale' ? t.colors.white : t.colors.success} />
              <Text style={[styles.typeText, type === 'sale' && styles.typeTextActive]}>Income</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amount</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor={t.colors.medium} />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="What was this for?" placeholderTextColor={t.colors.medium} />
          </View>
          {type === 'sale' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Select Item (from stock)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemRow}>
                  {inventory.map(item => (
                    <TouchableOpacity key={item.id} style={[styles.itemChip, selectedItem?.id === item.id && styles.itemChipActive]} onPress={() => { setSelectedItem(item); setAmount(item.selling_price?.toString()); setDescription(item.item_name); }} activeOpacity={0.7}>
                      <Text style={[styles.itemChipText, selectedItem?.id === item.id && styles.itemChipTextActive]} numberOfLines={1}>{item.item_name} ({item.current_stock})</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              {selectedItem && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Quantity</Text>
                  <TextInput style={styles.input} keyboardType="number-pad" value={quantity} onChangeText={setQuantity} placeholder="1" placeholderTextColor={t.colors.medium} />
                </View>
              )}
            </>
          )}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveText}>Save Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: t.colors.overlay },
  sheet: { backgroundColor: t.colors.surface, borderTopLeftRadius: t.radius.modal, borderTopRightRadius: t.radius.modal, padding: t.spacing.xl, paddingBottom: 40, maxHeight: SCREEN_HEIGHT * 0.85 },
  handle: { width: 40, height: 5, backgroundColor: t.colors.border, borderRadius: 3, alignSelf: 'center', marginBottom: t.spacing.xxl },
  typeRow: { flexDirection: 'row', gap: t.spacing.md, marginBottom: t.spacing.xl },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: t.spacing.sm, paddingVertical: t.spacing.md, borderRadius: t.radius.button, borderWidth: 1.5, borderColor: t.colors.border },
  typeBtnExpense: { backgroundColor: t.colors.danger, borderColor: t.colors.danger },
  typeBtnSale: { backgroundColor: t.colors.success, borderColor: t.colors.success },
  typeText: { fontSize: 15, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.medium },
  typeTextActive: { color: t.colors.white },
  inputGroup: { marginBottom: t.spacing.lg },
  label: { fontSize: 12, fontFamily: 'Inter-Bold', fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: t.spacing.sm },
  input: { backgroundColor: t.colors.background, borderRadius: t.radius.input, borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.spacing.lg, paddingVertical: 14, fontSize: 16, fontFamily: 'Inter-Regular', color: t.colors.dark },
  itemRow: { marginBottom: t.spacing.sm },
  itemChip: { paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.sm, borderRadius: t.radius.pill, backgroundColor: t.colors.background, borderWidth: 1, borderColor: t.colors.border, marginRight: t.spacing.sm, maxWidth: 200 },
  itemChipActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  itemChipText: { fontSize: 13, fontFamily: 'Inter-Medium', fontWeight: '500', color: t.colors.dark },
  itemChipTextActive: { color: t.colors.white },
  saveBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 16, alignItems: 'center', marginBottom: t.spacing.md },
  saveText: { color: t.colors.white, fontSize: 16, fontFamily: 'Inter-SemiBold', fontWeight: '600' },
  cancelBtn: { backgroundColor: t.colors.background, borderRadius: t.radius.button, paddingVertical: 16, alignItems: 'center' },
  cancelText: { fontSize: 16, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.medium },
});

export default AddTransactionModal;
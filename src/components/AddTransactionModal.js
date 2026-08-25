import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ScrollView,
  Animated, Dimensions, Alert, PanResponder, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { addDocument, getDocuments } from '../services/firestoreService';
import { t } from '../styles/designSystem';
import { useFormat } from '../utils/format';
import DatePickerModal from './DatePickerModal';
import ReceiptModal from './ReceiptModal';
import Toast from './Toast';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const HALF_HEIGHT = Math.round(SCREEN_HEIGHT * 0.65);
const FULLSCREEN_HEIGHT = SCREEN_HEIGHT - 20;
const MIN_HEIGHT = 320;
const FULLSCREEN_THRESHOLD = Math.round(SCREEN_HEIGHT * 0.8);
const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

const AddTransactionModal = ({ visible, onClose, onTransactionAdded }) => {
  const { user, activeBusinessId } = useAuth();
  const { formatCurrency } = useFormat();
  const [type, setType] = useState('income');
  const [cart, setCart] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeError, setBarcodeError] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(HALF_HEIGHT)).current;
  const heightRef = useRef(HALF_HEIGHT);
  const startHeightRef = useRef(HALF_HEIGHT);

  const showToast = (msg, type = 'success') => setToast({ visible: true, message: msg, type });

  const animateToHeight = (toValue, duration = 200) => {
    Animated.timing(heightAnim, { toValue, duration, useNativeDriver: false }).start(() => { heightRef.current = toValue; });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { startHeightRef.current = heightRef.current; },
      onPanResponderMove: (evt, gestureState) => {
        const newHeight = Math.max(MIN_HEIGHT, Math.min(FULLSCREEN_HEIGHT, startHeightRef.current + gestureState.dy));
        heightRef.current = newHeight;
        heightAnim.setValue(newHeight);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const finalHeight = heightRef.current;
        if (finalHeight > FULLSCREEN_THRESHOLD) { setIsFullscreen(true); animateToHeight(FULLSCREEN_HEIGHT); }
        else { setIsFullscreen(false); animateToHeight(HALF_HEIGHT); }
      },
      onPanResponderTerminate: () => {
        const finalHeight = heightRef.current;
        if (finalHeight > FULLSCREEN_THRESHOLD) { setIsFullscreen(true); animateToHeight(FULLSCREEN_HEIGHT); }
        else { setIsFullscreen(false); animateToHeight(HALF_HEIGHT); }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      setType('income');
      setCart([]);
      setExpenseAmount('');
      setDescription('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setBarcodeInput('');
      setBarcodeError('');
      setReceiptData(null);
      setIsFullscreen(false);
      setSaving(false);
      heightRef.current = HALF_HEIGHT;
      heightAnim.setValue(HALF_HEIGHT);
      slideAnim.setValue(SCREEN_HEIGHT);
      overlayOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      fetchInventory();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const fetchInventory = async () => {
    if (!user || !activeBusinessId) return;
    const items = await getDocuments('inventory', [{ field: 'business_id', operator: '==', value: activeBusinessId }]);
    setInventory(items.filter(i => i.current_stock > 0));
  };

  const handleBarcodeScan = () => {
    const code = barcodeInput.trim();
    if (!code) {
      setBarcodeError('Enter a barcode');
      return;
    }
    const item = inventory.find(i => i.barcode === code);
    if (item) {
      setBarcodeError('');
      addToCart(item);
      setBarcodeInput('');
      showToast(`${item.item_name} added to cart`, 'success');
    } else {
      setBarcodeError('Barcode not found');
    }
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c.item.id === item.id);
    if (existing) {
      if (existing.quantity >= item.current_stock) return;
      setCart(prev => prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart(prev => [...prev, { item, quantity: 1 }]);
    }
  };

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(c => {
      if (c.item.id !== itemId) return c;
      const newQty = c.quantity + delta;
      if (newQty < 1 || newQty > c.item.current_stock) return c;
      return { ...c, quantity: newQty };
    }));
  };

  const removeFromCart = (itemId) => setCart(prev => prev.filter(c => c.item.id !== itemId));

  const cartTotal = cart.reduce((sum, c) => sum + c.item.selling_price * c.quantity, 0);
  const displayAmount = type === 'income' ? cartTotal : (parseFloat(expenseAmount) || 0);

  const handleSave = async () => {
    if (!user || !activeBusinessId || saving) return;
    setSaving(true);
    try {
      if (type === 'income') {
        if (cart.length === 0) { Alert.alert('Empty Cart', 'Add at least one item.'); return; }
        for (const c of cart) {
          const newStock = c.item.current_stock - c.quantity;
          await updateDoc(doc(db, 'inventory', c.item.id), { current_stock: newStock });
        }
        const itemsArray = cart.map(c => ({ item_id: c.item.id, name: c.item.item_name, quantity: c.quantity, price: c.item.selling_price }));
        const txData = {
          business_id: activeBusinessId,
          type: 'sale',
          amount: cartTotal,
          description: itemsArray.map(i => `${i.name} x${i.quantity}`).join(', '),
          date: transactionDate,
          time: new Date().toTimeString().split(' ')[0].substring(0, 5),
          items: itemsArray,
          created_at: new Date().toISOString(),
        };
        await addDocument('transactions', txData);
        setReceiptData({ ...txData, items: itemsArray });
      } else {
        const amt = parseFloat(expenseAmount);
        if (isNaN(amt) || amt <= 0) { Alert.alert('Invalid', 'Enter a valid amount.'); return; }
        if (!description.trim()) { Alert.alert('Required', 'Enter a description.'); return; }
        const txData = {
          business_id: activeBusinessId,
          type: 'expense',
          amount: amt,
          description: description.trim(),
          date: transactionDate,
          time: new Date().toTimeString().split(' ')[0].substring(0, 5),
          items: [],
          created_at: new Date().toISOString(),
        };
        await addDocument('transactions', txData);
        setReceiptData(txData);
      }
      if (onTransactionAdded) onTransactionAdded();
      onClose();
    } catch (e) {
      Alert.alert('Error', 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleReceiptClose = () => {
    setReceiptData(null);
    showToast('Transaction saved', 'success');
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
          <Animated.View style={[styles.sheet, { height: heightAnim, transform: [{ translateY: slideAnim }] }]}>
            <View {...panResponder.panHandlers} style={styles.dragArea}>
              <View style={styles.handlePill} />
              <Text style={styles.dragHint}>Drag to expand</Text>
            </View>

            <View style={styles.fixedTop}>
              <View style={styles.typeToggle}>
                <TouchableOpacity style={[styles.typeBtn, type === 'income' && styles.typeBtnIncome]} onPress={() => setType('income')}>
                  <Ionicons name="arrow-up-circle" size={18} color={type === 'income' ? t.colors.white : t.colors.success} />
                  <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Income</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpense]} onPress={() => setType('expense')}>
                  <Ionicons name="arrow-down-circle" size={18} color={type === 'expense' ? t.colors.white : t.colors.danger} />
                  <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Expense</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.amountDisplay}>{formatCurrency(displayAmount)}</Text>

              <TouchableOpacity style={styles.dateBtn} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={16} color={t.colors.primary} />
                <Text style={styles.dateBtnText}>{transactionDate}</Text>
              </TouchableOpacity>

              <View style={styles.barcodeRow}>
                <TextInput
                  style={[styles.barcodeInput, barcodeError ? styles.barcodeInputError : null]}
                  placeholder="Scan barcode..."
                  placeholderTextColor={t.colors.medium}
                  value={barcodeInput}
                  onChangeText={(text) => { setBarcodeInput(text); setBarcodeError(''); }}
                  onSubmitEditing={handleBarcodeScan}
                  returnKeyType="done"
                />
                <TouchableOpacity style={styles.barcodeBtn} onPress={handleBarcodeScan}>
                  <Ionicons name="barcode-outline" size={20} color={t.colors.white} />
                </TouchableOpacity>
              </View>
              {barcodeError ? <Text style={styles.barcodeErrorText}>{barcodeError}</Text> : null}
            </View>

            <ScrollView style={styles.middleScroll} contentContainerStyle={styles.middleScrollContent} showsVerticalScrollIndicator>
              {type === 'income' ? (
                <>
                  <Text style={styles.sectionLabel}>Select Items</Text>
                  {isFullscreen ? (
                    <View style={styles.itemGrid}>
                      {inventory.map(item => (
                        <TouchableOpacity key={item.id} style={styles.itemCardGrid} onPress={() => addToCart(item)} activeOpacity={0.7}>
                          <View style={[styles.itemIcon, { backgroundColor: t.colors.primaryLight }]}><Ionicons name="cube-outline" size={22} color={t.colors.primary} /></View>
                          <Text style={styles.itemNameGrid} numberOfLines={2}>{item.item_name}</Text>
                          <Text style={styles.itemPrice}>{formatCurrency(item.selling_price)}</Text>
                          <Text style={styles.itemStock}>Stock: {item.current_stock}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemScrollContent}>
                      {inventory.map(item => (
                        <TouchableOpacity key={item.id} style={styles.itemCard} onPress={() => addToCart(item)} activeOpacity={0.7}>
                          <View style={[styles.itemIcon, { backgroundColor: t.colors.primaryLight }]}><Ionicons name="cube-outline" size={20} color={t.colors.primary} /></View>
                          <Text style={styles.itemName} numberOfLines={1}>{item.item_name}</Text>
                          <Text style={styles.itemPrice}>{formatCurrency(item.selling_price)}</Text>
                          <Text style={styles.itemStock}>Stock: {item.current_stock}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}

                  {cart.length > 0 && (
                    <View style={styles.cartContainer}>
                      <Text style={styles.sectionLabel}>Cart</Text>
                      {cart.map(c => (
                        <View key={c.item.id} style={styles.cartRow}>
                          <View style={styles.cartInfo}>
                            <Text style={styles.cartName} numberOfLines={1}>{c.item.item_name}</Text>
                            <Text style={styles.cartMeta}>{formatCurrency(c.item.selling_price)} each</Text>
                          </View>
                          <View style={styles.qtyControls}>
                            <TouchableOpacity onPress={() => updateQuantity(c.item.id, -1)} style={styles.qtyBtn}><Ionicons name="remove" size={16} color={t.colors.primary} /></TouchableOpacity>
                            <Text style={styles.qtyText}>{c.quantity}</Text>
                            <TouchableOpacity onPress={() => updateQuantity(c.item.id, 1)} style={styles.qtyBtn}><Ionicons name="add" size={16} color={t.colors.primary} /></TouchableOpacity>
                          </View>
                          <Text style={styles.cartTotal}>{formatCurrency(c.item.selling_price * c.quantity)}</Text>
                          <TouchableOpacity onPress={() => removeFromCart(c.item.id)} style={styles.removeBtn}><Ionicons name="trash-outline" size={16} color={t.colors.danger} /></TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.quickAmountRow}>
                    {QUICK_AMOUNTS.map(amt => (
                      <TouchableOpacity key={amt} style={styles.quickAmountChip} onPress={() => setExpenseAmount(amt.toString())}>
                        <Text style={styles.quickAmountText}>{formatCurrency(amt)}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Amount</Text>
                    <TextInput style={styles.input} keyboardType="decimal-pad" value={expenseAmount} onChangeText={setExpenseAmount} placeholder="0.00" placeholderTextColor={t.colors.medium} />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="What was this for?" placeholderTextColor={t.colors.medium} />
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.bottomButtons}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
                {saving ? <ActivityIndicator color={t.colors.white} /> : <Text style={styles.saveText}>Save Transaction</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.7}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      <DatePickerModal visible={showDatePicker} onClose={() => setShowDatePicker(false)} selectedDate={transactionDate} onSelect={(date) => { setTransactionDate(date); setShowDatePicker(false); }} />
      <ReceiptModal visible={!!receiptData} onClose={handleReceiptClose} receiptData={receiptData} />
      <Toast message={toast.message} visible={toast.visible} type={toast.type} onHide={() => setToast({ ...toast, visible: false })} />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: t.colors.overlay },
  sheet: { backgroundColor: t.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: t.spacing.xl, paddingBottom: 24, overflow: 'hidden' },
  dragArea: { alignItems: 'center', paddingVertical: 12, marginBottom: 4 },
  handlePill: { width: 36, height: 5, borderRadius: 3, backgroundColor: t.colors.border },
  dragHint: { fontSize: 10, fontFamily: t.typography.body, color: t.colors.medium, marginTop: 4 },
  fixedTop: { marginBottom: 8 },
  typeToggle: { flexDirection: 'row', gap: t.spacing.md, marginBottom: t.spacing.md },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: t.spacing.sm, paddingVertical: t.spacing.md, borderRadius: t.radius.button, borderWidth: 1.5, borderColor: t.colors.border },
  typeBtnIncome: { backgroundColor: t.colors.success, borderColor: t.colors.success },
  typeBtnExpense: { backgroundColor: t.colors.danger, borderColor: t.colors.danger },
  typeText: { fontSize: 15, fontFamily: t.typography.bodySemiBold, fontWeight: '600', color: t.colors.medium },
  typeTextActive: { color: t.colors.white },
  amountDisplay: { fontSize: 32, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark, textAlign: 'center', marginBottom: 4 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 6, marginBottom: 8 },
  dateBtnText: { fontSize: 14, fontFamily: t.typography.bodyMedium, color: t.colors.primary },
  barcodeRow: { flexDirection: 'row', gap: 8, marginBottom: 4, alignItems: 'center' },
  barcodeInput: { flex: 1, backgroundColor: t.colors.background, borderRadius: t.radius.input, borderWidth: 1.5, borderColor: t.colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, fontFamily: t.typography.body, color: t.colors.dark, height: 44 },
  barcodeInputError: { borderColor: t.colors.danger },
  barcodeErrorText: { color: t.colors.danger, fontSize: 12, fontFamily: t.typography.body, marginBottom: 8 },
  barcodeBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.input, width: 48, height: 44, justifyContent: 'center', alignItems: 'center' },
  middleScroll: { flex: 1, marginTop: 4 },
  middleScrollContent: { paddingBottom: 8 },
  sectionLabel: { fontSize: 14, fontFamily: t.typography.bodyBold, fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  itemScrollContent: { paddingRight: t.spacing.lg },
  itemCard: { width: 130, backgroundColor: t.colors.background, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.md, marginRight: t.spacing.md, alignItems: 'center' },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.md },
  itemCardGrid: { width: '47%', backgroundColor: t.colors.background, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.md, alignItems: 'center' },
  itemIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  itemName: { fontSize: 12, fontFamily: t.typography.bodySemiBold, fontWeight: '600', color: t.colors.dark, textAlign: 'center' },
  itemNameGrid: { fontSize: 13, fontFamily: t.typography.bodySemiBold, fontWeight: '600', color: t.colors.dark, textAlign: 'center' },
  itemPrice: { fontSize: 13, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.primary, marginTop: 2 },
  itemStock: { fontSize: 10, fontFamily: t.typography.body, color: t.colors.medium, marginTop: 2 },
  cartContainer: { marginTop: 8 },
  cartRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  cartInfo: { flex: 1 },
  cartName: { fontSize: 14, fontFamily: t.typography.bodySemiBold, fontWeight: '600', color: t.colors.dark },
  cartMeta: { fontSize: 11, fontFamily: t.typography.body, color: t.colors.medium },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 8 },
  qtyBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: t.colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  qtyText: { fontSize: 14, fontFamily: t.typography.bodySemiBold, color: t.colors.dark },
  cartTotal: { fontSize: 14, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark, minWidth: 70, textAlign: 'right' },
  removeBtn: { padding: 4 },
  quickAmountRow: { flexDirection: 'row', gap: t.spacing.sm, flexWrap: 'wrap', marginBottom: 8 },
  quickAmountChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: t.radius.pill, backgroundColor: t.colors.background, borderWidth: 1, borderColor: t.colors.border },
  quickAmountText: { fontSize: 12, fontFamily: t.typography.bodySemiBold, fontWeight: '600', color: t.colors.primary },
  inputGroup: { marginBottom: 8 },
  label: { fontSize: 12, fontFamily: t.typography.bodyBold, fontWeight: '700', color: t.colors.medium, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  input: { backgroundColor: t.colors.background, borderRadius: t.radius.input, borderWidth: 1.5, borderColor: t.colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, fontFamily: t.typography.body, color: t.colors.dark, height: 44 },
  bottomButtons: { marginTop: 8 },
  saveBtn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center', marginBottom: 6 },
  saveText: { color: t.colors.white, fontSize: 16, fontFamily: t.typography.bodySemiBold, fontWeight: '600' },
  cancelBtn: { backgroundColor: t.colors.background, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 16, fontFamily: t.typography.bodySemiBold, color: t.colors.medium },
});

export default AddTransactionModal;
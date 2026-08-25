import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { t } from '../styles/designSystem';
import { useFormat } from '../utils/format';

const ReceiptModal = ({ visible, onClose, receiptData, businessInfo }) => {
  const { formatCurrency } = useFormat();

  if (!receiptData) return null;

  const handlePrint = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .store-name { font-size: 20px; font-weight: bold; }
            .items { margin: 20px 0; border-top: 1px dashed #333; }
            .item-row { display: flex; justify-content: space-between; padding: 4px 0; }
            .total { border-top: 1px solid #000; margin-top: 10px; padding-top: 5px; font-size: 16px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">${businessInfo?.business_name || 'KITA-LOG'}</div>
            ${businessInfo?.address ? `<div>${businessInfo.address}</div>` : ''}
            ${businessInfo?.phone ? `<div>Tel: ${businessInfo.phone}</div>` : ''}
            <div>${receiptData.date} ${receiptData.time}</div>
          </div>
          <div class="items">
            ${receiptData.items?.map(item => `
              <div class="item-row">
                <span>${item.name} x${item.quantity}</span>
                <span>${formatCurrency(item.price * item.quantity)}</span>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <strong>Total: ${formatCurrency(receiptData.amount)}</strong>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      } else {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Print Receipt' });
      }
    } catch (e) {
      console.error('Print error:', e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="checkmark-circle" size={40} color={t.colors.success} />
            <Text style={styles.title}>Transaction Complete</Text>
          </View>
          <ScrollView style={styles.details}>
            <Text style={styles.label}>Date: {receiptData.date} {receiptData.time}</Text>
            <Text style={styles.label}>Type: {receiptData.type === 'sale' ? 'Income' : 'Expense'}</Text>
            <Text style={styles.label}>Amount: {formatCurrency(receiptData.amount)}</Text>
            {receiptData.description ? <Text style={styles.label}>Description: {receiptData.description}</Text> : null}
            {receiptData.items && receiptData.items.length > 0 && (
              <View style={styles.itemsTable}>
                <Text style={styles.sectionTitle}>Items</Text>
                {receiptData.items.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.name} x{item.quantity}</Text>
                    <Text style={styles.itemTotal}>{formatCurrency(item.price * item.quantity)}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
              <Ionicons name="print-outline" size={20} color={t.colors.white} />
              <Text style={styles.printText}>Print / Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.colors.overlay },
  card: { width: '85%', maxHeight: '80%', backgroundColor: t.colors.surface, borderRadius: 20, padding: 20, ...t.shadows.xl },
  header: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark, marginTop: 8 },
  details: { marginBottom: 16 },
  label: { fontSize: 14, fontFamily: t.typography.body, color: t.colors.dark, marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark, marginTop: 12, marginBottom: 8 },
  itemsTable: {},
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  itemName: { fontSize: 14, fontFamily: t.typography.bodyMedium, color: t.colors.dark, flex: 1 },
  itemTotal: { fontSize: 14, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.primary },
  buttonRow: { flexDirection: 'row', gap: 12 },
  printBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 14 },
  printText: { color: t.colors.white, fontSize: 16, fontFamily: t.typography.bodySemiBold, fontWeight: '600' },
  closeBtn: { flex: 1, backgroundColor: t.colors.background, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center' },
  closeText: { fontSize: 16, fontFamily: t.typography.bodySemiBold, color: t.colors.medium },
});

export default ReceiptModal;
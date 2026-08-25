import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../styles/designSystem';

const DatePickerModal = ({ visible, onClose, selectedDate, onSelect }) => {
  const [year, setYear] = useState(parseInt(selectedDate.split('-')[0]) || new Date().getFullYear());
  const [month, setMonth] = useState(parseInt(selectedDate.split('-')[1]) || new Date().getMonth() + 1);
  const [day, setDay] = useState(parseInt(selectedDate.split('-')[2]) || new Date().getDate());

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const handleSelect = () => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onSelect(dateStr);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Select Date</Text>
          <View style={styles.selectorRow}>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => setYear(y => y - 1)}>
              <Ionicons name="chevron-back" size={20} color={t.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.yearText}>{year}</Text>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => setYear(y => y + 1)}>
              <Ionicons name="chevron-forward" size={20} color={t.colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.selectorRow}>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => setMonth(m => m === 1 ? 12 : m - 1)}>
              <Ionicons name="chevron-back" size={20} color={t.colors.primary} />
            </TouchableOpacity>
            <Text style={styles.monthText}>{monthNames[month - 1]}</Text>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => setMonth(m => m === 12 ? 1 : m + 1)}>
              <Ionicons name="chevron-forward" size={20} color={t.colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={styles.daysGrid}>
            {[...Array(daysInMonth)].map((_, i) => {
              const d = i + 1;
              const isSelected = d === day;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
                  onPress={() => setDay(d)}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSelect}>
              <Text style={styles.saveText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.colors.overlay },
  card: { width: '85%', backgroundColor: t.colors.surface, borderRadius: 20, padding: 20, ...t.shadows.xl },
  title: { fontSize: 18, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark, textAlign: 'center', marginBottom: 16 },
  selectorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  arrowBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.background, justifyContent: 'center', alignItems: 'center' },
  yearText: { fontSize: 20, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark },
  monthText: { fontSize: 18, fontFamily: t.typography.bodySemiBold, fontWeight: '600', color: t.colors.dark },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16 },
  dayBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: t.colors.border },
  dayBtnSelected: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  dayText: { fontSize: 14, fontFamily: t.typography.bodyMedium, color: t.colors.dark },
  dayTextSelected: { color: t.colors.white },
  buttonRow: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, backgroundColor: t.colors.background, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 16, fontFamily: t.typography.bodySemiBold, color: t.colors.medium },
  saveBtn: { flex: 1, backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: 14, alignItems: 'center' },
  saveText: { fontSize: 16, fontFamily: t.typography.bodySemiBold, color: t.colors.white },
});

export default DatePickerModal;
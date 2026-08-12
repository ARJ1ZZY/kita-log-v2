import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../styles/colors';

const Modal = ({ visible, onClose, title, children }) => (
  <RNModal visible={visible} animationType="slide" transparent>
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}><Text style={styles.closeBtn}>✕</Text></TouchableOpacity>
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  </RNModal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContainer: { width: '90%', backgroundColor: theme.cardBackground, borderRadius: 16, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: theme.primaryText },
  closeBtn: { fontSize: 22, color: theme.secondaryText },
  content: {},
});

export default Modal;
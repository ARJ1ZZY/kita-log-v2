import React from 'react';
import { Modal as RNModal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../styles/designSystem';

const Modal = ({ visible, onClose, title, children }) => (
  <RNModal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={styles.overlay}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={t.colors.medium} /></TouchableOpacity>
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  </RNModal>
);

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: t.colors.overlay },
  modalContainer: { width: '90%', backgroundColor: t.colors.surface, borderRadius: t.radius.modal, padding: t.spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.spacing.lg },
  title: { fontSize: 20, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark },
  content: {},
});

export default Modal;
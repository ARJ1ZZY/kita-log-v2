import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../context/AuthContext';
import { getDocuments } from '../services/firestoreService';
import { t } from '../styles/designSystem';

const BackupScreen = ({ onClose }) => {
  const { user } = useAuth();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const transactions = await getDocuments('transactions', [{ field: 'user_id', operator: '==', value: user.uid }]);
      const inventory = await getDocuments('inventory', [{ field: 'user_id', operator: '==', value: user.uid }]);
      const budgets = await getDocuments('budgets', [{ field: 'user_id', operator: '==', value: user.uid }]);
      const backup = { version: '1.0', exported_at: new Date().toISOString(), data: { transactions, inventory, budgets } };
      const json = JSON.stringify(backup, null, 2);
      const path = `${FileSystem.cacheDirectory}backup_${new Date().toISOString().split('T')[0]}.json`;
      await FileSystem.writeAsStringAsync(path, json);
      await Sharing.shareAsync(path, { mimeType: 'application/json', dialogTitle: 'Save Backup' });
      Alert.alert('Success', 'Backup exported!');
    } catch { Alert.alert('Error', 'Export failed.'); }
    setExporting(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.6}>
          <Ionicons name="arrow-back" size={24} color={t.colors.dark} />
        </TouchableOpacity>
        <Text style={styles.title}>Backup & Restore</Text>
        <View style={{ width: 44 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.iconCircle}><Ionicons name="cloud-upload-outline" size={48} color={t.colors.primary} /></View>
        <Text style={styles.heading}>Export Your Data</Text>
        <Text style={styles.desc}>Download all transactions, inventory, and budgets as a JSON file you can restore later.</Text>
        <TouchableOpacity style={styles.btn} onPress={handleExport} disabled={exporting} activeOpacity={0.7}>
          {exporting ? <ActivityIndicator color={t.colors.white} /> : <Text style={styles.btnText}>Export Backup</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.colors.surface, paddingTop: 52, paddingBottom: t.spacing.md, paddingHorizontal: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  title: { fontSize: 18, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: t.spacing.xxl },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: t.colors.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: t.spacing.xxl },
  heading: { fontSize: 22, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark, marginBottom: t.spacing.md },
  desc: { fontSize: 14, fontFamily: 'Inter-Regular', color: t.colors.medium, textAlign: 'center', lineHeight: 22, marginBottom: t.spacing.xxxl, paddingHorizontal: t.spacing.xl },
  btn: { backgroundColor: t.colors.primary, borderRadius: t.radius.button, paddingVertical: t.spacing.lg, paddingHorizontal: t.spacing.xxxl },
  btnText: { color: t.colors.white, fontSize: 16, fontFamily: 'Inter-SemiBold', fontWeight: '600' },
});

export default BackupScreen;
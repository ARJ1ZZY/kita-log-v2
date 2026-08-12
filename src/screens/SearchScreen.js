import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import { t } from '../styles/designSystem';

const TABS = ['Transactions', 'Inventory'];

const SearchScreen = ({ onClose }) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Transactions');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || search.length < 2) { setResults([]); return; }
    const fetch = async () => {
      setLoading(true);
      const term = search.toLowerCase();
      if (activeTab === 'Transactions') {
        const q = query(collection(db, 'transactions'), where('user_id', '==', user.uid));
        const snap = await getDocs(q);
        const items = [];
        snap.forEach(doc => { const d = doc.data(); if (d.description?.toLowerCase().includes(term)) items.push({ id: doc.id, ...d, _type: 'tx' }); });
        setResults(items.sort((a, b) => b.date?.localeCompare(a.date)));
      } else {
        const q = query(collection(db, 'inventory'), where('user_id', '==', user.uid));
        const snap = await getDocs(q);
        const items = [];
        snap.forEach(doc => { const d = doc.data(); if (d.item_name?.toLowerCase().includes(term) || d.category?.toLowerCase().includes(term)) items.push({ id: doc.id, ...d, _type: 'inv' }); });
        setResults(items);
      }
      setLoading(false);
    };
    fetch();
  }, [search, activeTab, user]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.6}>
          <Ionicons name="arrow-back" size={24} color={t.colors.dark} />
        </TouchableOpacity>
        <TextInput style={styles.searchInput} placeholder="Search transactions & items..." placeholderTextColor={t.colors.medium} value={search} onChangeText={setSearch} autoFocus />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.6}>
            <Ionicons name="close-circle" size={20} color={t.colors.medium} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.tabRow}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)} activeOpacity={0.7}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator size="large" color={t.colors.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.resultCard}>
              <View style={[styles.resultIcon, { backgroundColor: item._type === 'tx' ? (item.type === 'sale' ? t.colors.successLight : t.colors.dangerLight) : t.colors.primaryLight }]}>
                <Ionicons name={item._type === 'tx' ? 'receipt-outline' : 'cube-outline'} size={18} color={item._type === 'tx' ? (item.type === 'sale' ? t.colors.success : t.colors.danger) : t.colors.primary} />
              </View>
              <View style={styles.resultInfo}>
                <Text style={styles.resultName}>{item._type === 'tx' ? item.description : item.item_name}</Text>
                <Text style={styles.resultMeta}>{item._type === 'tx' ? `${item.date} • ${item.type}` : `${item.category} • ${item.current_stock} ${item.unit}`}</Text>
              </View>
              {item._type === 'tx' && (
                <Text style={[styles.resultAmount, { color: item.type === 'sale' ? t.colors.success : t.colors.danger }]}>
                  {item.type === 'sale' ? '+' : '-'}${item.amount?.toLocaleString()}
                </Text>
              )}
            </View>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={search.length >= 2 ? <Text style={styles.empty}>No results found</Text> : <Text style={styles.empty}>Type at least 2 characters</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, backgroundColor: t.colors.surface, paddingTop: 52, paddingBottom: t.spacing.md, paddingHorizontal: t.spacing.lg, borderBottomWidth: 1, borderBottomColor: t.colors.border },
  backBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
  searchInput: { flex: 1, backgroundColor: t.colors.background, borderRadius: t.radius.input, borderWidth: 1, borderColor: t.colors.border, paddingHorizontal: t.spacing.lg, paddingVertical: 12, fontSize: 16, fontFamily: 'Inter-Regular', color: t.colors.dark },
  tabRow: { flexDirection: 'row', padding: t.spacing.lg, gap: t.spacing.sm },
  tab: { flex: 1, paddingVertical: t.spacing.md, borderRadius: t.radius.button, borderWidth: 1, borderColor: t.colors.border, alignItems: 'center' },
  tabActive: { backgroundColor: t.colors.primary, borderColor: t.colors.primary },
  tabText: { fontSize: 14, fontFamily: 'Inter-Medium', fontWeight: '500', color: t.colors.medium },
  tabTextActive: { color: t.colors.white },
  list: { paddingHorizontal: t.spacing.lg, paddingBottom: 30 },
  resultCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.lg, marginBottom: t.spacing.sm },
  resultIcon: { width: 40, height: 40, borderRadius: t.radius.input, justifyContent: 'center', alignItems: 'center', marginRight: t.spacing.md },
  resultInfo: { flex: 1 },
  resultName: { fontSize: 15, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.dark },
  resultMeta: { fontSize: 12, fontFamily: 'Inter-Regular', color: t.colors.medium, marginTop: 2 },
  resultAmount: { fontSize: 15, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 14, fontFamily: 'Inter-Regular', color: t.colors.medium },
});

export default SearchScreen;
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../context/OfflineContext';
import { t } from '../styles/designSystem';

const OfflineBanner = () => {
  const { isOffline } = useOffline();
  if (!isOffline) return null;
  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={16} color={t.colors.white} />
      <Text style={styles.text}>Offline — showing cached data</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: t.colors.warning,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: t.colors.white,
    fontSize: 13,
    fontFamily: t.typography.bodyMedium,
    marginLeft: 8,
  },
});

export default OfflineBanner;
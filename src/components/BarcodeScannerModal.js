import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../styles/designSystem';

const BarcodeScannerModal = ({ visible, onClose, onScanned }) => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    if (visible) {
      setScanned(false);
      (async () => {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === 'granted');
      })();
    }
  }, [visible]);

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    if (onScanned) onScanned(data);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={t.colors.dark} />
          </TouchableOpacity>
          <Text style={styles.title}>Scan Barcode</Text>
          <View style={{ width: 40 }} />
        </View>
        {hasPermission === null ? (
          <View style={styles.center}><Text>Requesting camera permission...</Text></View>
        ) : hasPermission === false ? (
          <View style={styles.center}><Text>No access to camera</Text></View>
        ) : (
          <CameraView
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'code128', 'qr'] }}
            style={styles.camera}
          />
        )}
        <View style={styles.footer}>
          <Text style={styles.hint}>Align barcode within frame</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: t.colors.surface },
  closeBtn: { padding: 8 },
  title: { fontSize: 18, fontFamily: t.typography.heading, fontWeight: '800', color: t.colors.dark },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  camera: { flex: 1 },
  footer: { padding: 16, backgroundColor: t.colors.surface, alignItems: 'center' },
  hint: { fontSize: 14, fontFamily: t.typography.body, color: t.colors.medium },
});

export default BarcodeScannerModal;
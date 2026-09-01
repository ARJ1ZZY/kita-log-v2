import React, { createContext, useState, useContext, useRef, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Modal, Platform } from 'react-native';
import { createPortal } from 'react-dom';
import { t } from '../styles/designSystem';

const LoadingContext = createContext({
  showLoading: () => {},
  hideLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('Your request is being processed...');
  const startTimeRef = useRef(0);
  const hideTimerRef = useRef(null);
  const minDisplayRef = useRef(2000);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const showLoading = (msg = 'Your request is being processed...') => {
    setMessage(msg);
    setVisible(true);
    startTimeRef.current = Date.now();
  };

  const hideLoading = () => {
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = minDisplayRef.current - elapsed;
    if (remaining > 0) {
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, remaining);
    } else {
      setVisible(false);
    }
  };

  const renderOverlay = () => (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={t.colors.primary} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading }}>
      {children}
      {visible &&
        (Platform.OS === 'web'
          ? createPortal(
              <Modal visible transparent animationType="none">
                {renderOverlay()}
              </Modal>,
              document.body
            )
          : (
              <Modal visible transparent animationType="none">
                {renderOverlay()}
              </Modal>
            )
        )
      }
    </LoadingContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F8FAFC',      // solid background, no transparency
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 99999,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  text: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#0F172A',
  },
});
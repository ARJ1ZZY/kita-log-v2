import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/colors';

const Toast = ({ message, visible, onHide }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide && onHide());
    }
  }, [visible]);

  if (!visible) return null;
  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: { position: 'absolute', bottom: 80, left: 20, right: 20, backgroundColor: theme.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  text: { color: theme.white, fontWeight: '600' },
});

export default Toast;
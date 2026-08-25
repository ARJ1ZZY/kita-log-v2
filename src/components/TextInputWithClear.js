import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../styles/designSystem';

const TextInputWithClear = ({ value, onChangeText, placeholder, placeholderTextColor, secureTextEntry, keyboardType, autoCapitalize, style, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused, style]}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor || t.colors.medium}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
      {value.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={18} color={t.colors.medium} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: t.colors.background,
    borderRadius: t.radius.input,
    borderWidth: 1.5,
    borderColor: t.colors.border,
    height: 48,
    paddingHorizontal: 12,
  },
  inputWrapperFocused: {
    borderColor: t.colors.primary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: t.typography.body,
    color: t.colors.dark,
  },
  clearBtn: {
    padding: 4,
  },
});

export default TextInputWithClear;
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/colors';
export default () => (
  <View style={styles.container}><Text style={styles.text}>Chatbot</Text><Text style={styles.subtext}>Gemini AI coming soon</Text></View>
);
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
  text: { fontSize: 24, fontWeight: 'bold', color: theme.primaryText },
  subtext: { fontSize: 16, color: theme.secondaryText, marginTop: 8 },
});
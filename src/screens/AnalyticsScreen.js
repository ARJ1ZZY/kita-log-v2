import React from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { t } from '../styles/designSystem';

const screenWidth = Dimensions.get('window').width - 32;

const AnalyticsScreen = () => {
  const lineData = {
    labels: ['W1', 'W2', 'W3', 'W4'],
    datasets: [
      { data: [4200, 5100, 4800, 6200], color: () => t.colors.primary, strokeWidth: 2 },
      { data: [2800, 3200, 3500, 3100], color: () => t.colors.secondary, strokeWidth: 2 },
    ],
    legend: ['Revenue', 'Expenses'],
  };

  const pieData = [
    { name: 'Operations', percent: 45, color: t.colors.primary },
    { name: 'Marketing', percent: 30, color: t.colors.secondary },
    { name: 'Software', percent: 25, color: t.colors.success },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.rangeSelector}>
          <Text style={styles.rangeText}>Oct 1 - Oct 31, 2023</Text>
          <Ionicons name="chevron-down" size={18} color={t.colors.medium} />
        </View>

        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Average Daily Spending</Text>
          <Text style={styles.metricValue}>$142.50</Text>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Revenue vs Operating Expenses</Text>
          <LineChart
            data={lineData}
            width={screenWidth - 48}
            height={200}
            chartConfig={{
              backgroundColor: t.colors.surface,
              backgroundGradientFrom: t.colors.surface,
              backgroundGradientTo: t.colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37,99,235,${opacity})`,
              labelColor: () => t.colors.medium,
              propsForDots: { r: '4', strokeWidth: '2' },
            }}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Expense Breakdown</Text>
          {pieData.map(item => (
            <View key={item.name} style={styles.pieRow}>
              <View style={styles.pieInfo}>
                <View style={[styles.pieDot, { backgroundColor: item.color }]} />
                <Text style={styles.pieLabel}>{item.name}</Text>
              </View>
              <View style={styles.pieBar}>
                <View style={[styles.pieFill, { width: `${item.percent}%`, backgroundColor: item.color }]} />
              </View>
              <Text style={styles.piePercent}>{item.percent}%</Text>
            </View>
          ))}
        </View>

        <View style={styles.anomalyCard}>
          <View style={styles.anomalyHeader}>
            <Ionicons name="warning-outline" size={20} color={t.colors.secondary} />
            <Text style={styles.anomalyTitle}>Unusual Spending Detected</Text>
          </View>
          <Text style={styles.anomalyDesc}>Your "Supplies" category spending increased 340% this week compared to last week.</Text>
          <TouchableOpacity style={styles.anomalyBtn} activeOpacity={0.7}>
            <Text style={styles.anomalyBtnText}>Review</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const TouchableOpacity = require('react-native').TouchableOpacity;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.colors.background },
  scroll: { padding: t.spacing.lg, paddingBottom: 40 },
  rangeSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: t.spacing.sm, backgroundColor: t.colors.surface, borderRadius: t.radius.pill, borderWidth: 1, borderColor: t.colors.border, paddingVertical: t.spacing.md, paddingHorizontal: t.spacing.xl, alignSelf: 'center', marginBottom: t.spacing.xl },
  rangeText: { fontSize: 14, fontFamily: 'Inter-Medium', fontWeight: '500', color: t.colors.dark },
  metricCard: { backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.xxl, alignItems: 'center', marginBottom: t.spacing.lg, ...t.shadows.sm },
  metricLabel: { fontSize: 13, fontFamily: 'Inter-Medium', fontWeight: '500', color: t.colors.medium, marginBottom: t.spacing.sm },
  metricValue: { fontSize: 28, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark },
  chartCard: { backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing.lg, marginBottom: t.spacing.lg, ...t.shadows.sm },
  chartTitle: { fontSize: 16, fontFamily: 'SpaceGrotesk-Bold', fontWeight: '800', color: t.colors.dark, marginBottom: t.spacing.lg },
  chart: { borderRadius: t.radius.card },
  pieRow: { flexDirection: 'row', alignItems: 'center', marginBottom: t.spacing.md },
  pieInfo: { flexDirection: 'row', alignItems: 'center', width: 110, gap: t.spacing.sm },
  pieDot: { width: 10, height: 10, borderRadius: 5 },
  pieLabel: { fontSize: 13, fontFamily: 'Inter-Regular', color: t.colors.dark },
  pieBar: { flex: 1, height: 8, backgroundColor: t.colors.border, borderRadius: t.radius.pill, overflow: 'hidden', marginHorizontal: t.spacing.md },
  pieFill: { height: '100%', borderRadius: t.radius.pill },
  piePercent: { fontSize: 13, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.dark, width: 36, textAlign: 'right' },
  anomalyCard: { backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.secondary + '40', padding: t.spacing.xxl, ...t.shadows.sm },
  anomalyHeader: { flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, marginBottom: t.spacing.sm },
  anomalyTitle: { fontSize: 15, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.dark },
  anomalyDesc: { fontSize: 13, fontFamily: 'Inter-Regular', color: t.colors.medium, lineHeight: 20, marginBottom: t.spacing.lg },
  anomalyBtn: { backgroundColor: t.colors.secondary, borderRadius: t.radius.button, paddingVertical: t.spacing.md, paddingHorizontal: t.spacing.xxl, alignSelf: 'flex-start' },
  anomalyBtnText: { fontSize: 14, fontFamily: 'Inter-SemiBold', fontWeight: '600', color: t.colors.white },
});

export default AnalyticsScreen;
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Path, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { t } from '../styles/designSystem';

const CustomLineChart = ({ labels, sales, expenses, width, height }) => {
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...sales, ...expenses, 1);
  const minValue = 0;
  const range = maxValue - minValue || 1;

  const getX = (index) => padding.left + (index * chartWidth) / Math.max(labels.length - 1, 1);
  const getY = (value) => padding.top + chartHeight - ((value - minValue) / range) * chartHeight;

  const salesPoints = sales.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
  const expensesPoints = expenses.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');

  const salesPath = `M${salesPoints.replace(/ /g, ' L')}`;
  const expensesPath = `M${expensesPoints.replace(/ /g, ' L')}`;

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.colors.success} stopOpacity="0.2" />
            <Stop offset="1" stopColor={t.colors.success} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={t.colors.danger} stopOpacity="0.2" />
            <Stop offset="1" stopColor={t.colors.danger} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {[...Array(4)].map((_, i) => {
          const y = padding.top + (i * chartHeight) / 3;
          return <Line key={`grid-${i}`} x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={t.colors.border} strokeDasharray="4,4" strokeWidth={1} />;
        })}

        {/* Y-axis labels */}
        {[...Array(4)].map((_, i) => {
          const value = Math.round(minValue + (range * i) / 3);
          const y = padding.top + (i * chartHeight) / 3;
          return (
            <SvgText key={`y-${i}`} x={padding.left - 10} y={y + 4} fontSize={10} fill={t.colors.medium} textAnchor="end">
              {value}
            </SvgText>
          );
        })}

        {/* X-axis labels */}
        {labels.map((label, i) => (
          <SvgText key={`x-${i}`} x={getX(i)} y={height - 10} fontSize={10} fill={t.colors.medium} textAnchor="middle">
            {label}
          </SvgText>
        ))}

        {/* Sales line and area */}
        <Path d={`${salesPath} L${getX(sales.length - 1)},${padding.top + chartHeight} L${getX(0)},${padding.top + chartHeight} Z`} fill="url(#salesGradient)" stroke="none" />
        <Path d={salesPath} stroke={t.colors.success} strokeWidth={2} fill="none" />
        {salesPoints.split(' ').map((point, i) => {
          const [x, y] = point.split(',').map(Number);
          return <Circle key={`sales-dot-${i}`} cx={x} cy={y} r={3} fill={t.colors.success} />;
        })}

        {/* Expenses line and area */}
        <Path d={`${expensesPath} L${getX(expenses.length - 1)},${padding.top + chartHeight} L${getX(0)},${padding.top + chartHeight} Z`} fill="url(#expensesGradient)" stroke="none" />
        <Path d={expensesPath} stroke={t.colors.danger} strokeWidth={2} fill="none" />
        {expensesPoints.split(' ').map((point, i) => {
          const [x, y] = point.split(',').map(Number);
          return <Circle key={`expenses-dot-${i}`} cx={x} cy={y} r={3} fill={t.colors.danger} />;
        })}
      </Svg>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: t.colors.success }]} />
          <Text style={styles.legendText}>Revenue</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: t.colors.danger }]} />
          <Text style={styles.legendText}>Expenses</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', alignItems: 'center' },
  legend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontFamily: t.typography.body, color: t.colors.medium },
});

export default CustomLineChart;
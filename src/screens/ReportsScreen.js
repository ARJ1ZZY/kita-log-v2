import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity, Dimensions, ActivityIndicator, Platform } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { t } from '../styles/designSystem';
import Toast from '../components/Toast';
import { useFormat } from '../utils/format';

const screenWidth = Dimensions.get('window').width - 32;

const ReportsScreen = ({ onClose }) => {
  const { user, activeBusinessId, businesses } = useAuth();
  const { formatCurrency, formatDate } = useFormat();
  const [period, setPeriod] = useState('thisMonth');
  const [stats, setStats] = useState({ sales: 0, expenses: 0, count: 0 });
  const [dailyData, setDailyData] = useState({ labels: [], sales: [], expenses: [] });
  const [categoryData, setCategoryData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (msg, type) => setToast({ visible: true, message: msg, type });

  const getDateRange = () => {
    const now = new Date(); let start = new Date();
    if (period === 'today') start.setHours(0,0,0,0);
    else if (period === 'thisWeek') { const d = now.getDay(); start.setDate(now.getDate()-d); start.setHours(0,0,0,0); }
    else start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
  };

  const fetch = useCallback(async () => {
    if (!user || !activeBusinessId) return;
    setLoading(true);
    const { start, end } = getDateRange();
    const q = query(collection(db, 'transactions'), where('business_id','==',activeBusinessId));
    const snap = await getDocs(q);
    let sales=0, expenses=0, count=0; const dMap={}, cMap={}; const allTx = [];
    snap.forEach(doc => {
      const d = doc.data();
      if (d.date >= start && d.date <= end) {
        allTx.push({ id: doc.id, ...d });
        if (d.type === 'sale') sales += d.amount; else expenses += d.amount;
        count++;
        const day = d.date?.substring(5); if (!dMap[day]) dMap[day]={sales:0,expenses:0};
        if (d.type==='sale') dMap[day].sales += d.amount; else dMap[day].expenses += d.amount;
        if (d.type==='expense') cMap[d.description||'Other'] = (cMap[d.description||'Other']||0)+d.amount;
      }
    });
    const sDays = Object.keys(dMap).sort();
    setStats({sales,expenses,count});
    setDailyData({labels:sDays.map(d=>d.substring(5)), sales:sDays.map(d=>dMap[d].sales), expenses:sDays.map(d=>dMap[d].expenses)});
    setCategoryData(Object.entries(cMap).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([n,v],i)=>({name:n.length>12?n.substring(0,10)+'...':n, population:v, color:[t.colors.primary,t.colors.secondary,t.colors.success,t.colors.danger,t.colors.tertiary][i], legendFontColor:t.colors.dark, legendFontSize:11})));
    setTransactions(allTx);
    setLoading(false);
  }, [user, activeBusinessId, period]);

  useFocusEffect(useCallback(()=>{fetch();},[fetch]));

  const handleExportCSV = async () => {
    try {
      const snap = await getDocs(query(collection(db,'transactions'), where('business_id','==',activeBusinessId)));
      let csv = 'Date,Time,Type,Description,Amount\n';
      snap.forEach(doc => { const d = doc.data(); csv += `${d.date},${d.time},${d.type},"${d.description}",${d.amount}\n`; });
      const path = `${FileSystem.cacheDirectory}report.csv`;
      await FileSystem.writeAsStringAsync(path,csv);
      await Sharing.shareAsync(path, { mimeType:'text/csv' });
      showToast('CSV exported','success');
    } catch { showToast('Export failed','error'); }
  };

  const handleExportPDF = async () => {
    const businessName = businesses.find(b => b.id === activeBusinessId)?.business_name || 'KITA-LOG';
    let tableRows = '';
    transactions.forEach(tx => {
      tableRows += `<tr><td>${formatDate(tx.date)}</td><td>${tx.time}</td><td>${tx.type}</td><td>${tx.description}</td><td style="text-align:right">${formatCurrency(tx.amount)}</td></tr>`;
    });
    const html = `
      <html>
        <head><style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #2563EB; }
          h2 { color: #0F172A; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #E2E8F0; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #F8FAFC; color: #757681; }
          .summary { margin-bottom: 20px; }
        </style></head>
        <body>
          <h1>${businessName} - Report</h1>
          <div class="summary">
            <p><strong>Period:</strong> ${period}</p>
            <p><strong>Total Sales:</strong> ${formatCurrency(stats.sales)}</p>
            <p><strong>Total Expenses:</strong> ${formatCurrency(stats.expenses)}</p>
            <p><strong>Transaction Count:</strong> ${stats.count}</p>
          </div>
          <h2>Transactions</h2>
          <table>
            <thead><tr><th>Date</th><th>Time</th><th>Type</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      } else {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Export PDF' });
      }
      showToast('PDF exported','success');
    } catch { showToast('Export failed','error'); }
  };

  const periods = [{key:'today',label:'Today'},{key:'thisWeek',label:'Week'},{key:'thisMonth',label:'Month'}];
  const chartConfig = { backgroundColor:t.colors.surface, backgroundGradientFrom:t.colors.surface, backgroundGradientTo:t.colors.surface, decimalPlaces:0, color:(o=1)=>`rgba(37,99,235,${o})`, labelColor:()=>t.colors.medium };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={t.colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color={t.colors.dark} /></TouchableOpacity>
        <Text style={styles.title}>Reports</Text>
        <View style={{width:44}} />
      </View>
      {loading ? <ActivityIndicator size="large" color={t.colors.primary} style={{marginTop:40}} /> : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {periods.map(p => (
              <TouchableOpacity key={p.key} style={[styles.chip, period===p.key&&styles.chipActive]} onPress={()=>setPeriod(p.key)}>
                <Text style={[styles.chipText, period===p.key&&styles.chipTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}><Text style={styles.statLabel}>Sales</Text><Text style={[styles.statValue,{color:t.colors.success}]}>{formatCurrency(stats.sales)}</Text></View>
            <View style={styles.statBox}><Text style={styles.statLabel}>Expenses</Text><Text style={[styles.statValue,{color:t.colors.danger}]}>{formatCurrency(stats.expenses)}</Text></View>
          </View>
          <View style={styles.chartCard}><Text style={styles.chartTitle}>Daily Trend</Text>
            {dailyData.labels.length>0 ? <LineChart data={{labels:dailyData.labels.slice(-7), datasets:[{data:dailyData.sales.slice(-7), color:()=>t.colors.success},{data:dailyData.expenses.slice(-7), color:()=>t.colors.danger}]}} width={screenWidth-48} height={180} chartConfig={chartConfig} bezier /> : <Text style={styles.noData}>No data</Text>}
          </View>
          <View style={styles.chartCard}><Text style={styles.chartTitle}>Expense Categories</Text>
            {categoryData.length>0 ? <PieChart data={categoryData} width={screenWidth-48} height={180} chartConfig={chartConfig} accessor="population" backgroundColor="transparent" paddingLeft="15" absolute /> : <Text style={styles.noData}>No data</Text>}
          </View>
          <View style={styles.exportRow}>
            <TouchableOpacity style={[styles.exportBtn, {backgroundColor: t.colors.success}]} onPress={handleExportCSV}>
              <Ionicons name="download-outline" size={18} color={t.colors.white} />
              <Text style={styles.exportText}>CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.exportBtn, {backgroundColor: t.colors.danger}]} onPress={handleExportPDF}>
              <Ionicons name="document-outline" size={18} color={t.colors.white} />
              <Text style={styles.exportText}>PDF</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
      <Toast message={toast.message} visible={toast.visible} type={toast.type} onHide={()=>setToast({...toast,visible:false})} />
    </View>
  );
};

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:t.colors.background},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',backgroundColor:t.colors.surface,paddingTop:52,paddingBottom:t.spacing.md,paddingHorizontal:t.spacing.lg,borderBottomWidth:1,borderBottomColor:t.colors.border},
  backBtn:{width:44,height:44,justifyContent:'center',alignItems:'flex-start'},
  title:{fontSize:18,fontFamily:t.typography.heading,fontWeight:'800',color:t.colors.dark},
  scroll:{padding:t.spacing.lg,paddingBottom:40},
  chipRow:{marginBottom:t.spacing.xl},
  chip:{paddingHorizontal:t.spacing.xl,paddingVertical:t.spacing.sm,borderRadius:t.radius.pill,backgroundColor:t.colors.surface,borderWidth:1,borderColor:t.colors.border,marginRight:t.spacing.sm},
  chipActive:{backgroundColor:t.colors.primary,borderColor:t.colors.primary},
  chipText:{fontSize:13,fontFamily:t.typography.bodyMedium,fontWeight:'500',color:t.colors.medium},
  chipTextActive:{color:t.colors.white},
  statsGrid:{flexDirection:'row',gap:t.spacing.md,marginBottom:t.spacing.lg},
  statBox:{flex:1,backgroundColor:t.colors.surface,borderRadius:t.radius.card,borderWidth:1,borderColor:t.colors.border,padding:t.spacing.lg,alignItems:'center',...t.shadows.sm},
  statLabel:{fontSize:12,fontFamily:t.typography.bodyMedium,color:t.colors.medium},
  statValue:{fontSize:18,fontFamily:t.typography.heading,fontWeight:'800',marginTop:t.spacing.xs},
  chartCard:{backgroundColor:t.colors.surface,borderRadius:t.radius.card,borderWidth:1,borderColor:t.colors.border,padding:t.spacing.lg,marginBottom:t.spacing.lg,...t.shadows.sm},
  chartTitle:{fontSize:16,fontFamily:t.typography.heading,fontWeight:'800',color:t.colors.dark,marginBottom:t.spacing.lg},
  noData:{textAlign:'center',color:t.colors.medium,paddingVertical:30},
  exportRow:{flexDirection:'row',gap:t.spacing.md},
  exportBtn:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:t.spacing.sm,borderRadius:t.radius.button,paddingVertical:t.spacing.lg},
  exportText:{color:t.colors.white,fontSize:16,fontFamily:t.typography.bodySemiBold},
});

export default ReportsScreen;
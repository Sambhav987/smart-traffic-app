import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { API_BASE_URL } from '../config';

const TABS = [
  {
    key: 'historic',
    label: 'Historic',
    endpoint: '/historic-data',
    columns: [
      { label: 'Timestamp', field: 'timestamp', flex: 2 },
      { label: 'L',         field: 'num_cars_left',   flex: 0.6, align: 'center' },
      { label: 'R',         field: 'num_cars_right',  flex: 0.6, align: 'center' },
      { label: 'T',         field: 'num_cars_top',    flex: 0.6, align: 'center' },
      { label: 'B',         field: 'num_cars_bottom', flex: 0.6, align: 'center' },
      { label: 'Total',     field: 'total_cars',      flex: 0.8, align: 'center' },
    ],
  },
  {
    key: 'congestion',
    label: 'Congestion',
    endpoint: '/congestions',
    columns: [
      { label: 'Timestamp', field: 'timestamp', flex: 2.2 },
      { label: 'Cars',      field: 'num_cars',  flex: 0.8, align: 'center' },
      { label: 'Section',   field: 'section',   flex: 1.4 },
    ],
  },
  {
    key: 'accident',
    label: 'Accident',
    endpoint: '/accidents',
    columns: null, // unknown schema — render raw key/value
  },
];

export default function IntersectionDetailsScreen({ route }) {
  const { intersectionName } = route.params;
  const [activeKey, setActiveKey] = useState('historic');

  // per-tab data cache: { [key]: { rows, loading, refreshing, error } }
  const [state, setState] = useState(() =>
    Object.fromEntries(TABS.map(t => [t.key, { rows: null, loading: false, refreshing: false, error: null }]))
  );

  const activeTab = TABS.find(t => t.key === activeKey);
  const activeState = state[activeKey];

  const load = useCallback(async (key, isRefresh = false) => {
    const tab = TABS.find(t => t.key === key);
    setState(s => ({ ...s, [key]: { ...s[key], loading: !isRefresh, refreshing: isRefresh, error: null } }));
    try {
      const res = await fetch(`${API_BASE_URL}${tab.endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setState(s => ({ ...s, [key]: { rows: data, loading: false, refreshing: false, error: null } }));
    } catch (e) {
      setState(s => ({ ...s, [key]: { ...s[key], loading: false, refreshing: false, error: e.message } }));
    }
  }, []);

  useEffect(() => {
    if (activeState.rows == null && !activeState.loading) load(activeKey);
  }, [activeKey, activeState, load]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>{intersectionName}</Text>
        <Text style={styles.subtitle}>Intersection details</Text>
      </View>

      <View style={styles.tabs}>
        {TABS.map(t => {
          const active = t.key === activeKey;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveKey(t.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Body tab={activeTab} data={activeState} onRefresh={() => load(activeKey, true)} onRetry={() => load(activeKey)} />
    </View>
  );
}

function Body({ tab, data, onRefresh, onRetry }) {
  if (data.loading) {
    return <View style={styles.center}><ActivityIndicator color="#38bdf8" /></View>;
  }
  if (data.error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Couldn't load records</Text>
        <Text style={styles.errorBody}>{data.error}</Text>
        <Text style={styles.errorHint}>API: {API_BASE_URL}{tab.endpoint}</Text>
        <TouchableOpacity style={styles.retry} onPress={onRetry}>
          <Text style={styles.retryLabel}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <FlatList
      data={(data.rows || [])}
      keyExtractor={(item, i) => String(item.id ?? i)}
      contentContainerStyle={styles.listContent}
      refreshControl={<RefreshControl refreshing={data.refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
      ListHeaderComponent={
        tab.columns ? (
          <View style={styles.tableHeader}>
            {tab.columns.map(c => (
              <Text
                key={c.field}
                style={[styles.cellHeader, { flex: c.flex, textAlign: c.align || 'left' }]}
              >
                {c.label}
              </Text>
            ))}
          </View>
        ) : null
      }
      ListEmptyComponent={<Text style={styles.empty}>No {tab.label.toLowerCase()} records yet.</Text>}
      renderItem={({ item }) =>
        tab.columns ? (
          <View style={styles.row}>
            {tab.columns.map(c => (
              <Text
                key={c.field}
                style={[styles.cell, { flex: c.flex, textAlign: c.align || 'left' }]}
                numberOfLines={1}
              >
                {String(item[c.field] ?? '')}
              </Text>
            ))}
          </View>
        ) : (
          <View style={styles.rowGeneric}>
            {Object.entries(item).map(([k, v]) => (
              <Text key={k} style={styles.kv}>
                <Text style={styles.kvKey}>{k}: </Text>
                <Text style={styles.kvVal}>{String(v)}</Text>
              </Text>
            ))}
          </View>
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingTop: 16, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: '#1e293b' },
  title: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

  tabs: { flexDirection: 'row', backgroundColor: '#1e293b', paddingHorizontal: 8, paddingBottom: 8 },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: 'center',
    borderRadius: 8, marginHorizontal: 4, backgroundColor: '#0f172a',
  },
  tabActive: { backgroundColor: '#38bdf8' },
  tabLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: '#0f172a' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorTitle: { color: '#f1f5f9', fontSize: 16, fontWeight: '600' },
  errorBody:  { color: '#ef4444', marginTop: 6 },
  errorHint:  { color: '#64748b', fontSize: 11, marginTop: 8 },
  retry: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: '#38bdf8', borderRadius: 8 },
  retryLabel: { color: '#0f172a', fontWeight: '600' },

  listContent: { padding: 12 },
  tableHeader: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  cellHeader: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  row: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12,
    backgroundColor: '#1e293b', marginBottom: 6, borderRadius: 8, alignItems: 'center',
  },
  cell: { color: '#f1f5f9', fontSize: 13 },

  rowGeneric: {
    backgroundColor: '#1e293b', borderRadius: 8, padding: 12, marginBottom: 6,
  },
  kv: { fontSize: 13, marginVertical: 1 },
  kvKey: { color: '#64748b', fontWeight: '600' },
  kvVal: { color: '#f1f5f9' },

  empty: { color: '#64748b', textAlign: 'center', marginTop: 32 },
});

import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, Dimensions,
} from 'react-native';
import TrafficMap from '../components/TrafficMap';
import { API_BASE_URL } from '../config';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SIGNALS = [
  { id: 1, intersection: 'Intersection 1', status: 'green', wait: 0, coordinate: { latitude: 22.513377224329055, longitude: 88.40184946246919 } },
];

const STATUS_COLORS = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };

export default function HomeScreen({ navigation }) {
  const [signals, setSignals] = useState(SIGNALS);
  const [selected, setSelected] = useState(null);
  const [maxWait, setMaxWait] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchMaxWait() {
      try {
        const res = await fetch(`${API_BASE_URL}/max-wait-time`);
        if (!res.ok) return;
        const row = await res.json();
        if (!cancelled) setMaxWait(row?.max_wait_time ?? null);
      } catch {
        // ignore transient errors
      }
    }
    fetchMaxWait();
    const id = setInterval(fetchMaxWait, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  function cycleStatus(id) {
    setSignals(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        const next = s.status === 'red' ? 'green' : s.status === 'green' ? 'yellow' : 'red';
        return { ...s, status: next, wait: next === 'red' ? 45 : next === 'yellow' ? 5 : 0 };
      })
    );
  }

  const active = signals.filter(s => s.status === 'green').length;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Smart Traffic Monitor</Text>
        <Text style={styles.subtitle}>{active} of {signals.length} intersections clear</Text>
      </View>

      <View style={styles.mapContainer}>
        <TrafficMap signals={signals} onMarkerPress={setSelected} />
      </View>

      <View style={styles.bottom}>
        <Text style={styles.bottomTitle}>Intersections</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {signals.map(signal => (
            <View
              key={signal.id}
              style={[styles.card, selected === signal.id && styles.cardSelected]}
            >
              <TouchableOpacity
                onPress={() => { cycleStatus(signal.id); setSelected(signal.id); }}
                activeOpacity={0.7}
              >
                <View style={[styles.dot, { backgroundColor: STATUS_COLORS[signal.status] }]} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cardText}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('IntersectionDetails', {
                    intersectionId: signal.id,
                    intersectionName: signal.intersection,
                  })
                }
              >
                <Text style={styles.intersection} numberOfLines={1}>{signal.intersection}</Text>
                <Text style={styles.status}>
                  {maxWait == null
                    ? '  Loading…'
                    : maxWait > 0
                      ? ` Maximum ${maxWait.toFixed(2)}s wait`
                      : '  No wait'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <Text style={styles.hint}>Tap dot to cycle signal · Tap name for details</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    height: SCREEN_HEIGHT * 0.20,
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingTop: 48,
    justifyContent: 'center',
  },
  title:    { fontSize: 22, fontWeight: '700', color: '#f1f5f9' },
  subtitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  legend:   { flexDirection: 'row', gap: 14, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendLabel:{ fontSize: 12, color: '#cbd5e1', textTransform: 'capitalize' },
  mapContainer: { height: SCREEN_HEIGHT * 0.50 },
  bottom: {
    height: SCREEN_HEIGHT * 0.30,
    backgroundColor: '#1e293b',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  bottomTitle: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardSelected: { borderColor: '#38bdf8' },
  dot:          { width: 16, height: 16, borderRadius: 8 },
  cardText:     { flex: 1 },
  intersection: { fontSize: 14, fontWeight: '600', color: '#f1f5f9' },
  status:       { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  hint:         { textAlign: 'center', color: '#334155', fontSize: 11, paddingVertical: 6 },
});

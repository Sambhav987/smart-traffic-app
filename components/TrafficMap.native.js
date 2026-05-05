import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';

const STATUS_COLORS = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };

const INITIAL_REGION = {
  latitude: 22.513377224329055,
  longitude: 88.40184946246919,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export default function TrafficMap({ signals, onMarkerPress }) {
  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      provider="google"
      initialRegion={INITIAL_REGION}
      showsUserLocation
      showsTraffic
    >
      {signals.map(signal => (
        <Marker
          key={signal.id}
          coordinate={signal.coordinate}
          title={signal.intersection}
          description={`${signal.status.toUpperCase()}${signal.wait > 0 ? ` · ${signal.wait}s wait` : ' · No wait'}`}
          pinColor={STATUS_COLORS[signal.status]}
          onPress={() => onMarkerPress(signal.id)}
        />
      ))}
    </MapView>
  );
}

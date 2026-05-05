import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import { StyleSheet, View } from 'react-native';

const GOOGLE_MAPS_API_KEY = 'AIzaSyD_sJ8J3TEqLeBhYmS6W-y3vyXeMliFpZY';

const STATUS_COLORS = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };

const CENTER = { lat: 22.513377224329055, lng: 88.40184946246919 };

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
];

function markerIcon(color) {
  return {
    path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z',
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#fff',
    strokeWeight: 1.5,
    scale: 1.2,
  };
}

export default function TrafficMap({ signals, onMarkerPress }) {
  return (
    <View style={StyleSheet.absoluteFillObject}>
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={CENTER}
          zoom={15}
          options={{ styles: MAP_STYLES, disableDefaultUI: false, zoomControl: true }}
        >
          {signals.map(signal => (
            <Marker
              key={signal.id}
              position={{ lat: signal.coordinate.latitude, lng: signal.coordinate.longitude }}
              title={signal.intersection}
              icon={markerIcon(STATUS_COLORS[signal.status])}
              onClick={() => onMarkerPress(signal.id)}
            />
          ))}
        </GoogleMap>
      </LoadScript>
    </View>
  );
}

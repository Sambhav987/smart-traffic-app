import { Platform } from 'react-native';

// Your PC's LAN IPv4. Required for physical devices on the same Wi-Fi.
// Run `ipconfig` (Windows) and look for the IPv4 Address under your active
// Wi-Fi adapter.
const LAN_IP = '10.147.14.92';

function resolveHost() {
  // For physical devices, always use LAN_IP. (10.0.2.2 only works on the
  // Android emulator, which we can't reliably distinguish from a device via
  // __DEV__.) For iOS sim / web, localhost is fine.
  if (Platform.OS === 'web') return 'localhost';
  return LAN_IP;
}

export const API_BASE_URL = `http://${resolveHost()}:4000`;
export const DJANGO_BASE_URL = `http://${resolveHost()}:8000`;

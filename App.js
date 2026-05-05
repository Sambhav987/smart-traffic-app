import { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import HomeScreen from './screens/HomeScreen';
import IntersectionDetailsScreen from './screens/IntersectionDetailsScreen';
import { registerForPushNotificationsAsync } from './services/notifications';

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useRef(null);
  const receivedSub = useRef(null);
  const responseSub = useRef(null);

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Fired when a notification is received while the app is open.
    receivedSub.current = Notifications.addNotificationReceivedListener(notif => {
      console.log('Notification received:', notif.request.content);
    });

    // Fired when the user taps a notification (foreground or background).
    responseSub.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data?.intersectionId && navigationRef.current) {
        navigationRef.current.navigate('IntersectionDetails', {
          intersectionId: data.intersectionId,
          intersectionName: data.intersectionName ?? 'Intersection',
        });
      }
    });

    return () => {
      receivedSub.current?.remove();
      responseSub.current?.remove();
    };
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1e293b' },
          headerTintColor: '#f1f5f9',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: '#0f172a' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="IntersectionDetails"
          component={IntersectionDetailsScreen}
          options={{ title: 'Intersection Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

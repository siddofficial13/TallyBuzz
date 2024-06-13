// App.tsx

import React, { useEffect } from 'react';
import { PermissionsAndroid, Platform, Alert, StyleSheet } from 'react-native';
import MainNavigator from './Navigators/MainNavigator';
import {
  notificationListeners,
  requestUserPermission,
  setupBackgroundHandler,
} from './Utils/NotificationServices';
import notifee, { AndroidImportance } from '@notifee/react-native';

const App = () => {
  useEffect(() => {
    const createNotificationChannel = async () => {
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
        actions: [
          { id: 'view', title: 'View' },
          { id: 'dismiss', title: 'Dismiss' },
        ],
      });
    };

    const initializeApp = async () => {
      await createNotificationChannel();
      await setupBackgroundHandler(); // Set up background handler
      if (Platform.OS === 'android') {
        try {
          const res = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
          console.log('Permission result:', res);
          if (res === 'granted') {
            await requestUserPermission();
            await notificationListeners();
          }
        } catch (error) {
          Alert.alert('Something went wrong while requesting permissions.');
          console.error('Permission error:', error);
        }
      } else {
        await requestUserPermission();
        await notificationListeners();
      }
    };

    initializeApp();
  }, []);

  return <MainNavigator />;
};

export default App;

const styles = StyleSheet.create({});

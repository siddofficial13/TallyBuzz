/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, {useEffect} from 'react';
import {PermissionsAndroid, Platform, Alert} from 'react-native';
import MainNavigator from './Navigators/MainNavigator';
import {
  notificationListeners,
  requestUserPermission,
} from './Utils/NotificationServices';
import notifee from '@notifee/react-native';
import {handleNavigationFromBackground} from './Screens/SplashScreen';

const App = () => {
  useEffect(() => {
    if (Platform.OS == 'android') {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      )
        .then(res => {
          console.log('res+++++', res);
          if (!!res && res == 'granted') {
            requestUserPermission();
            notificationListeners();
          }
        })
        .catch(error => {
          Alert.alert('something wrong');
        });
    } else {
    }
    notifee.getInitialNotification().then(initialNotification => {
      if (initialNotification) {
        console.log('navigation from initial state');
        handleNavigationFromBackground(initialNotification.notification.data);
      }
    });
  }, []);

  return <MainNavigator />;
};

export default App;

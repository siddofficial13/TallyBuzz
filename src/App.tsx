/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */

import React, {Component, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import MainNavigator from './Navigators/MainNavigator';
import {
  notificationListeners,
  requestUserPermission,
} from './Utils/NotificationServices';

const App = () => {
  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      )
        .then(res => {
          console.log('res+++++', res);
          if (!!res && res === 'granted') {
            // requestUserPermission();
            // notificationListeners();
          }
        })
        .catch(error => {
          Alert.alert('something wrong');
        });
    } else {
    }
  }, []);

  return <MainNavigator />;
};

export default App;

const styles = StyleSheet.create({});
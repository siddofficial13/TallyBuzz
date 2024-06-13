/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */

import React, {useEffect} from 'react';
import {View, Text} from 'react-native';
import Auth from '@react-native-firebase/auth';
import {StackActions, useNavigation} from '@react-navigation/native';
import {RootStackParamList} from '../Navigators/MainNavigator';
import Header from '../components/Header';

type SplashScreenProps = {
  navigation: any; // Use the correct type for navigation if available
};

const SplashScreen: React.FC<SplashScreenProps> = ({navigation}) => {
  useEffect(() => {
    setTimeout(() => {
      Auth().onAuthStateChanged(user => {
        const routeName = user !== null ? 'HomePageScreen' : 'LoginScreen';

        navigation.dispatch(StackActions.replace(routeName));
      });
    }, 1000);

    return () => {};
  }, []);

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text style={{color: '#000', padding: 40}}>Redirecting</Text>
      <Header />
    </View>
  );
};

export default SplashScreen;
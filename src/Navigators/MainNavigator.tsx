/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */

import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import HomeScreen from '../Screens/HomeScreen';
import LoginScreen from '../Screens/LoginScreen';
import SignUpScreen from '../Screens/SignUpScreen';
import HomePageScreen from '../Screens/HomePageScreen';
import UploadPost from '../Screens/UploadPost';
import ProfileScreen from '../Screens/ProfileScreen';
import Header from '../components/Header';
import Footer from '../components/Footer';

export type RootStackParamList = {
  HomeScreen: undefined;
  SignUpScreen: undefined;
  LoginScreen: undefined;
  HomePageScreen: undefined;
  UploadPost: undefined;
  ProfileScreen: undefined;
};

const { width } = Dimensions.get('window')

const Stack = createNativeStackNavigator<RootStackParamList>();

const MainNavigator = () => {
  const navigationRef = useNavigationContainerRef();
  const [currentRoute, setCurrentRoute] = useState<string | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = navigationRef.addListener('state', () => {
      const route = navigationRef.getCurrentRoute();
      setCurrentRoute(route?.name);
    });

    return unsubscribe;
  }, [navigationRef]);

  const showHeaderFooter = ['HomePageScreen', 'UploadPost', 'ProfileScreen'].includes(currentRoute);

  return (
    <NavigationContainer ref={navigationRef}>
      {showHeaderFooter && <Header />}
      <Stack.Navigator>
        <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUpScreen" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="HomePageScreen" component={HomePageScreen} options={{ headerShown: false }} />
        <Stack.Screen name="UploadPost" component={UploadPost} options={{ headerShown: false }} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
      {showHeaderFooter && <Footer />}
    </NavigationContainer>
  );
};

export default MainNavigator;

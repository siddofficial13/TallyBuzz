import React, {useState, useEffect, useRef} from 'react';
import {Dimensions} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import HomeScreen from '../Screens/HomeScreen';
import LoginScreen from '../Screens/LoginScreen';
import SignUpScreen from '../Screens/SignUpScreen';
import HomePageScreen from '../Screens/HomePageScreen';
import UploadPost from '../Screens/UploadPost';
import ProfileScreen from '../Screens/ProfileScreen';
import PostScreen from '../Screens/PostScreen';
import NavigationServices from './NavigationServices'; // Adjust the path as needed
import SplashScreen from '../Screens/SplashScreen';
import NotifyMeRedirectScreen from '../Screens/NotifyMeRedirectScreen';
import MultipleLoginRedirectScreen from '../Screens/MultipleLoginRedirectScreen';
import UnauthorisedLoginRedirectScreen from '../Screens/UnauthorisedLoginRedirectScreen';

export type RootStackParamList = {
  HomeScreen: undefined;
  SignUpScreen: undefined;
  LoginScreen: {screen: any; params: any};
  HomePageScreen: undefined;
  UploadPost: undefined;
  ProfileScreen: undefined;
  PostScreen: {postId: any};
  SplashScreen: undefined;
  NotifyMeRedirectScreen: undefined;
  MultipleLoginRedirectScreen: undefined;
  UnauthorisedLoginRedirectScreen: undefined;
};
const {width} = Dimensions.get('window');
const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: [
    'https://indoor-paying-campaign-films.trycloudflare.com',
    'tallybuzz://',
  ],
  config: {
    screens: {
      HomeScreen: 'home',
      SignUpScreen: 'signup',
      LoginScreen: 'login',
      HomePageScreen: 'homepage',
      UploadPost: 'uploadpost',
      ProfileScreen: 'profile',
      PostScreen: 'post/:postId',
    },
  },
};

const MainNavigator = () => {
  return (
    <NavigationContainer
      linking={linking}
      ref={ref => NavigationServices.setTopLevelNavigator(ref)}>
      <Stack.Navigator>
        <Stack.Screen
          name="SplashScreen"
          component={SplashScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="NotifyMeRedirectScreen"
          component={NotifyMeRedirectScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="MultipleLoginRedirectScreen"
          component={MultipleLoginRedirectScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="UnauthorisedLoginRedirectScreen"
          component={UnauthorisedLoginRedirectScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="HomeScreen"
          component={HomeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="SignUpScreen"
          component={SignUpScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="HomePageScreen"
          component={HomePageScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="UploadPost"
          component={UploadPost}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="ProfileScreen"
          component={ProfileScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="PostScreen"
          component={PostScreen}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default MainNavigator;

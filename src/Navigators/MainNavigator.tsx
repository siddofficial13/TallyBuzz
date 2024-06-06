import React, { useState, useEffect, useRef } from 'react';
import { Dimensions } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

import HomeScreen from '../Screens/HomeScreen';
import LoginScreen from '../Screens/LoginScreen';
import SignUpScreen from '../Screens/SignUpScreen';
import HomePageScreen from '../Screens/HomePageScreen';
import UploadPost from '../Screens/UploadPost';
import ProfileScreen from '../Screens/ProfileScreen';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PostScreen from '../Screens/PostScreen';
import NavigationServices from './NavigationServices'; // Adjust the path as needed

export type RootStackParamList = {
  HomeScreen: undefined;
  SignUpScreen: undefined;
  LoginScreen: { screen: any, params: any };
  HomePageScreen: undefined;
  UploadPost: undefined;
  ProfileScreen: undefined;
  PostScreen: { postId: any };
};

const { width } = Dimensions.get('window');

const Stack = createNativeStackNavigator<RootStackParamList>();

const MainNavigator = () => {
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const [currentRoute, setCurrentRoute] = useState<string | undefined>(undefined);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Handle user state changes
  const onAuthStateChanged = (user: any) => {
    setUser(user);
    if (initializing) setInitializing(false);
  };

  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged(onAuthStateChanged);

    const navRef = navigationRef.current;
    if (navRef) {
      NavigationServices.setTopLevelNavigator(navRef);
      const unsubscribeNav = navRef.addListener('state', () => {
        const route = navRef.getCurrentRoute();
        setCurrentRoute(route?.name);
      });

      return () => {
        unsubscribeNav();
      };
    }

    return () => {
      unsubscribeAuth();
    };
  }, []);

  if (initializing) return null; // You can return a loading spinner here

  const showHeaderFooter = ['HomePageScreen', 'UploadPost', 'ProfileScreen'].includes(currentRoute);

  return (
    <NavigationContainer
      ref={ref => NavigationServices.setTopLevelNavigator(ref)}>
      {showHeaderFooter && <Header />}
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen name="HomePageScreen" component={HomePageScreen} options={{ headerShown: false }} />
            <Stack.Screen name="UploadPost" component={UploadPost} options={{ headerShown: false }} />
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PostScreen" component={PostScreen} options={{ headerShown: false }} />
          </>
        ) : (
          <>
            <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SignUpScreen" component={SignUpScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
      {showHeaderFooter && <Footer />}
    </NavigationContainer>
  );
};

export default MainNavigator;

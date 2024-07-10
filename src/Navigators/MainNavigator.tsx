import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  NavigationContainer,
  useNavigationContainerRef,
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
import LoadingScreen from '../Screens/LoadingScreen';
import NotificationPage from '../Screens/NotificationPage';
import Footer from '../components/Footer';
import Header from '../components/Header';
import { UserProvider } from '../context/UserContext';
import SwitchUserScreen from '../Screens/SwitchUserScreen';
import PageNotFoundScreen from '../Screens/PageNotFoundScreen'

export type RootStackParamList = {
  HomeScreen: undefined;
  SignUpScreen: undefined;
  LoginScreen: { screen: any; params: any, intended_user: string, time: any };
  HomePageScreen: undefined;
  UploadPost: undefined;
  ProfileScreen: undefined;
  PostScreen: { postId: any };
  SplashScreen: undefined;
  NotifyMeRedirectScreen: undefined;
  LoadingScreen: undefined;
  NotificationPage: undefined;
  SwitchUserScreen: undefined;
  PageNotFoundScreen: { postId: any }
};
const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ['https://tallybuzz.dynalinks.app/', 'tallybuzz://'],
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

const MainNavigator: React.FC = () => {
  const navigationRef = useNavigationContainerRef();
  const [currentRoute, setCurrentRoute] = useState<any>(
    undefined,
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isReady) {
      NavigationServices.setTopLevelNavigator(navigationRef);
    }
  }, [isReady, navigationRef]);

  useEffect(() => {
    const getCurrentRouteName = () => {
      setCurrentRoute(navigationRef.getCurrentRoute()?.name);
    };

    const unsubscribe = navigationRef.addListener('state', getCurrentRouteName);

    return () => unsubscribe();
  }, [navigationRef]);

  const showHeaderFooter = [
    'HomePageScreen',
    'UploadPost',
    'ProfileScreen',
    'PostScreen',
    'NotificationPage',
    'SwitchUserScreen',
  ].includes(currentRoute);

  return (
    <UserProvider>
      <NavigationContainer
        linking={linking}
        ref={navigationRef}
        onReady={() => {
          setIsReady(true);
          setCurrentRoute(navigationRef.getCurrentRoute()?.name);
        }}>
        {showHeaderFooter && <Header />}
        <Stack.Navigator>
          <Stack.Screen
            name="SplashScreen"
            component={SplashScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NotifyMeRedirectScreen"
            component={NotifyMeRedirectScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HomeScreen"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LoginScreen"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUpScreen"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HomePageScreen"
            component={HomePageScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="UploadPost"
            component={UploadPost}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LoadingScreen"
            component={LoadingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ProfileScreen"
            component={ProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PostScreen"
            component={PostScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NotificationPage"
            component={NotificationPage}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SwitchUserScreen"
            component={SwitchUserScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PageNotFoundScreen"
            component={PageNotFoundScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
        {showHeaderFooter && <Footer />}
      </NavigationContainer>
    </UserProvider>
  );
};

export default MainNavigator;

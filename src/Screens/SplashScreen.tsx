import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Auth from '@react-native-firebase/auth';
import { StackActions, useNavigation } from '@react-navigation/native';

import NavigationServices from '../Navigators/NavigationServices';
import { markNotificationAsSeen } from '../Utils/NotificationServices';
import * as Keychain from 'react-native-keychain';
import auth from '@react-native-firebase/auth';

const USERS_KEY = 'logged_in_users';

type SplashScreenProps = {
    navigation: any; // Use the correct type for navigation if available
};

let screen = 'HomePageScreen';
let params: { postId?: string } = {};
let intended_user = '';
let time = '';
let postid = ''
let Redirect_to = ''
let UserId = ''
let Timestamp = ''

export const handleNavigationFromBackground = async (data: any) => {
    console.log('handleNavigation called with data:', data);

    if (data && data.redirect_to) {
        const { redirect_to, postId, userId, timestamp } = data;

        postid = postId;
        Redirect_to = redirect_to
        UserId = userId
        Timestamp = timestamp

        const user = auth().currentUser;
        const intended_user_here = data?.userId;
        console.log('Current user:', user);

        const getUserCredentialsFromStorage = async (userId: any) => {
            const existingUsers = await Keychain.getGenericPassword({ service: USERS_KEY });
            if (existingUsers) {
                const users = JSON.parse(existingUsers.password);
                return users[userId];
            }
            return null;
        };

        if (user && intended_user_here && user.uid === intended_user_here) {
            markNotificationAsSeen(data.userId, timestamp);
            console.log('Navigating as current user to:', data.redirect_to);
            screen = redirect_to;
            params = { postId: data.postId };
        } else if ((user && intended_user_here && user.uid !== intended_user_here) || (!user && intended_user_here)) {
            console.log('Checking storage for intended user:', intended_user_here);
            const storedCredentials = await getUserCredentialsFromStorage(intended_user_here);
            if (storedCredentials) {
                try {
                    const userCredential = await auth().signInWithEmailAndPassword(storedCredentials.email, storedCredentials.password);
                    console.log('Intended user signed in:', userCredential.user);

                    console.log('Navigating as intended user to:', data.redirect_to);
                    markNotificationAsSeen(data.userId, timestamp);
                    screen = redirect_to;
                    console.log(screen);
                    params = { postId: data.postId };

                } catch (error) {
                    console.error('Error logging in as intended user:', error);
                }

            } else {
                console.log('No stored credentials for intended user. Navigating to login screen.');
                // navigateToLogin('');
                screen = 'LoginScreen';
                intended_user = intended_user_here;
                time = timestamp
                params = { postId: data.postId };
            }
        } else {
            console.log('Navigating to Login with redirect to:', data.redirect_to);
            screen = 'LoginScreen';
            intended_user = intended_user_here;
            time = timestamp
            params = { postId: data.postId };
        }
    }
};

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
    const navigateToLogin = (message: string) => {
        NavigationServices.navigate('LoginScreen', {
            screen: Redirect_to,
            params: params,
            intended_user: UserId,
            time: Timestamp,
        });
    };
    useEffect(() => {
        setTimeout(() => {
            Auth().onAuthStateChanged(user => {
                let routeName = ''
                if (user && screen === 'HomePageScreen') routeName = 'HomePageScreen';
                else if (user && screen !== 'LoginScreen' && screen !== 'HomePageScreen') routeName = screen;
                else if (screen === 'LoginScreen') routeName = 'LoginScreen';
                else if (!user) routeName = 'HomeScreen'
                // const routeName = (screen !== 'HomePageScreen' && screen !== 'LoginScreen') ? screen : 'HomePageScreen';
                console.log(`${routeName} i am in splash screen`);
                if (routeName === 'LoginScreen') navigateToLogin('');
                else navigation.dispatch(StackActions.replace(routeName, { ...params }));
            });
        }, 4000);

        return () => { };
    }, []);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#000', padding: 40 }}>Redirecting</Text>
            <Image
                source={require('../assets/logo.png')}
                style={styles.headerImage}
                resizeMode="contain"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    headerImage: {
        width: 100,
        height: 40,
    },
});

export default SplashScreen;

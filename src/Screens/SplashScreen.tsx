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

export const handleNavigation = async (data: any) => {
    console.log('handleNavigation called with data:', data);

    if (data && data.redirect_to) {
        const { redirect_to, postId, userId, timestamp } = data;

        const user = auth().currentUser;
        const intended_user = data?.userId;
        console.log('Current user:', user);

        const navigateToLogin = (message: string) => {
            NavigationServices.navigate('LoginScreen', {
                screen: data.redirect_to,
                params: { postId },
                intended_user: data.userId,
                time: timestamp,
            });
        };

        const getUserCredentialsFromStorage = async (userId: any) => {
            const existingUsers = await Keychain.getGenericPassword({ service: USERS_KEY });
            if (existingUsers) {
                const users = JSON.parse(existingUsers.password);
                return users[userId];
            }
            return null;
        };

        if (user && intended_user && user.uid === intended_user) {
            markNotificationAsSeen(data.userId, timestamp);
            console.log('Navigating as current user to:', data.redirect_to);
            screen = redirect_to;
            params = { postId: data.postId };
        } else if ((user && intended_user && user.uid !== intended_user) || (!user && intended_user)) {
            console.log('Checking storage for intended user:', intended_user);
            const storedCredentials = await getUserCredentialsFromStorage(intended_user);
            if (storedCredentials) {
                try {
                    const userCredential = await auth().signInWithEmailAndPassword(storedCredentials.email, storedCredentials.password);
                    console.log('Intended user signed in:', userCredential.user);

                    console.log('Navigating as intended user to:', data.redirect_to);
                    markNotificationAsSeen(data.userId, timestamp);
                    screen = redirect_to;
                    params = { postId: data.postId };

                } catch (error) {
                    console.error('Error logging in as intended user:', error);
                }

            } else {
                console.log('No stored credentials for intended user. Navigating to login screen.');
                navigateToLogin('');
            }
        } else {
            console.log('Navigating to Login with redirect to:', data.redirect_to);
            navigateToLogin('');
        }
    }
};

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
    useEffect(() => {
        setTimeout(() => {
            Auth().onAuthStateChanged(user => {
                const routeName = (user !== null && screen) ? screen : 'LoginScreen';
                navigation.dispatch(StackActions.replace(routeName, { ...params }));
            });
        }, 1000);

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

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */

import {
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  StatusBar,
  Image,
  Alert,
} from 'react-native';
import React, {useState} from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../Navigators/MainNavigator';
import {StackActions} from '@react-navigation/native';
import apiUrl from '../Utils/urls';
import {loginUser} from '../Utils/authService';

type LoginProps = NativeStackScreenProps<RootStackParamList, 'LoginScreen'>;

const markNotificationAsSeen = async (userId: any, timestamp: any) => {
  try {
    const userRef = firestore().collection('Users').doc(userId);
    const userDoc = await userRef.get();
    console.log(timestamp);
    if (userDoc.exists) {
      const notifications = userDoc.data()?.notifications || [];

      // Find the notification with the same timestamp and seen status as false
      const notificationIndex = notifications.findIndex(
        (notification: any) =>
          notification.timestamp === timestamp && notification.seen === false,
      );

      if (notificationIndex !== -1) {
        // Update the seen status to true
        notifications[notificationIndex].seen = true;

        // Update the user's document
        await userRef.update({notifications: notifications});
        console.log(`Notification marked as seen for user: ${userId}`);
      } else {
        console.log(`No matching notification found for user: ${userId}`);
      }
    } else {
      console.error(`User document not found for user ID: ${userId}`);
    }
  } catch (error) {
    console.error(
      `Error marking notification as seen for user: ${userId}`,
      error,
    );
  }
};
const LoginScreen = ({navigation, route}: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {screen, params, intended_user, time} = route.params || {};

  const handleLogin = async () => {
    try {
      if (email.length > 0 && password.length > 0) {
        const userId = await loginUser(email, password);
        console.log(userId);
        // console.log(time);
        console.log(intended_user);

        if (intended_user && userId !== intended_user) {
          Alert.alert('Error', 'This notification is not for you.');
          return;
        }

        const fcmToken = await messaging().getToken();
        const userDoc = await firestore().collection('Users').doc(userId).get();
        let tokensToNotify: string[] = [];
        let fcm_token_array: string[] = [];
        if (userDoc.exists) {
          const userData = userDoc.data();
          const fcmtokens = userData?.fcmtoken || [];

          // Get tokens except the current one
          tokensToNotify = fcmtokens.filter(
            (token: string) => token !== fcmToken,
          );

          // Check if the current FCM token is already in the array
          if (!fcmtokens.includes(fcmToken)) {
            // Add the new FCM token to the array
            fcmtokens.push(fcmToken);
            await firestore().collection('Users').doc(userId).update({
              fcmtoken: fcmtokens,
            });
          }
          fcm_token_array = fcmtokens;
        }
        if (intended_user) {
          markNotificationAsSeen(intended_user, time);
          navigation.reset({
            index: 0,
            routes: [{name: screen || 'HomePageScreen', params}],
          });
        }
      } else {
        Alert.alert('Please enter your credentials');
      }
    } catch (error: any) {
      console.log(error);
      Alert.alert('Login failed', error.message);
    }
  };
  const sendResetPassMail = async () => {
    if (!email) {
      Alert.alert('Please enter your email address to reset your password.');
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/send-reset-pass-mail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({email}),
      });

      // const contentType = response.headers.get('content-type');
      const text = await response.text();
      if (response.ok) {
        Alert.alert('Password reset mail , check your mail box.');
      } else {
        Alert.alert(
          `Failed to send password reset email. Server response: ${text}`,
        );
      }
    } catch (error: any) {
      Alert.alert(`Error: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Image source={require('../assets/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email ID"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        value={email}
        onChangeText={text => setEmail(text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChangeText={text => setPassword(text)}
      />
      <TouchableOpacity onPress={sendResetPassMail}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          handleLogin();
        }}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <Text
        style={styles.signupText}
        onPress={() => {
          navigation.navigate('SignUpScreen');
        }}>
        A new user? Signup Here
      </Text>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20, // Adjust padding to move content up
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 16,
    color: '#000',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 8,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  signupText: {
    marginTop: 20,
    fontSize: 16,
    color: '#000',
    textDecorationLine: 'underline', // Optional: to add underline
  },
  forgotPasswordText: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    color: '#000', //'#007bff',
    textDecorationLine: 'underline',
  },
});

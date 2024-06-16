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
import React, { useState } from 'react';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigators/MainNavigator';

type LoginProps = NativeStackScreenProps<RootStackParamList, 'LoginScreen'>;

// Function to store a token
const storeToken = async (token: string) => {
  try {
    // Reference to the collection
    const tokenCollectionRef = firestore().collection('multipleLoginfcmtoken');

    // Query the collection to get existing tokens
    const snapshot = await tokenCollectionRef.get();

    // If there are existing tokens, delete them
    if (!snapshot.empty) {
      // Use batch to perform multiple operations atomically
      const batch = firestore().batch();

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    }

    // Store the new token
    await tokenCollectionRef.add({ token });

    console.log('Token stored successfully');
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

const LoginScreen = ({ navigation, route }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { screen, params } = route.params || {};

  const handleLogin = async () => {
    try {
      if (email.length > 0 && password.length > 0) {
        const isUserLogin = await auth().signInWithEmailAndPassword(
          email,
          password,
        );

        const userId = isUserLogin.user.uid;
        const fcmToken = await messaging().getToken();
        await storeToken(fcmToken);
        // Fetch the user document
        const userDoc = await firestore().collection('Users').doc(userId).get();
        let tokensToNotify: string[] = [];
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
        }
        const sendNotificationMultipleLogin = async () => {
          if (tokensToNotify && Array.isArray(tokensToNotify)) {
            tokensToNotify.forEach(token => {
              fetch(
                'https://baker-subscribers-exhibits-outlets.trycloudflare.com/send-broadcast-multiple-login',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    token: token,
                    title: 'Logged in from another device',
                    body: 'You have logged in from another device. Check to see the details.',
                    data: 'MultipleLoginRedirectScreen',
                  }),
                },
              );
            });
          }
        };

        await sendNotificationMultipleLogin();
        navigation.reset({
          index: 0,
          routes: [{ name: screen || 'HomePageScreen', params }],
        });

      } else {
        Alert.alert('Please enter your credentials');
      }
    } catch (error: any) {
      console.log(error);
      Alert.alert('Login failed', error.message);
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
});

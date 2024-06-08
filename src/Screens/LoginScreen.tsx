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
import { StackActions } from '@react-navigation/native';

type LoginProps = NativeStackScreenProps<RootStackParamList, 'LoginScreen'>;

const LoginScreen = ({ navigation, route }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { screen, params } = route.params || {};

  const handleLogin = async () => {
    try {
      if (email.length > 0 && password.length > 0) {
        const isUserLogin = await auth().signInWithEmailAndPassword(email, password);

        const userId = isUserLogin.user.uid;
        const fcmToken = await messaging().getToken();

        // Fetch the user document
        const userDoc = await firestore().collection('Users').doc(userId).get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          const fcmtokens = userData?.fcmtoken || [];

          // Check if the current FCM token is already in the array
          if (!fcmtokens.includes(fcmToken)) {
            // Add the new FCM token to the array
            fcmtokens.push(fcmToken);
            await firestore().collection('Users').doc(userId).update({
              fcmtoken: fcmtokens,
            });
          }
        }

        navigation.dispatch(StackActions.replace(screen || 'HomePageScreen', params));
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

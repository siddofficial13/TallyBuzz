/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import {StyleSheet, Text, View, TouchableOpacity, Alert} from 'react-native';
import React from 'react';
import auth from '@react-native-firebase/auth';
import {useNavigation} from '@react-navigation/native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import {API_BASE_URL} from '@env';
const fetchToken = async () => {
  try {
    // Get a reference to the 'multipleLoginfcmtoken' collection
    const collectionRef = firestore().collection('multipleLoginfcmtoken');

    // Get all documents in the collection
    const querySnapshot = await collectionRef.get();

    // Initialize an array to store token values
    const tokens = [];

    // Iterate over each document snapshot
    querySnapshot.forEach(docSnapshot => {
      // Get the token value from each document
      const token = docSnapshot.data()?.token;
      if (token) {
        tokens.push(token);
      }
    });

    // If tokens array is not empty, return the first token
    if (tokens.length > 0) {
      console.log('Token fetched successfully:', tokens[0]);
      return tokens[0];
    } else {
      console.log('No tokens found in the documents');
      return null;
    }
  } catch (error) {
    console.error('Error fetching token:', error);
    return null;
  }
};
const MultipleLoginRedirectScreen = () => {
  const navigation = useNavigation();
  const handleLogin = async () => {
    try {
      // Fetch the token
      const token = await fetchToken();

      // Check if token is not null
      if (token !== null) {
        // Send notification to the current device (device Z)
        await fetch(
          'https://select-ireland-refinance-porsche.trycloudflare.com/send-notification-authorised-login',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: token,
              title: 'Authorized Login',
              body: 'You are authorized to login from this device',
              data: 'HomePageScreen',
            }),
          },
        );
        // const tokenCollectionRef = firestore().collection(
        //   'multipleLoginfcmtoken',
        // );
        // // Query the collection to get existing tokens
        // const snapshot = await tokenCollectionRef.get();
        // // If there are existing tokens, delete them
        // if (!snapshot.empty) {
        //   // Use batch to perform multiple operations atomically
        //   const batch = firestore().batch();
        //   snapshot.docs.forEach(doc => {
        //     batch.delete(doc.ref);
        //   });
        //   await batch.commit();
        // }
        console.log('API_BASE_URL:', API_BASE_URL);
      } else {
        console.log('No token found');
      }

      // Navigate to HomePageScreen after sending the notification
      navigation.navigate('HomePageScreen');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Logout failed', 'An error occurred while logging out.');
    }
  };
  const handleLogout = async () => {
    try {
      // Fetch the token
      const token = await fetchToken();

      // Check if token is not null
      if (token !== null) {
        // Send notification to the current device (device Z)
        await fetch(
          'https://select-ireland-refinance-porsche.trycloudflare.com/send-notification-unauthorised-login',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              token: token,
              title: 'Unauthorized Login',
              body: 'You are not authorized to login from this device',
              data: 'UnauthorisedLoginRedirectScreen',
            }),
          },
        );
        const tokenCollectionRef = firestore().collection(
          'multipleLoginfcmtoken',
        );
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
        console.log('API_BASE_URL:', API_BASE_URL);
      } else {
        console.log('No token found');
      }

      // Navigate to HomePageScreen after sending the notification
      navigation.navigate('HomePageScreen');
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Logout failed', 'An error occurred while logging out.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.message}>
        You logged in from another device. If it was not you, kindly logout.
      </Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Yes It was me.</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.logoutButton]}
          onPress={handleLogout}>
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MultipleLoginRedirectScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  logoutButton: {
    backgroundColor: '#ff0000',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

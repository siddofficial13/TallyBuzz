/* eslint-disable @typescript-eslint/no-unused-vars */
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {RootStackParamList} from '../Navigators/MainNavigator';
import {StackActions, useNavigation} from '@react-navigation/native';
type NotifyMeRedirectScreenProps = {
  navigation: any; // Use the correct type for navigation if available
};
const NotifyMeRedirectScreen: React.FC<NotifyMeRedirectScreenProps> = ({
  navigation,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>New app available</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('HomePageScreen')}>
        <Text style={styles.buttonText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NotifyMeRedirectScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20, // Add some space between the text and the button
  },
  button: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

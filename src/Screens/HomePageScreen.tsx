// Import libraries
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

import { RootStackParamList } from '../Navigators/MainNavigator';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

type HomePageScreenProps = NativeStackScreenProps<RootStackParamList, 'HomePageScreen'>;

const { width } = Dimensions.get('window');

const HomePageScreen = () => {
  return (
    <View style={styles.container}>
      {/* Header Section */}




      <ScrollView contentContainerStyle={styles.mainContent}>
        <View style={styles.post}>
          <Text style={styles.postText}>Post 1</Text>
        </View>
        <View style={styles.post}>
          <Text style={styles.postText}>Post 2</Text>
        </View>
        <View style={styles.post}>
          <Text style={styles.postText}>Post 3</Text>
        </View>
        {/* Add more posts as needed */}
      </ScrollView>

      {/* Footer Section */}


    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // white background
  },
  header: {
    width: '100%',
    height: 80,
    backgroundColor: '#fff', // white background
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4, // for Android
    shadowColor: '#000', // black shadow color for iOS
    shadowOffset: { width: 0, height: 2 }, // for iOS
    shadowOpacity: 0.8, // for iOS
    shadowRadius: 2, // for iOS
  },
  headerImage: {
    marginTop: 20,
    width: width,
    height: '80%',
    marginBottom: 20,
  },
  mainContent: {
    flexGrow: 1,
    backgroundColor: '#fff', // white background
    padding: 16,
    borderWidth: 2,
    margin: 10,
    borderColor: 'black', // dark black border
  },
  post: {
    backgroundColor: '#fff', // white background
    padding: 16,
    marginBottom: 16,
    elevation: 2, // for Android
    shadowColor: '#000', // black shadow color for iOS
    shadowOffset: { width: 0, height: 1 }, // for iOS
    shadowOpacity: 0.8, // for iOS
    shadowRadius: 1, // for iOS
  },
  postText: {
    color: '#000', // black text color
  },

});

export default HomePageScreen;

import {Dimensions, Image, StyleSheet, Text, View} from 'react-native';
import React from 'react';
const {width} = Dimensions.get('window');

export default function Header() {
  return (
    <View style={styles.header}>
      <Image
        source={require('../assets/logo.png')} // replace with your image path
        style={styles.headerImage}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    height: 80,
    backgroundColor: '#fff', // white background
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4, // for Android
    shadowColor: '#000', // black shadow color for iOS
    shadowOffset: {width: 0, height: 2}, // for iOS
    shadowOpacity: 0.8, // for iOS
    shadowRadius: 2, // for iOS
  },
  headerImage: {
    marginTop: 20,
    width: width,
    height: '80%',
    marginBottom: 20,
  },
});

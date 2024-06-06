import {Image, StyleSheet, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';

export default function Footer() {
  const navigation = useNavigation();
  const [activeButton, setActiveButton] = useState('HomePageScreen'); // Set default active button

  const handlePress = (screen: string) => {
    setActiveButton(screen);
    navigation.navigate(screen);
  };

  const getButtonStyle = (screen: string) => [
    styles.footerButton,
    // activeButton === screen && styles.activeButton,
  ];

  const getImageStyle = (screen: string) => [
    styles.footerImage,
    // activeButton === screen && styles.activeImage,
  ];

  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={getButtonStyle('HomePageScreen')}
        onPress={() => handlePress('HomePageScreen')}>
        <Image
          source={require('../assets/home.png')}
          style={getImageStyle('HomePageScreen')}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={getButtonStyle('UploadPost')}
        onPress={() => handlePress('UploadPost')}>
        <Image
          source={require('../assets/add.png')}
          style={getImageStyle('UploadPost')}
          resizeMode="contain"
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={getButtonStyle('ProfileScreen')}
        onPress={() => handlePress('ProfileScreen')}>
        <Image
          source={require('../assets/profile.png')}
          style={getImageStyle('ProfileScreen')}
          resizeMode="contain"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff', // white background
    color: '#000',
    elevation: 4, // for Android
    shadowColor: '#000', // black shadow color for iOS
    shadowOffset: {width: 0, height: 2}, // for iOS
    shadowOpacity: 0.8, // for iOS
    shadowRadius: 2, // for iOS
  },
  footerButton: {
    justifyContent: 'center',
    alignItems: 'center',
    color: '#000',
    padding: 10,
    borderRadius: 5,
  },
  activeButton: {
    backgroundColor: '#000',
  },
  footerImage: {
    width: 30,
    height: 30,
  },
  activeImage: {
    tintColor: '#fff',
  },
});

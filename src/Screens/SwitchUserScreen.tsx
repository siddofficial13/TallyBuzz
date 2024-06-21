/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-native/no-inline-styles */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
} from 'react-native';
import {
  getAllStoredUsers,
  switchUser,
  loginUser,
  deleteUserCredentials,
} from '../Utils/authService'; // Ensure the correct path
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';

export default function SwitchUserScreen() {
  const navigation = useNavigation();
  const [users, setUsers] = useState({});
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const fetchStoredUsers = async () => {
      try {
        const storedUsers = await getAllStoredUsers();
        setUsers(storedUsers);
      } catch (error) {
        console.error('Error fetching stored users:', error);
      }
    };

    fetchStoredUsers();
    console.log(auth().currentUser?.uid);
  }, []);

  const handleUserSwitch = async (userId: string) => {
    try {
      await switchUser(userId);
      navigation.reset({
        index: 0,
        routes: [{name: 'HomePageScreen'}],
      });
    } catch (error) {
      console.error(`Error switching user ${userId}:`, error);
    }
  };

  const handleAddUser = async () => {
    try {
      const userId = await loginUser(email, password);
      setEmail('');
      setPassword('');
      const updatedUsers = await getAllStoredUsers();
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleRemoveUser = async userId => {
    try {
      await deleteUserCredentials(userId);
      const updatedUsers = await getAllStoredUsers();
      setUsers(updatedUsers);
      if (auth().currentUser?.uid === userId) {
        await auth().signOut();
        console.log(auth().currentUser?.uid);
        navigation.navigate('LoginScreen');
      }
    } catch (error) {
      console.error(`Error removing user ${userId}:`, error);
    }
  };

  return (
    <View style={styles.container}>
      {/* <Image source={require('../assets/logo.png')} style={styles.logo} /> */}
      <Text style={styles.headerText}>Choose Your Account to Login</Text>
      {Object.keys(users).length > 0 ? (
        Object.keys(users).map(userId => (
          <View
            key={userId}
            style={[
              styles.userItem,
              auth().currentUser?.uid === userId && styles.activeUserItem,
            ]}>
            <Text style={styles.userEmail}>{users[userId].email}</Text>
            <View style={styles.buttonContainer}>
              {auth().currentUser?.uid !== userId && (
                <TouchableOpacity
                  style={styles.switchButton}
                  onPress={() => handleUserSwitch(userId)}>
                  <Text style={styles.buttonText}>Switch</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveUser(userId)}>
                <Text style={styles.buttonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noUsersText}>
          No users available. Please log in.
        </Text>
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#000"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#000"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.addButton} onPress={handleAddUser}>
        <Text style={styles.addButtonText}>Add User</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    // marginTop: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: '100%',
    height: '10%',
    marginBottom: 100,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  userItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f0f0f0',
  },
  activeUserItem: {
    borderColor: '#000', // Changed to black
    backgroundColor: '#e6e6e6', // Slightly darkened background for active user
    shadowColor: '#000', // Black shadow for glow effect
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10, // Adds glow effect for Android
  },
  userEmail: {
    color: '#000',
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  switchButton: {
    backgroundColor: '#000', //'#007bff',
    padding: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  removeButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingLeft: 8,
    width: '100%',
    color: '#000',
  },
  addButton: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
  },
  noUsersText: {
    color: '#000',
    marginBottom: 20,
  },
});

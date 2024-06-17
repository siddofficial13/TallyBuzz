import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {useNavigation} from '@react-navigation/native';
import React, {useState, useEffect} from 'react';
import {useUser} from '../context/UserContext';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';

const sendNotification = async userId => {
  try {
    const userDoc = await firestore().collection('Users').doc(userId).get();
    const userTokens = userDoc.data()?.fcmtoken;

    if (userTokens && Array.isArray(userTokens)) {
      await Promise.all(
        userTokens.map(async token => {
          await fetch(
            'https://prayers-examined-pending-intensity.trycloudflare.com/send-notification-user-update-profile',
            {
              method: 'post',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: token,
                data: {
                  redirect_to: 'ProfileScreen',
                  userId: userId,
                },
              }),
            },
          );
        }),
      );
    } else {
      console.error('User tokens not found or not an array');
    }
  } catch (error) {
    console.error('Error fetching user tokens: ', error);
  }
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const {user, setUser, fetchUserData} = useUser();
  const [password, setPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState(''); // Add this line
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState('');
  const [isNotifyPressed, setIsNotifyPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notifyStatus, setNotifyStatus] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth().currentUser;
        if (user) {
          const userDoc = await firestore()
            .collection('Users')
            .doc(user.uid)
            .get();
          const userData = userDoc.data();
          if (userData) {
            setName(userData.name || '');
            setEmail(user.email || '');
            setPassword(userData.password || '');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const checkNotifyStatus = async () => {
      try {
        const user = auth().currentUser;
        if (user) {
          firestore()
            .collection('Notify')
            .doc(user.uid)
            .onSnapshot(doc => {
              if (doc.exists) {
                const data = doc.data();
                if (
                  data?.fcmtoken &&
                  data?.fcmtoken.length > 0 &&
                  data?.userId
                ) {
                  setNotifyStatus('notified');
                } else if (data?.userId) {
                  setNotifyStatus('viewFunctionality');
                } else {
                  setNotifyStatus(null);
                }
              } else {
                setNotifyStatus(null);
              }
            });
        }
      } catch (error) {
        console.error('Error checking notify status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
    checkNotifyStatus();
  }, []);

  const reauthenticateUser = async (currentPassword: any) => {
    const user = auth().currentUser;
    if (user && user.email) {
      const credentials = auth.EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await user.reauthenticateWithCredential(credentials);
    } else {
      throw new Error(
        'No user is currently signed in or user email is missing',
      );
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore()
          .collection('Users')
          .doc(user.uid)
          .get();
        const userName = userDoc.data()?.name;
        const userPass = userDoc.data()?.password;

        if (userName === name && userPass === password) {
          Alert.alert('Same name and password as previous');
        } else {
          if (password) {
            try {
              await reauthenticateUser(currentPassword);
              await user.updatePassword(password);
              await firestore()
                .collection('Users')
                .doc(user.uid)
                .update({password});
            } catch (reauthError) {
              console.error('Re-authentication failed:', reauthError);
              Alert.alert(
                'Re-authentication failed',
                'Please re-authenticate to update your password.',
              );
              return;
            }
          }

          if (name) {
            await firestore().collection('Users').doc(user.uid).update({name});
            setUser(prevState => ({...prevState, name}));
          }
          console.log('Profile updated');
          sendNotification(user.uid);
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleNotifyMe = async () => {
    setIsNotifyPressed(true);
    try {
      const user = auth().currentUser;
      if (user) {
        const notifyDoc = await firestore()
          .collection('Notify')
          .doc(user.uid)
          .get();
        if (!notifyDoc.exists) {
          const userDoc = await firestore()
            .collection('Users')
            .doc(user.uid)
            .get();
          const userTokens = userDoc.data()?.fcmtoken;

          if (userTokens && Array.isArray(userTokens)) {
            await firestore().collection('Notify').doc(user.uid).set({
              userId: user.uid,
              fcmtoken: userTokens,
            });
            setNotifyStatus('notified');
          } else {
            console.error('FCM tokens not found or not an array for the user');
          }
        }
      }
    } catch (error) {
      console.error('Error handling notify me:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth().signOut();
      console.log('Logged out');
      const currentUser = auth().currentUser;
      console.log('User after logout:', currentUser);
      navigation.reset({
        index: 0,
        routes: [{name: 'LoginScreen'}],
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.userInfoContainer}>
          <Text style={styles.userInfo}>Name: {name}</Text>
          <Text style={styles.userInfo}>Email: {email}</Text>
        </View>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Update Profile</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Image
              source={require('../assets/logout.png')}
              style={styles.logoutImage}
            />
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Update Name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Update Password"
          placeholderTextColor="#999"
          secureTextEntry={true}
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Current Password"
          placeholderTextColor="#999"
          secureTextEntry={true}
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
          <Text style={styles.buttonText}>Update Profile</Text>
        </TouchableOpacity>
        <View style={styles.notifySection}>
          <Text style={styles.lightAppText}>
            We are working on a lighter version of the app
          </Text>
          <Text style={styles.lightAppText}>
            Would you like to get notified when the app is ready to use
          </Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : (
            <>
              {notifyStatus === 'notified' ? (
                <TouchableOpacity
                  style={[
                    styles.notifyButton,
                    isNotifyPressed && styles.notifyButtonPressed,
                  ]}
                  disabled={true}>
                  <Text style={styles.buttonText}>
                    You will be notified soon
                  </Text>
                </TouchableOpacity>
              ) : notifyStatus === 'viewFunctionality' ? (
                <TouchableOpacity
                  style={styles.viewFunctionalityButton}
                  onPress={() => navigation.navigate('NotifyMeRedirectScreen')}>
                  <Text style={styles.buttonText}>View New Functionality</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.notifyButton,
                    isNotifyPressed && styles.notifyButtonPressed,
                  ]}
                  onPress={handleNotifyMe}
                  disabled={isNotifyPressed}>
                  <Text style={styles.buttonText}>Notify Me</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
  },
  userInfoContainer: {
    marginBottom: 20,
  },
  userInfo: {
    fontSize: 18,
    color: '#000',
    marginBottom: 10,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.8,
    shadowRadius: 2,
    borderRadius: 5,
  },
  logoutImage: {
    width: 24,
    height: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 20,
    borderRadius: 5,
    color: '#000',
  },
  button: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  notifySection: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.8,
    shadowRadius: 2,
    marginBottom: 20,
  },
  lightAppText: {
    textAlign: 'center',
    color: '#000',
    marginVertical: 10,
  },
  notifyButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  notifyButtonPressed: {
    backgroundColor: '#ccc',
  },
  viewFunctionalityButton: {
    backgroundColor: '#000',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
});

export default ProfileScreen;

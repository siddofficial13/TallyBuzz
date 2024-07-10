import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { getAllStoredUsers, switchUser, loginUser, deleteUserCredentials } from '../Utils/authService';  // Ensure the correct path
import auth from '@react-native-firebase/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../Navigators/MainNavigator';
import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';

type SwitchProps = NativeStackScreenProps<RootStackParamList, 'SwitchUserScreen'>;

export default function SwitchUserScreen({ route, navigation }: SwitchProps) {
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
                routes: [{ name: 'HomePageScreen' }],
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
        } catch (error) {
            Alert.alert('Invalid Credentials')
            console.error('Error adding user:', error);
        }
    };

    const handleRemoveUser = async (userId: string) => {
        try {
            await deleteUserCredentials(userId);
            const updatedUsers = await getAllStoredUsers();
            setUsers(updatedUsers);
            if (auth().currentUser?.uid === userId) {
                await auth().signOut();
                console.log(auth().currentUser?.uid);
                navigation.navigate('HomeScreen');
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
                Object.keys(users).map((userId) => (
                    <View
                        key={userId}
                        style={[
                            styles.userItem,
                            auth().currentUser?.uid === userId && styles.activeUserItem
                        ]}
                    >
                        <Text style={styles.userEmail}>{users[userId].email}</Text>
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.switchButton}
                                onPress={() => handleUserSwitch(userId)}
                            >

                                <Text style={styles.buttonText}>Switch</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => handleRemoveUser(userId)}
                            >
                                <Text style={styles.buttonText}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            ) : (
                <Text style={styles.noUsersText}>No users available. Please log in.</Text>
            )}
            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor='#000'
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor='#000'
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
        borderColor: '#000',
        borderWidth: 3,
    },
    userEmail: {
        color: '#000',
        flex: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
    },
    switchButton: {
        backgroundColor: '#000',//'#007bff',
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

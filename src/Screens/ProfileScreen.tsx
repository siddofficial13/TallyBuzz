import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ProfileScreen: React.FC = () => {
    const navigation = useNavigation();
    let [password, setPassword] = useState('');
    let [name, setName] = useState('');

    const handleUpdateProfile = async () => {
        try {
            const user = auth().currentUser;
            if (user) {
                // Update password in Firebase Auth
                const userDoc = await firestore().collection('Users').doc(user.uid).get();
                const userName = userDoc.data()?.name
                const userpass = userDoc.data()?.password
                console.log(userName)
                console.log(userpass)

                if (userName === name && userpass === password) {
                    Alert.alert('Same name and password as previous')
                }
                else {
                    if (password) {
                        await user.updatePassword(password);
                        console.log('Password updated in Firebase Auth');
                        await firestore()
                            .collection('Users')
                            .doc(user.uid)
                            .update({ password });
                        console.log('password updated in Firestore');
                    }

                    // Update name in Firestore
                    if (name) {
                        await firestore()
                            .collection('Users')
                            .doc(user.uid)
                            .update({ name });
                        console.log('Name updated in Firestore');
                    }
                    console.log('Profile updated');
                    Alert.alert('Profile Updated');
                }
            }
        } catch (error) {
            console.error('Error updating profile:', error.message);
        }
    };

    const handleNotifyMe = () => {
        console.log('Notify me button pressed');
    };

    const handleLogout = async () => {
        try {
            await auth().signOut();
            console.log('Logged out');

            const currentUser = auth().currentUser;
            console.log('User after logout:', currentUser);

            // Navigate to the login screen
            navigation.navigate('LoginScreen');
        } catch (error) {
            console.error('Error logging out:', error.message);
        }
    };

    return (
        <View style={styles.container}>
            <Header />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.headerContainer}>
                    <Text style={styles.header}>Update Profile</Text>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Image source={require('../assets/logout.png')} style={styles.logoutImage} />
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
                <TouchableOpacity style={styles.button} onPress={handleUpdateProfile}>
                    <Text style={styles.buttonText}>Update Profile</Text>
                </TouchableOpacity>
                <View style={styles.notifySection}>
                    <Text style={styles.lightAppText}>We are working on a lighter version of the app</Text>
                    <Text style={styles.lightAppText}>Would you like to get notified when the app is ready to use</Text>
                    <TouchableOpacity style={styles.notifyButton} onPress={handleNotifyMe}>
                        <Text style={styles.buttonText}>Notify Me</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.poweredByText}>Powered by Tally Solutions</Text>
                <TouchableOpacity>
                    <Text style={styles.websiteLink}>Visit our website</Text>
                </TouchableOpacity>
            </ScrollView>
            <Footer />
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
        shadowOffset: { width: 0, height: 2 },
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
        shadowOffset: { width: 0, height: 2 },
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
    poweredByText: {
        textAlign: 'center',
        color: '#000',
        marginVertical: 10,
    },
    websiteLink: {
        textAlign: 'center',
        color: '#000',
        textDecorationLine: 'underline',
    },
});

export default ProfileScreen;
